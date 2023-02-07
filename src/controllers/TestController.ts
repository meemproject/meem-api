/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Validator } from '@meemproject/metadata'
import { Wallet as AlchemyWallet } from 'alchemy-sdk'
import { ethers, ethers as Ethers } from 'ethers'
import { encodeSingle, TransactionType } from 'ethers-multisend'
import { Request, Response } from 'express'
import keccak256 from 'keccak256'
import { DateTime, Duration } from 'luxon'
import { MerkleTree } from 'merkletreejs'
import { Op } from 'sequelize'
import GnosisSafeABI from '../abis/GnosisSafe.json'
import GnosisSafeProxyABI from '../abis/GnosisSafeProxy.json'
import meemABI from '../abis/Meem.json'
import { Constructor } from '../serverless/cron'
import { Mycontract__factory } from '../types/Meem'
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
				'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAABbBJREFUSEuNlV1sHFcVx38zd+bO7Le9drzruEmc1nEDCU3b0ECUNFJVoqpRVbUBCR6IeKCtoA/AU9UHHngrKA+ACkII1IeWKPQBgSoVlAItlH63MbZC0oakLbGdeLNrr/djdmfn86LxmNCQpuKsrkaanTm/O+d/7v9oSinFJ8Ta3ypaXzFoycM6aMkSaMn1E0K7HkDFMSro4q28S9CcAe88eryMigMQI2BuQS/twh69Bc0eQTfMj8V8LCAOPLz5PxNcOk5GnsXc/CkofgasarrzYBV6Z1ELs/Q6wzBymMzUFxFW/hrIVYCkGqHbZvDP49jOLzF37oWhe4DtwBBgrCeIgB4wD/2/Ep7+A/1gP/Lmb2CVJ9HWypjGVQC/38E9eZSM/yzyzm+CvAOUAVG4XnuRvAKsa6ILSJb6AOZ+TLe+FXP3E1jlrVcgVwAqCmnN/JzM5R9g730ARg4AXppQCYj0FJbkT0TXQjDiFIYNvX/BP56h3dlPdt8TmNnSf78gEbR77gXs9x5F3r4HqrtoL9VYrnURhqQyOUamUIA46ZzkPUXou9QXGvRaDqWyxdjkBPSbRG/+jlb+Ucqf/zaaYaYlitwOK79/iLGJ03hjezgzd5HZV9/HG4QodO64Zzu3HtyOsdaSCiU05k8t8tLxWfrdAaalM7Wjym37phmK5+nO1DAPPY89emMKcObfQfzxEJnbt1Hr5Tj51iLlG/KMbyoSxpAfTnZYQl8XLzk4rcs9GvMOUmp0Vlw+OLPCzdOjTE/lEWdmWJk8Snn3EbQ4ClX99V9QufA43LgN35R4Uie7QSKKJmQExAr6EUQqaYtUl6wAQ4dBBN0IZ8VD74dkYg1t6UMuBfdSfeBnaFHgqdpz32HcO4Y2NgGGAKlBUeDHiqYTokudkYqFkEkXJRrHtBo+g35EKSPIJiAnAi9ON9FeptacpnLkBFrku+rSr7/CGC8iS6PrnaI4ebbLG3MdWq0Ab6C468EqBw5X1rryzCur/PapBeJIUSia7N6RZ/+uEnryZRpE7iqNZoWxh95OAYvHvkwlfgkrOwyhSeRFvPxunyawcdImMATVzTZTn86sHeSleZ/zp3tIpagvuOhOxBd25LBtA2RMFLZZao+z8ZG30hJd+M23qDSfIVMYRnNlWteihIoFVQnDic+otfthYnW2QLcErARQ8+HyAFY8kDpkYvygxUVvJ5MP/ykVefEvP6Uw9xiFkSFEaEMowNagJKEsIZ/sTCeO4cNzDmE/YHwiQ842EKs+rHrQi0AolOnjOqtczB3mpq8+lbZp8/zrdJ89RKWqsOw8mrLAzkDehIIJtoDEERTM1wPOzbVYen+Vg3dXqFazsOzBwAPl4ocDWvUu7md/xKYDD6cAv9/m3NNfY9w/QW60gJQSzSpCNgtSgpGKl1xb/YBTbzRYOtvhwN4NVG8qguuC2yYMPJyWw+LyKFu+/gL56nQKiOOI+uxz9J4/QqkiKAxbSNtGs3Jg5EAkHqSjpODvs03eefkSd0/lmJzKo48INL1P0HdxugHOkkO88zE23ftddMP6iJuGfRovfp/GK0cpj1uUyhJpCnTTQBMSNAN0g36omD3VZfbtFvfdmWPzlMB3A9rtEHfZR9t4kIkHn0Qv3HCtXce9JWonvkdr9mlGNtpk8wLL1NGFhhA6Co2FmuJiHQxDsX2ThpQRjhPRrw9gw+cYv/+HmJVb1m39f+ZBgoydRZb/9iSN137CUFlg5w2kpWOu6+AMdJJfzorxvJBeN8RpB+Sm7mP0rseR1duuJL9m4PxnCim/Q2fuV6zOHKO3OEM2IzCkjjA1hK6IY0XggdsPEcWtDN/6JYb2PILIp2X5aFx/6Ec+sdvAW3iT3oVXGdTew+821oaNyJSwNmwjv2UP9uZ9GKUtaEbm/x/6Vz2p4rWkKg5RgbN2GDQzB7qJlhiTlhrg9eLfsEqucvpaG8kAAAAASUVORK5CYII=',
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

		const receipt = await provider.core.getTransactionReceipt(tx.hash)

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

	public static async testPinata(req: Request, res: Response) {
		const result = await services.web3.saveToPinata({
			json: {
				meem_metadata_type: 'Meem_AgreementContract',
				meem_metadata_version: '20221116',
				name: 'aqer',
				description: 'asdfgscfg',
				image:
					'data:image/png;base64,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',
				associations: [],
				external_url: '',
				application_instructions: []
			}
		})

		return res.json({
			status: 'success',
			result
		})
	}

	public static async testTxEncoding(req: Request, res: Response) {
		// const functionSignature = ethers.utils
		// 	.id('mint((address,string,uint8))')
		// 	.substring(0, 10)
		const m = await services.agreement.getAgreementContract({
			chainId: 5,
			address: '0xf5a0fD628AFe07D8c3736762Bd65Ae009F23e335'
		})

		const encoded = encodeSingle({
			id: '1',
			abi: JSON.stringify(meemABI),
			functionSignature: 'bulkMint((address,string,uint8)[])',
			to: '0xf5a0fD628AFe07D8c3736762Bd65Ae009F23e335',
			value: '0',
			inputValues: {
				bulkParams: [
					{
						to: '0xbA343C26ad4387345edBB3256e62f4bB73d68a04',
						tokenType: '0',
						tokenURI: 'ipfs://QmTFk4Wgka3VfwpMJzjbHA9ZsKjG7bbRcbbDoPnHYVV3Gv'
					},
					{
						to: '0x1e6c71F7338276524D646dB2F04a49fA88458cF2',
						tokenType: '0',
						tokenURI: 'ipfs://QmTFk4Wgka3VfwpMJzjbHA9ZsKjG7bbRcbbDoPnHYVV3Gv'
					}
				]
			},
			type: TransactionType.callContract
		})
		// const x = m.interface.functions['setMaxSupply(uint256)'].format()

		const encoded2 = encodeSingle({
			id: '1',
			abi: JSON.stringify(meemABI),
			functionSignature: 'mint((address,string,uint8))',
			to: '0xf5a0fD628AFe07D8c3736762Bd65Ae009F23e335',
			value: '0',
			inputValues: {
				params: [
					'0xbA343C26ad4387345edBB3256e62f4bB73d68a04',
					'https://meem.wtf',
					'0'
				]
			},
			type: TransactionType.callContract
		})

		// console.log({ x, encoded })

		return res.json({
			status: 'success',
			encoded,
			encoded2,
			meemABI
		})
	}

	public static async tablelandTest(req: Request, res: Response) {
		// const result = await services.storage.createTable({
		// 	chainId: 5,
		// 	schema: {
		// 		data: MeemAPI.StorageDataType.Text
		// 	}
		// })

		return res.json({
			// result,
			status: 'success'
		})
	}

	public static async gunTest(req: Request, res: Response) {
		return res.json({
			// result,
			status: 'success'
		})
	}
}
