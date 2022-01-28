import crypto from 'crypto'
import { ethers } from 'ethers'
import jsonwebtoken from 'jsonwebtoken'
import { Op } from 'sequelize'
import { v4 as uuidv4 } from 'uuid'
import MeemIDABI from '../abis/MeemID.json'
import MeemIdentification from '../models/MeemIdentification'
import Twitter from '../models/Twitter'
import Wallet from '../models/Wallet'
import { MeemID } from '../types'
import { MeemAPI } from '../types/meem.generated'

export default class MeemIdService {
	public static meemIdContract() {
		const provider = new ethers.providers.JsonRpcProvider(
			config.NETWORK === 'rinkeby'
				? config.JSON_RPC_RINKEBY
				: config.JSON_RPC_POLYGON
		)
		const wallet = new ethers.Wallet(config.WALLET_PRIVATE_KEY, provider)

		const meemIdContract = new ethers.Contract(
			config.MEEM_ID_PROXY_ADDRESS,
			MeemIDABI,
			wallet
		) as MeemID

		return meemIdContract
	}

	public static async getNonce(options: { address: string }) {
		// Generate a nonce and save it for the wallet
		const address = options.address.toLowerCase()

		let wallet = await orm.models.Wallet.findByAddress(address)

		if (!wallet) {
			wallet = orm.models.Wallet.build({
				address
			})
		}

		wallet.nonce = `I'm verifying that I am the owner of wallet: ${
			options.address
		}\n\nBy signing this random key:\n${crypto.randomBytes(50).toString('hex')}`
		await wallet.save()

		return wallet.nonce
	}

	public static async login(options: {
		address?: string
		signature?: string
		twitterAccessToken?: string
		twitterAccessSecret?: string
	}) {
		const { address, signature, twitterAccessToken, twitterAccessSecret } =
			options

		let meemIdentificationId

		if (address && signature) {
			const wallet = await this.verifySignature({ address, signature })
			if (!wallet.MeemIdentificationId) {
				throw new Error('MEEM_ID_WALLET_NOT_CONNECTED')
			}
			meemIdentificationId = wallet.MeemIdentificationId
		}
		if (twitterAccessToken && twitterAccessSecret) {
			const user = await services.twitter.getUser({
				accessToken: twitterAccessToken,
				accessSecret: twitterAccessSecret
			})
			const twitter = await orm.models.Twitter.findOne({
				where: {
					twitterId: user.id_str
				}
			})
			if (!twitter?.MeemIdentificationId) {
				throw new Error('MEEM_ID_TWITTER_NOT_CONNECTED')
			}

			meemIdentificationId = twitter.MeemIdentificationId
		}
		if (!meemIdentificationId) {
			throw new Error('MEEM_ID_NOT_FOUND')
		}

		const meemId = await this.getMeemId({ meemIdentificationId })

		return { meemId, jwt: this.generateJWT({ meemId: meemIdentificationId }) }
	}

	public static async verifySignature(options: {
		address: string
		signature: string
	}) {
		const { address, signature } = options

		const wallet = await orm.models.Wallet.findByAddress(address)

		if (!wallet || !wallet.nonce) {
			throw new Error('WALLET_NOT_FOUND')
		}

		const signingAddress = ethers.utils.verifyMessage(wallet.nonce, signature)
		if (signingAddress.toLowerCase() !== address.toLowerCase()) {
			throw new Error('SIGNATURE_FAILED')
		}

		return wallet
	}

