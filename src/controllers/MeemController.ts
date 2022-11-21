import { Response } from 'express'
import TwitterApi from 'twitter-api-v2'
import { IRequest, IResponse } from '../types/app'
import { MeemAPI } from '../types/meem.generated'

export default class MeemController {
	public static async getTwitterAuthUrl(
		req: IRequest<MeemAPI.v1.GetTwitterAuthUrl.IDefinition>,
		res: IResponse<MeemAPI.v1.GetTwitterAuthUrl.IResponseBody>
	): Promise<Response> {
		const client = new TwitterApi({
			appKey: config.TWITTER_CONSUMER_KEY,
			appSecret: config.TWITTER_CONSUMER_SECRET
		})
		const authLink = await client.generateAuthLink(
			config.TWITTER_AUTH_CALLBACK_URL
		)
		return res.json({
			url: authLink.url,
			oauthToken: authLink.oauth_token,
			oauthTokenSecret: authLink.oauth_token_secret
		})
	}

	public static async getTwitterAccessToken(
		req: IRequest<MeemAPI.v1.GetTwitterAccessToken.IDefinition>,
		res: IResponse<MeemAPI.v1.GetTwitterAccessToken.IResponseBody>
	): Promise<Response> {
		const data = req.body
		const client = new TwitterApi({
			appKey: config.TWITTER_CONSUMER_KEY,
			appSecret: config.TWITTER_CONSUMER_SECRET,
			accessToken: data.oauthToken,
			accessSecret: data.oauthTokenSecret
		})
		const loginResult = await client.login(data.oauthVerifier)
		return res.json({
			accessToken: loginResult.accessToken,
			accessTokenSecret: loginResult.accessSecret
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
		const contract = await services.meem.erc721Contract({
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

	public static async getScreenshot(
		req: IRequest<MeemAPI.v1.GetUrlScreenshot.IDefinition>,
		res: IResponse<MeemAPI.v1.GetUrlScreenshot.IResponseBody>
	): Promise<any> {
		const buffer = await services.scraper.screenshotUrl(req.query.url)

		res.contentType('image/jpeg')
		res.send(buffer)
	}

	// public static async saveMetadata(
	// 	req: IAuthenticatedRequest<MeemAPI.v1.SaveMetadata.IDefinition>,
	// 	res: IResponse<MeemAPI.v1.SaveMetadata.IResponseBody>
	// ): Promise<any> {
	// 	let createMetadata: MeemAPI.ICreateMeemMetadata

	// 	try {
	// 		createMetadata = JSON.parse(req.body.metadata)
	// 	} catch (e) {
	// 		throw new Error('INVALID_METADATA')
	// 	}

	// 	/** Ensure that trusted properties are not set */
	// 	createMetadata.meem_properties = undefined
	// 	createMetadata.extension_properties = undefined

	// 	let file: Buffer | undefined

	// 	if (Array.isArray(req.files)) {
	// 		file = req.files[0].buffer
	// 	} else if (typeof req.files === 'object') {
	// 		const fields = Object.values(req.files)
	// 		if (fields.length > 0) {
	// 			const field = fields[0]
	// 			if (field.length > 0) {
	// 				// eslint-disable-next-line prefer-destructuring
	// 				file = field[0].buffer
	// 			}
	// 		}
	// 	}

	// 	if (!file) {
	// 		throw new Error('INVALID_FILE')
	// 	}

	// 	let img = sharp(file)
	// 	const imageMetadata = await img.metadata()
	// 	let imageWidth = imageMetadata.width || 400

	// 	// Set max image size to 1024
	// 	if (imageWidth > 1024) {
	// 		imageWidth = imageWidth > 1024 ? 1024 : imageWidth
	// 		img = img.resize(imageWidth)
	// 	}

	// 	const buff = await img.toBuffer()

	// 	const { tokenURI, metadata } = await services.web3.saveMeemMetadata({
	// 		image: buff,
	// 		metadata: createMetadata
	// 	})

	// 	return res.json({
	// 		tokenURI,
	// 		metadata
	// 	})
	// }
}
