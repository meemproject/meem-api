/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Validator } from '@meemproject/metadata'
import { Wallet as AlchemyWallet } from 'alchemy-sdk'
import { ethers, ethers as Ethers } from 'ethers'
import { Request, Response } from 'express'
import keccak256 from 'keccak256'
import { DateTime, Duration } from 'luxon'
import { MerkleTree } from 'merkletreejs'
import { Op } from 'sequelize'
import GnosisSafeABI from '../abis/GnosisSafe.json'
import GnosisSafeProxyABI from '../abis/GnosisSafeProxy.json'
import { Constructor } from '../serverless/cron'
import { MeemAPI } from '../types/meem.generated'

export default class TestController {
	public static async testEmit(req: Request, res: Response): Promise<Response> {
		// sockets?.emit

		// await services.db.getSubscriptions({
		// 	subscriptionKey: '1234'
		// })

		// await services.db.removeSubscriptions({
		// 	connectionId: '1234'
		// })

		await sockets?.emit({
			subscription: MeemAPI.MeemEvent.MeemMinted,
			eventName: MeemAPI.MeemEvent.MeemMinted,
			data: {
				tokenId: '234',
				transactionHash: 'balksjdflakjdsf'
			}
		})

		return res.json({
			config: { version: config.version }
		})
	}

	public static async testError(
		req: Request,
		res: Response
	): Promise<Response> {
		// sockets?.emit

		// await services.db.getSubscriptions({
		// 	subscriptionKey: '1234'
		// })

		// await services.db.removeSubscriptions({
		// 	connectionId: '1234'
		// })

		await sockets?.emitError(
			config.errors.CONTRACT_CREATION_FAILED,
			req.query.address as string
		)

		return res.json({
			config: { version: config.version }
		})
	}

	public static async testWrapped(
		req: Request,
		res: Response
	): Promise<Response> {
		// log.debug(ethers.BigNumber.from(-1))
		// log.debug(services.web3.toBigNumber(-1))

		// await services.twitter.getUser()

		return res.json({
			status: 'success'
		})
	}

	public static async testTweets(
		req: Request,
		res: Response
	): Promise<Response> {
		const tweet = await orm.models.Tweet.findOne({
			where: {
				tweetId: 'blahblah'
			}
		})

		const since = DateTime.now().minus(
			Duration.fromObject({
				hours: 1
			})
		)

		const tweets = await orm.models.Tweet.findAll({
			where: {
				createdAt: {
					[Op.gt]: since.toJSDate()
				}
			}
		})

		const tweetWithHashtags = await orm.models.Tweet.findOne({
			where: {
				tweetId: 'blahblah'
			},
			include: [orm.models.Hashtag]
		})

		return res.json({
			status: 'success'
		})
	}

	public static async testSaveSubscription(
		req: Request,
		res: Response
	): Promise<Response> {
		const { connectionId, walletAddress, key } = req.query as Record<
			string,
			string
		>

		await services.db.saveSubscription({
			connectionId,
			walletAddress,
			events: [
				{
					key
				}
			]
		})

		return res.json({
			status: 'success'
		})
	}

	public static async testGetSubscriptions(
		req: Request,
		res: Response
	): Promise<Response> {
		const { walletAddress, key } = req.query as Record<string, string>

		const subscriptions = await services.db.getSubscriptions({
			subscriptionKey: key,
			walletAddress
		})

		return res.json({
			subscriptions
		})
	}

	public static async testGetUserJWT(
		req: Request,
		res: Response
	): Promise<Response> {
		const { walletAddress } = req.query as Record<string, string>

		const jwt = await services.meemId.generateJWT({
			walletAddress
		})

		return res.json({ jwt })
	}

	public static async testCron(req: Request, res: Response): Promise<Response> {
		// eslint-disable-next-line
		const cronConstructor = require(`../cron/jobs/${req.query.job}`)
			.default as Constructor
		// eslint-disable-next-line
		const cronjob = new cronConstructor()
		await cronjob.run()

		return res.json({
			status: 'success'
		})
	}

	public static async syncContract(req: Request, res: Response) {
		await services.contractEvents.meemHandleContractInitialized({
			address: req.query.address as string,
			chainId: +(req.query.chainId as string) as number
		})

		return res.json({
			status: 'success'
		})
	}

