import { Response } from 'express'
import { IRequest, IResponse } from '../types/app'
import { MeemAPI } from '../types/meem.generated'

export default class MeemController {
	public static async getWhitelist(
		req: IRequest<MeemAPI.v1.GetWhitelist.IDefinition>,
		res: IResponse<MeemAPI.v1.GetWhitelist.IResponseBody>
	): Promise<Response> {
		const whitelist = services.meem.getWhitelist()

		return res.json({
			whitelist
		})
	}

	public static async getMeem(
		req: IRequest<MeemAPI.v1.GetMeem.IDefinition>,
		res: IResponse<MeemAPI.v1.GetMeem.IResponseBody>
	): Promise<Response> {
		const { tokenId } = req.query
		const meemContract = services.meem.meemContract()

		const m = await meemContract.getMeem(tokenId)

		return res.json({ m })
	}

	public static async mintMeem(
		req: IRequest<MeemAPI.v1.MintMeem.IDefinition>,
		res: IResponse<MeemAPI.v1.MintMeem.IResponseBody>
	): Promise<Response> {
		const { tokenId } = req.query
		const meemContract = services.meem.meemContract()

		const m = await meemContract.getMeem(tokenId)

		return res.json({ m })
	}

	public static async getTokenInfo(
		req: IRequest<MeemAPI.v1.GetTokenInfo.IDefinition>,
		res: IResponse<MeemAPI.v1.GetTokenInfo.IResponseBody>
	): Promise<Response> {
		const { tokenId, networkName, address } = req.query
		const contract = services.meem.erc721Contract({
			networkName,
			address
		})

		const owner = await contract.ownerOf(tokenId)
		const tokenURI = await contract.tokenURI(tokenId)

		return res.json({ owner, tokenURI })
	}
}
