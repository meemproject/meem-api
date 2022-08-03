// eslint-disable-next-line import/no-extraneous-dependencies
import AWS from 'aws-sdk'
import { Response } from 'express'
import { DateTime } from 'luxon'
import { Op } from 'sequelize'
import sharp from 'sharp'
import TwitterApi from 'twitter-api-v2'
import MeemContract from '../models/MeemContract'
import {
	IAPIRequestPaginated,
	IAuthenticatedRequest,
	IRequest,
	IResponse
} from '../types/app'
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

	public static async getWhitelist(
		req: IRequest<MeemAPI.v1.GetWhitelist.IDefinition>,
		res: IResponse<MeemAPI.v1.GetWhitelist.IResponseBody>
	): Promise<Response> {
		const whitelist = services.meem.getWhitelist()

		return res.json({
			whitelist
		})
	}

	public static async getAccessList(
		req: IRequest<MeemAPI.v1.GetAccessList.IDefinition>,
		res: IResponse<MeemAPI.v1.GetAccessList.IResponseBody>
	): Promise<Response> {
		const access = services.meem.getAccessList()

		return res.json({
			access
		})
	}

	public static async mintOriginalMeem(
		req: IRequest<MeemAPI.v1.MintOriginalMeem.IDefinition>,
		res: IResponse<MeemAPI.v1.MintOriginalMeem.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		// TODO: Check permissions for minting
		// Allowed if user is a contract admin
		const meemContract =
			await orm.models.MeemContract.findByAddress<MeemContract>(
				req.body.meemContractAddress,
				[{ model: orm.models.Wallet, include: [orm.models.MeemContractWallet] }]
			)

		if (!meemContract) {
			throw new Error('MEEM_CONTRACT_NOT_FOUND')
		}

		const canMint = await meemContract.canMint(req.wallet.address)

		if (!canMint) {
			throw new Error('MINTING_ACCESS_DENIED')
		}

		if (config.DISABLE_ASYNC_MINTING) {
			try {
				await services.meem.mintOriginalMeem({
					...req.body,
					mintedBy: req.wallet.address
				})
			} catch (e) {
				log.crit(e)
				sockets?.emitError(config.errors.MINT_FAILED, req.wallet.address)
			}
		} else {
			const lambda = new AWS.Lambda({
				accessKeyId: config.APP_AWS_ACCESS_KEY_ID,
				secretAccessKey: config.APP_AWS_SECRET_ACCESS_KEY,
				region: 'us-east-1'
			})
			await lambda
				.invoke({
					InvocationType: 'Event',
					FunctionName: config.LAMBDA_MINT_ORIGINAL_FUNCTION,
					Payload: JSON.stringify({
						...req.body,
						mintedBy: req.wallet.address
					})
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

	public static async saveMetadata(
		req: IAuthenticatedRequest<MeemAPI.v1.SaveMetadata.IDefinition>,
		res: IResponse<MeemAPI.v1.SaveMetadata.IResponseBody>
	): Promise<any> {
		let createMetadata: MeemAPI.ICreateMeemMetadata

		try {
			createMetadata = JSON.parse(req.body.metadata)
		} catch (e) {
			throw new Error('INVALID_METADATA')
		}

		/** Ensure that trusted properties are not set */
		createMetadata.meem_properties = undefined
		createMetadata.extension_properties = undefined

		let file: Buffer | undefined

		if (Array.isArray(req.files)) {
			file = req.files[0].buffer
		} else if (typeof req.files === 'object') {
			const fields = Object.values(req.files)
			if (fields.length > 0) {
				const field = fields[0]
				if (field.length > 0) {
					// eslint-disable-next-line prefer-destructuring
					file = field[0].buffer
				}
			}
		}

		if (!file) {
			throw new Error('INVALID_FILE')
		}

		let img = sharp(file)
		const imageMetadata = await img.metadata()
		let imageWidth = imageMetadata.width || 400

		// Set max image size to 1024
		if (imageWidth > 1024) {
			imageWidth = imageWidth > 1024 ? 1024 : imageWidth
			img = img.resize(imageWidth)
		}

		const buff = await img.toBuffer()

		const { tokenURI, metadata } = await services.web3.saveMeemMetadata({
			image: buff,
			metadata: createMetadata
		})

		return res.json({
			tokenURI,
			metadata
		})
	}

	public static async getClippings(
		req: IAPIRequestPaginated<MeemAPI.v1.GetMeemClippings.IDefinition>,
		res: IResponse<MeemAPI.v1.GetMeemClippings.IResponseBody>
	): Promise<Response> {
		const { page, limit } = req

		const { address } = req.query
		const shouldIncludeMetadata = req.query.shouldIncludeMetadata === 'true'
		const tokenId = req.query.tokenId
			? services.web3.toBigNumber(req.query.tokenId).toHexString()
			: undefined

		let where: Record<string, any> = {}

		if (address) {
			where = orm.sequelize.where(
				orm.sequelize.fn('lower', orm.sequelize.col('address')),
				address.toLowerCase()
			)
		}
		const meemWhere: Record<string, any> = tokenId
			? { tokenId: tokenId.toLowerCase() }
			: {}

		const result = await orm.models.Clipping.findAndCountAll({
			where,
			limit,
			offset: page * limit,
			include: [
				{
					model: orm.models.Meem,
					where: meemWhere,
					required: true
				}
			],
			order: [['clippedAt', 'DESC']]
		})

		const cleanClippings: MeemAPI.IClippingExtended[] = []

		result.rows.forEach(c => {
			if (c.Meem?.tokenId) {
				const clip: MeemAPI.IClippingExtended = {
					address: c.address,
					clippedAt: DateTime.fromJSDate(c.clippedAt).toSeconds(),
					hasMeemId: false,
					tokenId: c.Meem.tokenId
				}
				if (shouldIncludeMetadata) {
					// clip.meem = services.meem.meemToIMeem(c.Meem)
				}
				cleanClippings.push(clip)
			} else {
				log.warn(`Invalid clipping: ${c.id}`)
			}
		})

		return res.json({
			clippings: cleanClippings,
			totalItems: result.count
		})
	}

	public static async checkClippingStatus(
		req: IAPIRequestPaginated<MeemAPI.v1.CheckClippingStatus.IDefinition>,
		res: IResponse<MeemAPI.v1.CheckClippingStatus.IResponseBody>
	): Promise<Response> {
		const { address, tokenIds } = req.body

		if (!Array.isArray(tokenIds) || !address) {
			throw new Error('MISSING_PARAMETERS')
		}

		const result = await orm.models.Clipping.findAll({
			include: [
				{
					model: orm.models.Meem,
					where: {
						tokenId: {
							[Op.in]: tokenIds.slice(0, 200)
						}
					},
					required: true
				}
			]
		})

		const status: { [tokenId: string]: boolean } = {}

		tokenIds.forEach(t => {
			const clipping = result.find(c => c.Meem?.tokenId === t)
			status[t] = !!clipping
		})

		return res.json({
			status
		})
	}
}
