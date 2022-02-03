/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars */
import type { ethers as Ethers } from 'ethers'
import { Request, Response } from 'express'
import { DateTime, Duration } from 'luxon'
import { Op } from 'sequelize'
import { MeemAPI } from '../types/meem.generated'

export default class ConfigController {
	public static async testData(req: Request, res: Response): Promise<Response> {
		const data = JSON.parse(
			`{"id":"7b569b90-42ff-4867-a3ff-e27e4af91748","tokenId":"0x0186a0","owner":"0xde19C037a85A609ec33Fc747bE9Db8809175C3a5","parentChain":4,"parent":"0xBAbFc60D17EF8185Cdf3d4Fe4C62d9738745d542","parentTokenId":"0x0186c3","rootChain":4,"root":"0xBAbFc60D17EF8185Cdf3d4Fe4C62d9738745d542","rootTokenId":"0x0186c3","generation":{"type":"BigNumber","hex":"0x00"},"mintedAt":1637160478,"metadata":{"name":"Meem - NFT Faucet - 20","description":"Meem Content DescriptionMeem Content DescriptionHashmask #20Meem Content DetailsContract Address: 0x3d60efffc36bcdd32f8966a0339b6f78aaff121eToken ID: 20View on Etherscan: https://etherscan.io/token/0x3d60efffc36bcdd32f8966a0339b6f78aaff121e?a=20Meem Content DetailsContract Address: 0xbabfc60d17ef8185cdf3d4fe4c62d9738745d542Token ID: 100035View on Etherscan: https://etherscan.io/token/0xbabfc60d17ef8185cdf3d4fe4c62d9738745d542?a=100035","external_url":"https://meem.wtf/meem/b894fcda-52a5-46f0-912b-490f3c4aca36","meem_properties":{"root_token_uri":"https://raw.githubusercontent.com/meemproject/metadata/test/meem/e9a51861-4f32-4a9e-b333-793cf56ab0f6.json","root_token_address":"0xbabfc60d17ef8185cdf3d4fe4c62d9738745d542","root_token_id":100035,"root_token_metadata":{"name":"NFT Faucet - 20","description":"Meem Content DescriptionHashmask #20Meem Content DetailsContract Address: 0x3d60efffc36bcdd32f8966a0339b6f78aaff121eToken ID: 20View on Etherscan: https://etherscan.io/token/0x3d60efffc36bcdd32f8966a0339b6f78aaff121e?a=20","external_url":"https://meem.wtf/meem/e9a51861-4f32-4a9e-b333-793cf56ab0f6","meem_properties":{"generation":0,"root_token_uri":"https://hashmap.azurewebsites.net/getMask/20","root_token_address":"0x3d60efffc36bcdd32f8966a0339b6f78aaff121e","root_token_id":20,"root_token_metadata":{"description":"Hashmask #20","external_url":"https://www.thehashmasks.com/detail/20","image":"https://hashmasksstore.blob.core.windows.net/hashmasks/10161.jpg","attributes":[{"trait_type":"Character","value":"Male"},{"trait_type":"Mask","value":"Basic"},{"trait_type":"Skin Color","value":"Gray"},{"trait_type":"Eye Color","value":"Blue"},{"trait_type":"Item","value":"No Item"},{"trait_type":"Background","value":"Mystery Night"},{"trait_type":"Glyph","value":"Greek Symbol"}]},"parent_token_uri":"https://hashmap.azurewebsites.net/getMask/20","parent_token_id":20,"parent_token_address":"0x3d60efffc36bcdd32f8966a0339b6f78aaff121e","parent_token_metadata":{"description":"Hashmask #20","external_url":"https://www.thehashmasks.com/detail/20","image":"https://hashmasksstore.blob.core.windows.net/hashmasks/10161.jpg","attributes":[{"trait_type":"Character","value":"Male"},{"trait_type":"Mask","value":"Basic"},{"trait_type":"Skin Color","value":"Gray"},{"trait_type":"Eye Color","value":"Blue"},{"trait_type":"Item","value":"No Item"},{"trait_type":"Background","value":"Mystery Night"},{"trait_type":"Glyph","value":"Greek Symbol"}]}},"image":"https://raw.githubusercontent.com/meemproject/metadata/test/meem/images/e9a51861-4f32-4a9e-b333-793cf56ab0f6.png","image_original":"https://hashmasksstore.blob.core.windows.net/hashmasks/10161.jpg","attributes":[{"display_type":"number","trait_type":"Meem Generation","value":0}]},"parent_token_uri":"https://raw.githubusercontent.com/meemproject/metadata/test/meem/e9a51861-4f32-4a9e-b333-793cf56ab0f6.json","parent_token_id":100035,"parent_token_address":"0xbabfc60d17ef8185cdf3d4fe4c62d9738745d542","parent_token_metadata":{"name":"NFT Faucet - 20","description":"Meem Content DescriptionHashmask #20Meem Content DetailsContract Address: 0x3d60efffc36bcdd32f8966a0339b6f78aaff121eToken ID: 20View on Etherscan: https://etherscan.io/token/0x3d60efffc36bcdd32f8966a0339b6f78aaff121e?a=20","external_url":"https://meem.wtf/meem/e9a51861-4f32-4a9e-b333-793cf56ab0f6","meem_properties":{"generation":0,"root_token_uri":"https://hashmap.azurewebsites.net/getMask/20","root_token_address":"0x3d60efffc36bcdd32f8966a0339b6f78aaff121e","root_token_id":20,"root_token_metadata":{"description":"Hashmask #20","external_url":"https://www.thehashmasks.com/detail/20","image":"https://hashmasksstore.blob.core.windows.net/hashmasks/10161.jpg","attributes":[{"trait_type":"Character","value":"Male"},{"trait_type":"Mask","value":"Basic"},{"trait_type":"Skin Color","value":"Gray"},{"trait_type":"Eye Color","value":"Blue"},{"trait_type":"Item","value":"No Item"},{"trait_type":"Background","value":"Mystery Night"},{"trait_type":"Glyph","value":"Greek Symbol"}]},"parent_token_uri":"https://hashmap.azurewebsites.net/getMask/20","parent_token_id":20,"parent_token_address":"0x3d60efffc36bcdd32f8966a0339b6f78aaff121e","parent_token_metadata":{"description":"Hashmask #20","external_url":"https://www.thehashmasks.com/detail/20","image":"https://hashmasksstore.blob.core.windows.net/hashmasks/10161.jpg","attributes":[{"trait_type":"Character","value":"Male"},{"trait_type":"Mask","value":"Basic"},{"trait_type":"Skin Color","value":"Gray"},{"trait_type":"Eye Color","value":"Blue"},{"trait_type":"Item","value":"No Item"},{"trait_type":"Background","value":"Mystery Night"},{"trait_type":"Glyph","value":"Greek Symbol"}]}},"image":"https://raw.githubusercontent.com/meemproject/metadata/test/meem/images/e9a51861-4f32-4a9e-b333-793cf56ab0f6.png","image_original":"https://hashmasksstore.blob.core.windows.net/hashmasks/10161.jpg","attributes":[{"display_type":"number","trait_type":"Meem Generation","value":0}]},"generation":0,"token_id":100000},"image":"https://raw.githubusercontent.com/meemproject/metadata/test/meem/images/b894fcda-52a5-46f0-912b-490f3c4aca36.png","image_original":"https://raw.githubusercontent.com/meemproject/metadata/test/meem/images/e9a51861-4f32-4a9e-b333-793cf56ab0f6.png","attributes":[{"display_type":"number","trait_type":"Meem Generation","value":0}]},"data":"","PropertiesId":"dc9652b0-e433-4982-872d-a37876d17020","ChildPropertiesId":"f673127a-c0fc-4e56-b05d-6c247998a14d","properties":{"id":"dc9652b0-e433-4982-872d-a37876d17020","totalChildren":"-0x01","totalChildrenLockedBy":"0x0000000000000000000000000000000000000000","childrenPerWallet":"-0x01","childrenPerWalletLockedBy":"0x0000000000000000000000000000000000000000","copyPermissions":{"0":{"lockedBy":"0x0000000000000000000000000000000000000000","addresses":{},"numTokens":"0x00","permission":1}},"remixPermissions":{"0":{"lockedBy":"0x0000000000000000000000000000000000000000","addresses":{},"numTokens":"0x00","permission":1}},"readPermissions":{"0":{"lockedBy":"0x0000000000000000000000000000000000000000","addresses":{},"numTokens":"0x00","permission":1}},"copyPermissionsLockedBy":"0x0000000000000000000000000000000000000000","remixPermissionsLockedBy":"0x0000000000000000000000000000000000000000","readPermissionsLockedBy":"0x0000000000000000000000000000000000000000","splits":{"0":{"amount":9900,"lockedBy":"0x0000000000000000000000000000000000000000","toAddress":"0xde19C037a85A609ec33Fc747bE9Db8809175C3a5"},"1":{"amount":100,"lockedBy":"0x0000000000000000000000000000000000000000","toAddress":"0x40c6BeE45d94063c5B05144489cd8A9879899592"}},"splitsLockedBy":"0x0000000000000000000000000000000000000000","updatedAt":null,"createdAt":null,"deletedAt":null},"childProperties":{"id":"f673127a-c0fc-4e56-b05d-6c247998a14d","totalChildren":"0x00","totalChildrenLockedBy":"0x0000000000000000000000000000000000000000","childrenPerWallet":"-0x01","childrenPerWalletLockedBy":"0x0000000000000000000000000000000000000000","copyPermissions":{"0":{"lockedBy":"0x0000000000000000000000000000000000000000","addresses":{},"numTokens":"0x00","permission":1}},"remixPermissions":{"0":{"lockedBy":"0x0000000000000000000000000000000000000000","addresses":{},"numTokens":"0x00","permission":1}},"readPermissions":{"0":{"lockedBy":"0x0000000000000000000000000000000000000000","addresses":{},"numTokens":"0x00","permission":1}},"copyPermissionsLockedBy":"0x0000000000000000000000000000000000000000","remixPermissionsLockedBy":"0x0000000000000000000000000000000000000000","readPermissionsLockedBy":"0x0000000000000000000000000000000000000000","splits":{"0":{"amount":9900,"lockedBy":"0x0000000000000000000000000000000000000000","toAddress":"0xde19C037a85A609ec33Fc747bE9Db8809175C3a5"},"1":{"amount":100,"lockedBy":"0x0000000000000000000000000000000000000000","toAddress":"0x40c6BeE45d94063c5B05144489cd8A9879899592"}},"splitsLockedBy":"0x0000000000000000000000000000000000000000","updatedAt":null,"createdAt":null,"deletedAt":null}}`
		)

		const meem = await orm.models.Meem.findOne({
			where: {
				tokenId: req.query.tokenId as string
			},
			include: [
				{
					model: orm.models.MeemProperties,
					as: 'Properties'
				},
				{
					model: orm.models.MeemProperties,
					as: 'ChildProperties'
				}
			]
		})

		if (!meem) {
			return res.json({})
		}

		const meemData = {
			...meem.get({ plain: true })
		}

		const token = services.contractEvents.saveToGun({
			path: `test3`,
			data: meemData
		})

		const cleanData = services.contractEvents.toPureObject(meemData)
		// const cleanData = services.contractEvents.toPureObject(data)
		// console.log(JSON.stringify(cleanData))

		// await services.contractEvents.createNewMeem('0x018712')

		const result = gun.get('meems/0x018711')
		result.once(m => console.log(m))

		return res.json(cleanData)
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
		// const gas = await services.meem.getGasEstimate(MeemAPI.NetworkName.Polygon)
		// const gas = await services.web3.getGasEstimate({
		// 	chain: MeemAPI.networkNameToChain(config.NETWORK)
		// })

		// return res.json({
		// 	gas
		// })

		const contract = await services.meem.getMeemContract()

		const result = await contract.wrappedTokens([
			{
				chain: MeemAPI.Chain.Rinkeby,
				contractAddress: '0x3d60EFFFC36bCdD32f8966A0339B6f78Aaff121e',
				tokenId: 48
			}
			// {
			// 	chain: MeemAPI.Chain.Rinkeby,
			// 	contractAddress: '0x3d60EFFFC36bCdD32f8966A0339B6f78Aaff121e',
			// 	tokenId: 49
			// },
			// {
			// 	chain: MeemAPI.Chain.Rinkeby,
			// 	contractAddress: '0x3d60EFFFC36bCdD32f8966A0339B6f78Aaff121e',
			// 	tokenId: 50
			// }
		])

		return res.json({
			result
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

		const meemId = await orm.models.MeemIdentification.findOne({
			include: [
				{
					model: orm.models.Wallet,
					where: {
						address: walletAddress
					}
				}
			]
		})

		if (!meemId) {
			throw new Error('MEEM_ID_NOT_FOUND')
		}

		const jwt = await services.meemId.generateJWT({
			meemId: meemId.id
		})

		return res.json({ jwt })
	}
}
