/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Validator } from '@meemproject/metadata'
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
	public static async testData(req: Request, res: Response): Promise<Response> {
		// const data = JSON.parse(
		// 	`{"id":"7b569b90-42ff-4867-a3ff-e27e4af91748","tokenId":"0x0186a0","owner":"0xde19C037a85A609ec33Fc747bE9Db8809175C3a5","parentChain":4,"parent":"0xBAbFc60D17EF8185Cdf3d4Fe4C62d9738745d542","parentTokenId":"0x0186c3","rootChain":4,"root":"0xBAbFc60D17EF8185Cdf3d4Fe4C62d9738745d542","rootTokenId":"0x0186c3","generation":{"type":"BigNumber","hex":"0x00"},"mintedAt":1637160478,"metadata":{"name":"Meem - NFT Faucet - 20","description":"Meem Content DescriptionMeem Content DescriptionHashmask #20Meem Content DetailsContract Address: 0x3d60efffc36bcdd32f8966a0339b6f78aaff121eToken ID: 20View on Etherscan: https://etherscan.io/token/0x3d60efffc36bcdd32f8966a0339b6f78aaff121e?a=20Meem Content DetailsContract Address: 0xbabfc60d17ef8185cdf3d4fe4c62d9738745d542Token ID: 100035View on Etherscan: https://etherscan.io/token/0xbabfc60d17ef8185cdf3d4fe4c62d9738745d542?a=100035","external_url":"https://meem.wtf/meem/b894fcda-52a5-46f0-912b-490f3c4aca36","meem_properties":{"root_token_uri":"https://raw.githubusercontent.com/meemproject/metadata/test/meem/e9a51861-4f32-4a9e-b333-793cf56ab0f6.json","root_token_address":"0xbabfc60d17ef8185cdf3d4fe4c62d9738745d542","root_token_id":100035,"root_token_metadata":{"name":"NFT Faucet - 20","description":"Meem Content DescriptionHashmask #20Meem Content DetailsContract Address: 0x3d60efffc36bcdd32f8966a0339b6f78aaff121eToken ID: 20View on Etherscan: https://etherscan.io/token/0x3d60efffc36bcdd32f8966a0339b6f78aaff121e?a=20","external_url":"https://meem.wtf/meem/e9a51861-4f32-4a9e-b333-793cf56ab0f6","meem_properties":{"generation":0,"root_token_uri":"https://hashmap.azurewebsites.net/getMask/20","root_token_address":"0x3d60efffc36bcdd32f8966a0339b6f78aaff121e","root_token_id":20,"root_token_metadata":{"description":"Hashmask #20","external_url":"https://www.thehashmasks.com/detail/20","image":"https://hashmasksstore.blob.core.windows.net/hashmasks/10161.jpg","attributes":[{"trait_type":"Character","value":"Male"},{"trait_type":"Mask","value":"Basic"},{"trait_type":"Skin Color","value":"Gray"},{"trait_type":"Eye Color","value":"Blue"},{"trait_type":"Item","value":"No Item"},{"trait_type":"Background","value":"Mystery Night"},{"trait_type":"Glyph","value":"Greek Symbol"}]},"parent_token_uri":"https://hashmap.azurewebsites.net/getMask/20","parent_token_id":20,"parent_token_address":"0x3d60efffc36bcdd32f8966a0339b6f78aaff121e","parent_token_metadata":{"description":"Hashmask #20","external_url":"https://www.thehashmasks.com/detail/20","image":"https://hashmasksstore.blob.core.windows.net/hashmasks/10161.jpg","attributes":[{"trait_type":"Character","value":"Male"},{"trait_type":"Mask","value":"Basic"},{"trait_type":"Skin Color","value":"Gray"},{"trait_type":"Eye Color","value":"Blue"},{"trait_type":"Item","value":"No Item"},{"trait_type":"Background","value":"Mystery Night"},{"trait_type":"Glyph","value":"Greek Symbol"}]}},"image":"https://raw.githubusercontent.com/meemproject/metadata/test/meem/images/e9a51861-4f32-4a9e-b333-793cf56ab0f6.png","image_original":"https://hashmasksstore.blob.core.windows.net/hashmasks/10161.jpg","attributes":[{"display_type":"number","trait_type":"Meem Generation","value":0}]},"parent_token_uri":"https://raw.githubusercontent.com/meemproject/metadata/test/meem/e9a51861-4f32-4a9e-b333-793cf56ab0f6.json","parent_token_id":100035,"parent_token_address":"0xbabfc60d17ef8185cdf3d4fe4c62d9738745d542","parent_token_metadata":{"name":"NFT Faucet - 20","description":"Meem Content DescriptionHashmask #20Meem Content DetailsContract Address: 0x3d60efffc36bcdd32f8966a0339b6f78aaff121eToken ID: 20View on Etherscan: https://etherscan.io/token/0x3d60efffc36bcdd32f8966a0339b6f78aaff121e?a=20","external_url":"https://meem.wtf/meem/e9a51861-4f32-4a9e-b333-793cf56ab0f6","meem_properties":{"generation":0,"root_token_uri":"https://hashmap.azurewebsites.net/getMask/20","root_token_address":"0x3d60efffc36bcdd32f8966a0339b6f78aaff121e","root_token_id":20,"root_token_metadata":{"description":"Hashmask #20","external_url":"https://www.thehashmasks.com/detail/20","image":"https://hashmasksstore.blob.core.windows.net/hashmasks/10161.jpg","attributes":[{"trait_type":"Character","value":"Male"},{"trait_type":"Mask","value":"Basic"},{"trait_type":"Skin Color","value":"Gray"},{"trait_type":"Eye Color","value":"Blue"},{"trait_type":"Item","value":"No Item"},{"trait_type":"Background","value":"Mystery Night"},{"trait_type":"Glyph","value":"Greek Symbol"}]},"parent_token_uri":"https://hashmap.azurewebsites.net/getMask/20","parent_token_id":20,"parent_token_address":"0x3d60efffc36bcdd32f8966a0339b6f78aaff121e","parent_token_metadata":{"description":"Hashmask #20","external_url":"https://www.thehashmasks.com/detail/20","image":"https://hashmasksstore.blob.core.windows.net/hashmasks/10161.jpg","attributes":[{"trait_type":"Character","value":"Male"},{"trait_type":"Mask","value":"Basic"},{"trait_type":"Skin Color","value":"Gray"},{"trait_type":"Eye Color","value":"Blue"},{"trait_type":"Item","value":"No Item"},{"trait_type":"Background","value":"Mystery Night"},{"trait_type":"Glyph","value":"Greek Symbol"}]}},"image":"https://raw.githubusercontent.com/meemproject/metadata/test/meem/images/e9a51861-4f32-4a9e-b333-793cf56ab0f6.png","image_original":"https://hashmasksstore.blob.core.windows.net/hashmasks/10161.jpg","attributes":[{"display_type":"number","trait_type":"Meem Generation","value":0}]},"generation":0,"token_id":100000},"image":"https://raw.githubusercontent.com/meemproject/metadata/test/meem/images/b894fcda-52a5-46f0-912b-490f3c4aca36.png","image_original":"https://raw.githubusercontent.com/meemproject/metadata/test/meem/images/e9a51861-4f32-4a9e-b333-793cf56ab0f6.png","attributes":[{"display_type":"number","trait_type":"Meem Generation","value":0}]},"data":"","PropertiesId":"dc9652b0-e433-4982-872d-a37876d17020","ChildPropertiesId":"f673127a-c0fc-4e56-b05d-6c247998a14d","properties":{"id":"dc9652b0-e433-4982-872d-a37876d17020","totalChildren":"-0x01","totalChildrenLockedBy":"0x0000000000000000000000000000000000000000","childrenPerWallet":"-0x01","childrenPerWalletLockedBy":"0x0000000000000000000000000000000000000000","copyPermissions":{"0":{"lockedBy":"0x0000000000000000000000000000000000000000","addresses":{},"numTokens":"0x00","permission":1}},"remixPermissions":{"0":{"lockedBy":"0x0000000000000000000000000000000000000000","addresses":{},"numTokens":"0x00","permission":1}},"readPermissions":{"0":{"lockedBy":"0x0000000000000000000000000000000000000000","addresses":{},"numTokens":"0x00","permission":1}},"copyPermissionsLockedBy":"0x0000000000000000000000000000000000000000","remixPermissionsLockedBy":"0x0000000000000000000000000000000000000000","readPermissionsLockedBy":"0x0000000000000000000000000000000000000000","splits":{"0":{"amount":9900,"lockedBy":"0x0000000000000000000000000000000000000000","toAddress":"0xde19C037a85A609ec33Fc747bE9Db8809175C3a5"},"1":{"amount":100,"lockedBy":"0x0000000000000000000000000000000000000000","toAddress":"0x40c6BeE45d94063c5B05144489cd8A9879899592"}},"splitsLockedBy":"0x0000000000000000000000000000000000000000","updatedAt":null,"createdAt":null,"deletedAt":null},"childProperties":{"id":"f673127a-c0fc-4e56-b05d-6c247998a14d","totalChildren":"0x00","totalChildrenLockedBy":"0x0000000000000000000000000000000000000000","childrenPerWallet":"-0x01","childrenPerWalletLockedBy":"0x0000000000000000000000000000000000000000","copyPermissions":{"0":{"lockedBy":"0x0000000000000000000000000000000000000000","addresses":{},"numTokens":"0x00","permission":1}},"remixPermissions":{"0":{"lockedBy":"0x0000000000000000000000000000000000000000","addresses":{},"numTokens":"0x00","permission":1}},"readPermissions":{"0":{"lockedBy":"0x0000000000000000000000000000000000000000","addresses":{},"numTokens":"0x00","permission":1}},"copyPermissionsLockedBy":"0x0000000000000000000000000000000000000000","remixPermissionsLockedBy":"0x0000000000000000000000000000000000000000","readPermissionsLockedBy":"0x0000000000000000000000000000000000000000","splits":{"0":{"amount":9900,"lockedBy":"0x0000000000000000000000000000000000000000","toAddress":"0xde19C037a85A609ec33Fc747bE9Db8809175C3a5"},"1":{"amount":100,"lockedBy":"0x0000000000000000000000000000000000000000","toAddress":"0x40c6BeE45d94063c5B05144489cd8A9879899592"}},"splitsLockedBy":"0x0000000000000000000000000000000000000000","updatedAt":null,"createdAt":null,"deletedAt":null}}`
		// )

		// const meem = await orm.models.Meem.findOne({
		// 	where: {
		// 		tokenId: req.query.tokenId as string
		// 	},
		// 	include: [
		// 		{
		// 			model: orm.models.MeemProperties,
		// 			as: 'Properties'
		// 		},
		// 		{
		// 			model: orm.models.MeemProperties,
		// 			as: 'ChildProperties'
		// 		}
		// 	]
		// })

		// if (!meem) {
		// 	return res.json({})
		// }

		// const meemData = {
		// 	...meem.get({ plain: true })
		// }

		// const token = services.contractEvents.saveToGun({
		// 	path: `test3`,
		// 	data: meemData
		// })

		// const cleanData = services.contractEvents.toPureObject(meemData)
		// // const cleanData = services.contractEvents.toPureObject(data)
		// // console.log(JSON.stringify(cleanData))

		// // await services.contractEvents.createNewMeem('0x018712')

		// const result = gun.get('meems/0x018711')
		// result.once(m => console.log(m))

		// return res.json(cleanData)
		// const test = gun.user().get('testing').put({
		// 	some: 'testdata'
		// })

		// test.get('subdata').put({
		// 	more: 'data'
		// })

		// const ethers = services.ethers.getInstance()

		// gun
		// 	.user(
		// 		'4u6CF0hDCxli0LwUH_vidDL7PMEeV0Tsr3DLEuq0FEY.8uGPk-HtTjDC7TkbESqIexGSj0pStPoWv2shy-fXzWQ'
		// 	)
		// 	.get('meems')
		// 	// .get(ethers.BigNumber.from('100033').toHexString())
		// 	.get('0x0186c3')
		// 	// .get('properties')
		// 	.once(d => console.log(d))

		// await services.contractEvents.createNewMeem(
		// 	// ethers.BigNumber.from('100033').toHexString()
		// 	'0x0186c3'
		// )

		// gun
		// 	.user()
		// 	.get('testing')
		// 	.put(
		// 		{
		// 			description: `something something\nother thing`
		// 		},
		// 		ack => console.log(ack)
		// 	)
		// gun
		// 	.user()
		// 	.get('testing')
		// 	.once(d => console.log(d))
		// gun
		// 	.user()
		// 	.get('testing')
		// 	.put(
		// 		{
		// 			description: 'something somethingother thing'
		// 		},
		// 		ack => console.log(ack)
		// 	)

		const meemContract = await services.meem.getMeemContract({
			walletPrivateKey: config.TWITTER_WALLET_PRIVATE_KEY
		})

		const inter = services.meem.meemInterface()
		try {
			// const tx = await meemContract.mint(
			// 	{
			// 		to: '0x62ce12ac21d213f1ecae84d2c31ad308da92102a',
			// 		mTokenURI:
			// 			'ipfs://QmWvNhj3UdF5G9oAmTaNpRyDyaRMEUTEdhLdMQr3pKYj1h/c0542660-24fb-4de5-9352-8baf19889e86/metadata.json',
			// 		parentChain: 1,
			// 		parent: '0x82aC441F3276ede5db366704866d2E0fD9c2cFA8',
			// 		parentTokenId: '100000',
			// 		meemType: 2,
			// 		data: '{"tweetId":"1491070904016973824","text":"good &gt;meem","username":"notnotrealreal","userId":"1442900159008964610"}',
			// 		isVerified: true,
			// 		mintedBy: '0x62ce12ac21d213f1ecae84d2c31ad308da92102a'
			// 	},
			// 	{
			// 		copyPermissions: [],
			// 		remixPermissions: [
			// 			{
			// 				permission: 1,
			// 				addresses: [],
			// 				numTokens: '0',
			// 				lockedBy: '0x0000000000000000000000000000000000000000'
			// 			}
			// 		],
			// 		readPermissions: [
			// 			{
			// 				permission: 1,
			// 				addresses: [],
			// 				numTokens: '0x00',
			// 				lockedBy: '0x0000000000000000000000000000000000000000'
			// 			}
			// 		],
			// 		copyPermissionsLockedBy: '0x0000000000000000000000000000000000000000',
			// 		remixPermissionsLockedBy:
			// 			'0x0000000000000000000000000000000000000000',
			// 		readPermissionsLockedBy: '0x0000000000000000000000000000000000000000',
			// 		splits: [
			// 			{
			// 				toAddress: '0x9C5ceC7a99D19a9f1754C202aBA01BBFEDECC561',
			// 				amount: 100,
			// 				lockedBy: '0xde19C037a85A609ec33Fc747bE9Db8809175C3a5'
			// 			}
			// 		],
			// 		splitsLockedBy: '0x0000000000000000000000000000000000000000',
			// 		copiesPerWallet: '-0x01',
			// 		copiesPerWalletLockedBy: '0x0000000000000000000000000000000000000000',
			// 		totalCopies: '0x00',
			// 		totalCopiesLockedBy: '0x0000000000000000000000000000000000000000',
			// 		totalRemixes: '-0x01',
			// 		remixesPerWallet: '-0x01',
			// 		remixesPerWalletLockedBy:
			// 			'0x0000000000000000000000000000000000000000',
			// 		totalRemixesLockedBy: '0x0000000000000000000000000000000000000000'
			// 	},
			// 	{
			// 		copyPermissions: [],
			// 		remixPermissions: [
			// 			{
			// 				permission: 1,
			// 				addresses: [],
			// 				numTokens: '0',
			// 				lockedBy: '0x0000000000000000000000000000000000000000'
			// 			}
			// 		],
			// 		readPermissions: [
			// 			{
			// 				permission: 1,
			// 				addresses: [],
			// 				numTokens: '0x00',
			// 				lockedBy: '0x0000000000000000000000000000000000000000'
			// 			}
			// 		],
			// 		copyPermissionsLockedBy: '0x0000000000000000000000000000000000000000',
			// 		remixPermissionsLockedBy:
			// 			'0x0000000000000000000000000000000000000000',
			// 		readPermissionsLockedBy: '0x0000000000000000000000000000000000000000',
			// 		splits: [
			// 			{
			// 				toAddress: '0x9C5ceC7a99D19a9f1754C202aBA01BBFEDECC561',
			// 				amount: 100,
			// 				lockedBy: '0xde19C037a85A609ec33Fc747bE9Db8809175C3a5'
			// 			}
			// 		],
			// 		splitsLockedBy: '0x0000000000000000000000000000000000000000',
			// 		copiesPerWallet: '-0x01',
			// 		copiesPerWalletLockedBy: '0x0000000000000000000000000000000000000000',
			// 		totalCopies: '0x00',
			// 		totalCopiesLockedBy: '0x0000000000000000000000000000000000000000',
			// 		totalRemixes: '-0x01',
			// 		remixesPerWallet: '-0x01',
			// 		remixesPerWalletLockedBy:
			// 			'0x0000000000000000000000000000000000000000',
			// 		totalRemixesLockedBy: '0x0000000000000000000000000000000000000000'
			// 	},
			// 	{
			// 		gasLimit: '1600000',
			// 		gasPrice: 32000000000
			// 	}
			// )
			// console.log(`TX: ${tx.hash}`)
			// console.log(`Nonce: ${tx.nonce}`)
			// await tx.wait()
		} catch (e) {
			console.log(e)
		}

		return res.json({
			status: 'success'
		})
	}

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
			address: req.query.address as string
		})

		return res.json({
			status: 'success'
		})
	}

	public static async metadata(req: Request, res: Response) {
		const contractMetadataValidator = new Validator(
			'MeemClub_Contract_20220718'
		)
		const contractMetadataValidatorResult = contractMetadataValidator.validate({
			meem_contract_type: 'meem-club',
			meem_metadata_version: 'MeemClub_Contract_20220718',
			name: 'metadataaaa',
			description: 'asdfasdf',
			image:
				'data:image/png;base64,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',
			associations: [],
			external_url: '',
			application_instructions: ''
		})

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
		const provider = await services.ethers.getProvider()
		const signer = new ethers.Wallet(config.WALLET_PRIVATE_KEY, provider)
		const proxyContract = new ethers.Contract(
			proxyContractAddress,
			GnosisSafeProxyABI,
			signer
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

		const receipt = await provider.getTransactionReceipt(
			'0xd5c3e5899aca336f95e1ea40d94d11c27fc45cc9865fb4a0c59225e775578062'
		)

		// Find the newly created Safe contract address in the transaction receipt
		for (let i = 0; i < receipt.logs.length; i += 1) {
			const receiptLog = receipt.logs[i]
			const foundTopic = receiptLog.topics.find(t => t === topic)
			if (foundTopic) {
				log.info(`address: ${receiptLog.address}`)
				break
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
}
