import crypto from 'crypto'
import jsonwebtoken, { SignOptions } from 'jsonwebtoken'
import { DateTime } from 'luxon'
import { v4 as uuidv4 } from 'uuid'
import type MeemContract from '../models/MeemContract'
import type Wallet from '../models/Wallet'

export default class MeemIdService {
	public static async getNonce(options: { address: string }) {
		// Generate a nonce and save it for the wallet
		const address = options.address.toLowerCase()

		let wallet = await orm.models.Wallet.findByAddress<Wallet>(address)

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

	public static async updateENS(item: Wallet | MeemContract) {
		const provider = await services.ethers.getProvider({
			chainId: 1
		})
		const ens = await provider.lookupAddress(item.address)
		item.ens = ens
		item.ensFetchedAt = DateTime.now().toJSDate()
		await item.save()
	}

	public static async login(options: { address?: string; signature?: string }) {
		const { address, signature } = options

		let wallet: Wallet | undefined

		if (address && signature) {
			wallet = await this.verifySignature({ address, signature })
		}

		if (!wallet) {
			throw new Error('LOGIN_FAILED')
		}

		if (wallet.ensFetchedAt === null) {
			await this.updateENS(wallet)
		}

		return {
			jwt: this.generateJWT({
				walletAddress: wallet?.address ?? ''
			})
		}
	}

	public static async verifySignature(options: {
		address: string
		signature: string
	}) {
		const ethers = services.ethers.getInstance()
		const { address, signature } = options

		const wallet = await orm.models.Wallet.findByAddress<Wallet>(address)

		if (!wallet || !wallet.nonce) {
			throw new Error('WALLET_NOT_FOUND')
		}

		if (!config.TESTING) {
			const signingAddress = ethers.utils.verifyMessage(wallet.nonce, signature)
			if (signingAddress.toLowerCase() !== address.toLowerCase()) {
				throw new Error('SIGNATURE_FAILED')
			}
		}

		return wallet
	}

	public static generateJWT(options: {
		walletAddress: string
		/** Additional data to encode in the JWT. Do not store sensitive information here. */
		data?: Record<string, any>
		expiresIn?: number | null
	}) {
		const { walletAddress, expiresIn, data } = options
		const jwtOptions: SignOptions = {
			algorithm: 'HS512',
			jwtid: uuidv4()
		}
		if (expiresIn !== null) {
			let exp = config.JWT_EXPIRES_IN
			if (expiresIn && +expiresIn > 0) {
				exp = +expiresIn
			}
			jwtOptions.expiresIn = exp
		}
		const token = jsonwebtoken.sign(
			{
				...data,
				walletAddress
			},
			config.JWT_SECRET,
			jwtOptions
		)

		return token
	}

	public static verifyJWT(token: string): Record<string, any> {
		const data = jsonwebtoken.verify(token, config.JWT_SECRET)
		return data as Record<string, any>
	}
}
