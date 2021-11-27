import { Request, Response } from 'express'
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
		// const gas = await services.meem.getGasEstimate(MeemAPI.NetworkName.Polygon)
		const gas = await services.web3.getGasEstimate({
			chain: MeemAPI.networkNameToChain(config.NETWORK)
		})

		return res.json({
			gas
		})

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
}