	public static async createOrUpdateMeemId(options: {
		address: string
		signature: string
		twitterAccessToken: string
		twitterAccessSecret: string
	}) {
		const { address, signature, twitterAccessToken, twitterAccessSecret } =
			options
		try {
			const twitterUser = await services.twitter.getUser({
				accessToken: twitterAccessToken,
				accessSecret: twitterAccessSecret
			})

			await this.verifySignature({ address, signature })
			log.debug('Signature verified')

			let { recommendedGwei } = await services.web3.getGasEstimate({
				chain: MeemAPI.networkNameToChain(config.NETWORK)
			})

			if (recommendedGwei > config.MAX_GAS_PRICE_GWEI) {
				// throw new Error('GAS_PRICE_TOO_HIGH')
				log.warn(`Recommended fee over max: ${recommendedGwei}`)
				recommendedGwei = config.MAX_GAS_PRICE_GWEI
			}

			const meemIdContract = this.meemIdContract()

			log.debug('Creating MeemID w/ params', {
				address,
				twitterId: twitterUser.id_str
			})

			const createTx = await meemIdContract.createOrAddMeemID(
				address,
				twitterUser.id_str,
				{ gasPrice: services.web3.gweiToWei(recommendedGwei) }
			)

			log.debug(`Creating MeemID w/ transaction hash: ${createTx.hash}`)

			await createTx.wait()

			log.debug(`Created MeemID w/ transaction hash: ${createTx.hash}`)

			const meemIdData = await meemIdContract.getMeemIDByWalletAddress(
				address,
				{ gasLimit: 5000000 }
			)

			const [twitters, wallets] = await Promise.all([
				orm.models.Twitter.findAll({
					where: {
						twitterId: {
							[Op.in]: meemIdData.twitters
						}
					}
				}),
				orm.models.Wallet.findAllByAddresses(meemIdData.wallets)
			])

			const twittersCreateData: Record<string, any>[] = []
			const walletsCreateData: Record<string, any>[] = []

			let meemIdentificationId = this.findMeemIdentificationId({
				twitters,
				wallets
			})

			if (!meemIdentificationId) {
				meemIdentificationId = uuidv4()
				await orm.models.MeemIdentification.create({
					id: meemIdentificationId
				})
			}

			// See if we have a MeemPass already and if not, create one
			const meemPass = await orm.models.MeemPass.findOne({
				where: {
					MeemIdentificationId: meemIdentificationId
				}
			})

			if (!meemPass) {
				await orm.models.MeemPass.create({
					tweetsPerDayQuota: config.MEEMPASS_DEFAULT_TWEETS_PER_DAY_QUOTA,
					MeemIdentificationId: meemIdentificationId
				})
			}

			const promises: Promise<any>[] = []

			meemIdData.twitters.forEach(meemIdTwitter => {
				const existingTwitter = twitters.find(
					t => t.twitterId === meemIdTwitter
				)
				if (!existingTwitter) {
					twittersCreateData.push({
						id: uuidv4(),
						twitterId: meemIdTwitter,
						MeemIdentificationId: meemIdentificationId,
						isDefault:
							meemIdData.defaultTwitter.toLowerCase() ===
							meemIdTwitter.toLowerCase()
					})
				} else if (existingTwitter && !existingTwitter.MeemIdentificationId) {
					existingTwitter.MeemIdentificationId = meemIdentificationId
					promises.push(existingTwitter.save())
				}
			})

			meemIdData.wallets.forEach(meemIdWallet => {
				const existingWallet = wallets.find(
					w => w.address.toLowerCase() === meemIdWallet.toLowerCase()
				)
				if (!existingWallet) {
					walletsCreateData.push({
						id: uuidv4(),
						address: meemIdWallet,
						MeemIdentificationId: meemIdentificationId,
						isDefault:
							meemIdData.defaultWallet.toLowerCase() ===
							meemIdWallet.toLowerCase()
					})
				} else if (existingWallet && !existingWallet.MeemIdentificationId) {
					existingWallet.MeemIdentificationId = meemIdentificationId
					promises.push(existingWallet.save())
				}
			})

			if (twittersCreateData.length > 0) {
				promises.push(orm.models.Twitter.bulkCreate(twittersCreateData))
			}
			if (walletsCreateData.length > 0) {
				promises.push(orm.models.Wallet.bulkCreate(walletsCreateData))
			}

			await Promise.all(promises)

			const meemId = await this.getMeemId({ meemIdentificationId })

			const jwt = this.generateJWT({
				meemId: meemIdentificationId
			})

			await sockets?.emit({
				subscription: MeemAPI.MeemEvent.MeemIdUpdated,
				walletAddress: address,
				eventName: MeemAPI.MeemEvent.MeemIdUpdated,
				data: { meemId, jwt }
			})
		} catch (e) {
			log.crit(e)
			await sockets?.emitError(config.errors.SERVER_ERROR, address)
		}
	}

