import AWS from 'aws-sdk'
import { Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
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

	public static async getMeems(
		req: IRequest<MeemAPI.v1.GetMeems.IDefinition>,
		res: IResponse<MeemAPI.v1.GetMeems.IResponseBody>
	): Promise<Response> {
		const { parent, parentTokenId, parentChain } = req.query
		const meemContract = services.meem.meemContract()

		if (parent && parentTokenId) {
			const isMeem = await meemContract.isNFTWrapped(
				parentChain || 0,
				parent,
				parentTokenId
			)
			if (isMeem) {
				// TODO: Get the actual meem via contract address and tokenId
				const meem = await meemContract.getMeem(0)
				return res.json({
					meems: [
						{
							...meem,
							parent,
							parentTokenId,
							parentChain: parentChain || 0
						}
					]
				})
			}
			return res.json({
				meems: []
			})
		}
		return res.json({
			meems: []
		})
	}

	public static async mintMeem(
		req: IRequest<MeemAPI.v1.MintMeem.IDefinition>,
		res: IResponse<MeemAPI.v1.MintMeem.IResponseBody>
	): Promise<Response> {
		const data = req.body

		const meemContract = services.meem.meemContract()

		const isAlreadyWrapped = await meemContract.isNFTWrapped(
			data.chain,
			data.tokenAddress,
			data.tokenId
		)

		if (isAlreadyWrapped) {
			throw new Error('NFT_ALREADY_WRAPPED')
		}

		let s3ImagePath: string | undefined
		if (data.base64Image) {
			s3ImagePath = `mintImages/${uuidv4()}.png`
			await services.storage.putObject({
				path: s3ImagePath,
				data: Buffer.from(data.base64Image, 'base64')
			})
		}

		const mintData = {
			...data,
			base64Image: undefined,
			s3ImagePath
		}

		if (config.DISABLE_ASYNC_MINTING) {
			await services.meem.mintMeem(mintData)
		} else {
			const lambda = new AWS.Lambda({
				accessKeyId: config.APP_AWS_ACCESS_KEY_ID,
				secretAccessKey: config.APP_AWS_SECRET_ACCESS_KEY,
				region: 'us-east-1'
			})

			await lambda
				.invoke({
					InvocationType: 'Event',
					FunctionName: config.LAMBDA_MINT_FUNCTION,
					Payload: JSON.stringify(mintData)
				})
				.promise()
		}

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

	public static async getWrappedTokens(
		req: IRequest<MeemAPI.v1.GetWrappedTokens.IDefinition>,
		res: IResponse<MeemAPI.v1.GetWrappedTokens.IResponseBody>
	): Promise<any> {
		const contract = services.meem.meemContract()
		const tokenIds = await contract.wrappedTokens(req.body.nfts)

		return res.json({
			tokenIds: tokenIds.map(t => t.toNumber())
		})
	}
}
