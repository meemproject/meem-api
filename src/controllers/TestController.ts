/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { ethers } from 'ethers'
import { Request, Response } from 'express'
import { DateTime, Duration } from 'luxon'
import { Op } from 'sequelize'
import { MeemAPI } from '../types/meem.generated'

export default class ConfigController {
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
		log.debug(ethers.BigNumber.from(-1))
		log.debug(services.web3.toBigNumber(-1))

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

		const contract = services.meem.meemContract()

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
}