	public static async getMeemId(options: {
		meemIdentificationId?: string
		meemIdentification?: MeemIdentification | null
	}): Promise<MeemAPI.IMeemId> {
		const { meemIdentificationId } = options
		let { meemIdentification } = options
		if (!meemIdentification) {
			meemIdentification = await orm.models.MeemIdentification.findOne({
				where: {
					id: meemIdentificationId
				},
				include: [orm.models.Twitter, orm.models.Wallet, orm.models.MeemPass]
			})
		}

		if (!meemIdentification) {
			throw new Error('MEEM_ID_NOT_FOUND')
		}

		const tweetsPerDayQuota =
			meemIdentification.MeemPass?.tweetsPerDayQuota ?? 0

		let defaultWallet = MeemAPI.zeroAddress
		let defaultTwitter = ''

		const dw = meemIdentification.Wallets?.find(w => w.isDefault)
		if (dw) {
			defaultWallet = dw.address
		}

		const dt = meemIdentification.Twitters?.find(t => t.isDefault)
		if (dt) {
			defaultTwitter = dt.twitterId
		}

		return {
			wallets: meemIdentification?.Wallets?.map(w => w.address) ?? [],
			twitters: meemIdentification?.Twitters?.map(t => t.twitterId) ?? [],
			defaultWallet,
			defaultTwitter,
			hasOnboarded: meemIdentification.hasOnboarded,
			meemPass: {
				twitter: {
					hasApplied: meemIdentification.MeemPass?.hasApplied === true,
					isWhitelisted: tweetsPerDayQuota > 0,
					tweetsPerDayQuota
				},
				isAdmin: meemIdentification.MeemPass?.isAdmin === true
			}
		}
	}

	public static generateJWT(options: {
		meemId: string
		/** Additional data to encode in the JWT. Do not store sensitive information here. */
		data?: Record<string, any>
		expiresIn?: number
	}) {
		const { meemId, expiresIn, data } = options

		let exp = config.JWT_EXPIRES_IN
		if (expiresIn && +expiresIn > 0) {
			exp = +expiresIn
		}
		const token = jsonwebtoken.sign(
			{
				...data,
				meemId
			},
			config.JWT_SECRET,
			{
				algorithm: 'HS512',
				jwtid: uuidv4(),
				expiresIn: exp
			}
		)

		return token
	}

	public static verifyJWT(token: string): Record<string, any> {
		const data = jsonwebtoken.verify(token, config.JWT_SECRET)
		return data as Record<string, any>
	}

