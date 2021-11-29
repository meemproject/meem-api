import { Response } from 'express'
import { IRequest, IResponse } from '../types/app'
import { MeemAPI } from '../types/meem.generated'

export default class NFTController {
	public static async getNFTs(
		req: IRequest<MeemAPI.v1.GetNFTs.IDefinition>,
		res: IResponse<MeemAPI.v1.GetNFTs.IResponseBody>
	): Promise<Response> {
		const result = await services.web3.getNFTs(req.query)

		return res.json({
			chains: result
		})
	}
}
