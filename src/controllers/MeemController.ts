import AWS from 'aws-sdk'
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
		const { tokenId } = req.params
		const meemContract = services.meem.meemContract()

		const meem = await meemContract.getMeem(tokenId)

		// TODO: Clean up this output so it matches IMeem
		return res.json({ meem: services.meem.meemToInterface(meem) })
	}

	public static async mintMeem(
		req: IRequest<MeemAPI.v1.MintMeem.IDefinition>,
		res: IResponse<MeemAPI.v1.MintMeem.IResponseBody>
	): Promise<Response> {
		const data = req.body

		const lambda = new AWS.Lambda({
			accessKeyId: config.APP_AWS_ACCESS_KEY_ID,
			secretAccessKey: config.APP_AWS_SECRET_ACCESS_KEY,
			region: 'us-east-1'
		})

		await lambda
			.invoke({
				FunctionName: config.LAMBDA_MINT_FUNCTION,
				Payload: JSON.stringify(data)
			})
			.promise()

		// TODO: Notify via Websockets

		return res.json({
			status: 'success'
		})
	}

	public static async createMeemImage(
		req: IRequest<MeemAPI.v1.CreateMeemImage.IDefinition>,
		res: IResponse<MeemAPI.v1.CreateMeemImage.IResponseBody>
	): Promise<Response> {
		const data = req.body

		const image = await services.meem.createMeemImage(data)

		// TODO: Finish minting
		return res.json({ image })
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

	public static async getIPFSFile(
		req: IRequest<MeemAPI.v1.GetIPFSFile.IDefinition>,
		res: IResponse<MeemAPI.v1.GetIPFSFile.IResponseBody>
	): Promise<any> {
		const { filename } = req.query
		const { body, type } = await services.ipfs.getIPFSFile(filename)

		if (type === 'application/json') {
			return res.json({ metadata: { ...body } })
		}

		res.setHeader('content-type', type)
		return res.end(body, 'binary')
	}
}