	public static async updateMeemId(options: {
		meemId: MeemIdentification
		addressToRemove?: string
		twitterIdToRemove?: string
	}) {
		const { meemId, addressToRemove, twitterIdToRemove } = options

		if (!meemId) {
			throw new Error('MEEM_ID_NOT_FOUND')
		}

		const removeByWallet = meemId.Wallets?.find(
			w => w.address.toLowerCase() !== addressToRemove?.toLowerCase()
		)

		let removeByTwitter

		if (!removeByWallet) {
			removeByTwitter = meemId.Twitters?.find(
				t => t.twitterId.toLowerCase() !== twitterIdToRemove?.toLowerCase()
			)
		}

		if (!removeByWallet && !removeByTwitter) {
			throw new Error('MEEM_ID_CAN_NOT_REMOVE')
		}

		const contract = this.meemIdContract()

		if (addressToRemove) {
			const wallet = meemId.Wallets?.find(
				w => w.address.toLowerCase() === addressToRemove.toLowerCase()
			)

			if (!wallet) {
				throw new Error('ADDRESS_NOT_FOUND')
			}

			if (removeByWallet) {
				await contract.removeWalletAddressByWalletAddress(
					removeByWallet.address,
					wallet.address
				)
			} else if (removeByTwitter) {
				await contract.removeWalletAddressByTwitterId(
					removeByTwitter.twitterId,
					wallet.address
				)
			}

			await orm.models.Wallet.destroy({
				where: {
					address: wallet.address
				}
			})
		} else if (twitterIdToRemove) {
			const twitter = meemId.Twitters?.find(
				t => t.twitterId.toLowerCase() === twitterIdToRemove.toLowerCase()
			)

			if (!twitter) {
				throw new Error('TWITTER_NOT_FOUND')
			}

			if (removeByWallet) {
				await contract.removeTwitterIdByWalletAddress(
					removeByWallet.address,
					twitter.twitterId
				)
			} else if (removeByTwitter) {
				await contract.removeTwitterIdByTwitterId(
					removeByTwitter.twitterId,
					twitter.twitterId
				)
			}

			await orm.models.Twitter.destroy({
				where: {
					twitterId: twitter.twitterId
				}
			})
		}
	}

	/** Syncs all data from DB meem ids to the contract */
	public static async syncDbToContract() {
		const meemIds = await orm.models.MeemIdentification.findAll({
			include: [orm.models.Wallet, orm.models.Twitter]
		})

		const meemIdContract = this.meemIdContract()

		let { recommendedGwei } = await services.web3.getGasEstimate({
			chain: MeemAPI.networkNameToChain(config.NETWORK)
		})

		if (recommendedGwei > config.MAX_GAS_PRICE_GWEI) {
			// throw new Error('GAS_PRICE_TOO_HIGH')
			log.warn(`Recommended fee over max: ${recommendedGwei}`)
			recommendedGwei = config.MAX_GAS_PRICE_GWEI
		}

		const transactions: ethers.ContractTransaction[] = []

		for (let i = 0; i < meemIds.length; i += 1) {
			const meemId = meemIds[i]
			if (
				meemId.Wallets &&
				meemId.Wallets[0] &&
				meemId.Twitters &&
				meemId.Twitters[0]
			) {
				const { address } = meemId.Wallets[0]
				const { twitterId } = meemId.Twitters[0]
				log.debug(`Creating MeemId for ${address} | ${twitterId}`)
				/* eslint-disable-next-line no-await-in-loop */
				const tx = await meemIdContract.createOrAddMeemID(address, twitterId, {
					gasPrice: services.web3.gweiToWei(recommendedGwei)
				})

				log.debug(`Creating w/ tx: ${tx.hash} | nonce: ${tx.nonce}`)

				/* eslint-disable-next-line no-await-in-loop */
				await tx.wait()

				transactions.push(tx)

				log.debug(`Created w/ TX: ${tx.hash}`)
			}
		}

		// await Promise.all(transactions.map(t => t.wait()))
		log.debug('All transactions finished')

		return meemIds
	}

	private static findMeemIdentificationId(options: {
		twitters?: Twitter[]
		wallets?: Wallet[]
	}) {
		const { twitters, wallets } = options
		if (twitters) {
			for (let i = 0; i < twitters.length; i += 1) {
				if (twitters[i].MeemIdentificationId) {
					return twitters[i].MeemIdentificationId
				}
			}
		}
		if (wallets) {
			for (let i = 0; i < wallets.length; i += 1) {
				if (wallets[i].MeemIdentificationId) {
					return wallets[i].MeemIdentificationId
				}
			}
		}

		return null
	}
}