	public static async metadata(req: Request, res: Response) {
		const metadata = {
			meem_metadata_type: 'MeemAgreement_Contract',
			meem_metadata_version: '20221116',
			name: 'metadataaaa',
			description: 'asdfasdf',
			image:
				'data:image/png;base64,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',
			associations: [],
			external_url: '',
			application_instructions: ''
		}

		const contractMetadataValidator = new Validator(metadata)
		const contractMetadataValidatorResult =
			contractMetadataValidator.validate(metadata)

		return res.json({
			status: 'success',
			contractMetadataValidatorResult
		})
	}

	public static async testGnosis(req: Request, res: Response) {
		const masterContractAddress = '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552'
		const proxyContractAddress = '0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2'
		const topic =
			'0x141df868a6331af528e38c83b7aa03edc19be66e37ae67f9285bf4f8e3c6a1a8'
		const safeOwners: string[] = [
			'0xbA343C26ad4387345edBB3256e62f4bB73d68a04',
			'0xde19C037a85A609ec33Fc747bE9Db8809175C3a5'
		]
		const threshold = 1

		// gnosisSafeAbi is the Gnosis Safe ABI in JSON format,
		// you can find an example here: https://github.com/gnosis/safe-deployments/blob/main/src/assets/v1.1.1/gnosis_safe.json#L16
		const { provider, wallet } = await services.ethers.getProvider({
			chainId: +(req.query.chainId as string) as number
		})

		const proxyContract = new ethers.Contract(
			proxyContractAddress,
			GnosisSafeProxyABI,
			wallet
		)
		const gnosisInterface = new ethers.utils.Interface(GnosisSafeABI)
		const safeSetupData = gnosisInterface.encodeFunctionData('setup', [
			safeOwners,
			threshold,
			'0x0000000000000000000000000000000000000000',
			'0x',
			'0x0000000000000000000000000000000000000000',
			'0x0000000000000000000000000000000000000000',
			'0',
			'0x0000000000000000000000000000000000000000'
		])

		// safeContractFactory is an instance of the "Contract" type from Ethers JS
		// see https://docs.ethers.io/v5/getting-started/#getting-started--contracts
		// for more details.
		// You're going to need the address of a Safe contract factory and the ABI,
		// which can be found here: https://github.com/gnosis/safe-deployments/blob/main/src/assets/v1.1.1/proxy_factory.json#L16
		const tx = await proxyContract.createProxy(
			masterContractAddress,
			safeSetupData
		)

		await tx.wait()

		const receipt = await provider.core.getTransactionReceipt(
			'0xd5c3e5899aca336f95e1ea40d94d11c27fc45cc9865fb4a0c59225e775578062'
		)

		if (receipt) {
			// Find the newly created Safe contract address in the transaction receipt
			for (let i = 0; i < receipt.logs.length; i += 1) {
				const receiptLog = receipt.logs[i]
				const foundTopic = receiptLog.topics.find(t => t === topic)
				if (foundTopic) {
					log.info(`address: ${receiptLog.address}`)
					break
				}
			}
		}

		console.log(tx)

		return res.json({
			status: 'success',
			tx
		})
	}

	public static async testHash(req: Request, res: Response) {
		const addresses = [
			'0xbA343C26ad4387345edBB3256e62f4bB73d68a04',
			'0xE7EDF0FeAebaF19Ad799eA9246E7bd8a38002d89',
			'0xEC41a0AAea12ad8F588e5aD0e71A837d83e05792'
		]

		const hashedAddress = keccak256(
			'0xbA343C26ad4387345edBB3256e62f4bB73d68a04'
		)

		const leaves = addresses.map(a => keccak256(a))
		const merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true })
		const rootHash = merkleTree.getRoot().toString('hex')
		const proof = merkleTree.getHexProof(hashedAddress)

		// const isVerified = merkleTree.verify(proof, hashedAddress, rootHash)
		const tree = new MerkleTree([], keccak256, { sortPairs: true })
		const isVerified = tree.verify(proof, hashedAddress, rootHash)

		return res.json({
			status: 'success',
			rootHash,
			isVerified,
			merkleTree: merkleTree.toString(),
			proof
		})
	}

	public static async releaseLock(req: Request, res: Response) {
		await services.ethers.releaseLock(+(req.query.chainId as string))

		return res.json({
			status: 'success'
		})
	}

	public static async mintPKP(req: Request, res: Response) {
		const tx = await services.lit.mintPKP()

		return res.json({
			status: 'success',
			tx
		})
	}

	public static async getEthAddress(req: Request, res: Response) {
		const ethAddress = await services.lit.getEthAddress(
			req.query.tokenId as string
		)

		return res.json({
			status: 'success',
			ethAddress
		})
	}
}
