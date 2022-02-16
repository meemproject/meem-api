import AWS from 'aws-sdk'
import BigNumber from 'bignumber.js'
import type { ethers as Ethers } from 'ethers'
import { Response } from 'express'
import _ from 'lodash'
import moment from 'moment'
import { Op } from 'sequelize'
import sharp from 'sharp'
import TwitterApi, { UserV2 } from 'twitter-api-v2'
import { v4 as uuidv4, validate as uuidValidate } from 'uuid'
import Meem from '../models/Meem'
import {
	IAPIRequestPaginated,
	IAuthenticatedRequest,
	IRequest,
	IResponse
} from '../types/app'
import { MeemAPI } from '../types/meem.generated'

export default class MeemController {
	// TODO: Move to dedicated MeemID controller?
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

	public static async getMeem(
		req: IRequest<MeemAPI.v1.GetMeem.IDefinition>,
		res: IResponse<MeemAPI.v1.GetMeem.IResponseBody>
	): Promise<Response> {
		let { tokenId } = req.params
		let meem: Meem | null = null
		const isUuid = uuidValidate(tokenId)

		if (isUuid) {
			meem = await orm.models.Meem.findOne({
				where: {
					meemId: tokenId
				},
				include: [
					{
						model: orm.models.MeemProperties,
						as: 'Properties'
					},
					{
						model: orm.models.MeemProperties,
						as: 'ChildProperties'
					},
					{
						model: orm.models.Transfer
					}
				]
			})

			if (!meem) {
				throw new Error('TOKEN_NOT_FOUND')
			}

			tokenId = `${services.web3.toBigNumber(meem.tokenId).toNumber()}`
		} else {
			const tokenIdNumber = services.web3.toBigNumber(tokenId)
			meem = await orm.models.Meem.findOne({
				where: {
					tokenId: tokenIdNumber.toHexString()
				},
				include: [
					{
						model: orm.models.MeemProperties,
						as: 'Properties'
					},
					{
						model: orm.models.MeemProperties,
						as: 'ChildProperties'
					},
					{
						model: orm.models.Transfer
					}
				]
			})

			if (!meem) {
				throw new Error('TOKEN_NOT_FOUND')
			}

			tokenId = `${tokenIdNumber.toNumber()}`
		}

		const meemContract = await services.meem.getMeemContract()

		let { metadata, tokenURI } = meem

		if (!tokenURI || tokenURI === '') {
			tokenURI = await meemContract.tokenURI(tokenId)
		}

		if (_.keys(metadata).length === 0) {
			metadata = (await services.meem.getErc721Metadata(
				tokenURI
			)) as MeemAPI.IMeemMetadata
		}

		if (
			_.keys(metadata).length === 0 ||
			!meem.ChildProperties ||
			!meem.Properties
		) {
			throw new Error('TOKEN_NOT_FOUND')
		}

		const transfers = meem.Transfers?.map(t => ({
			from: t.from,
			to: t.to,
			transactionHash: t.transactionHash,
			timestamp: moment(t.transferredAt).unix()
		}))

		return res.json({
			meem: services.meem.meemToIMeem(meem),
			transfers: transfers ?? []
		})
	}

	public static async getMeems(
		req: IAPIRequestPaginated<MeemAPI.v1.GetMeems.IDefinition>,
		res: IResponse<MeemAPI.v1.GetMeems.IResponseBody>
	): Promise<Response> {
		const { owner, meemType, mintedBy } = req.query
		const { page, limit: requestedLimit } = req
		const limit = requestedLimit > 100 ? 100 : requestedLimit
		const itemsPerPage = limit
		let meems: MeemAPI.IMetadataMeem[] = []
		const and: Record<string, any>[] = []
		if (owner) {
			and.push(
				orm.sequelize.where(
					orm.sequelize.fn('lower', orm.sequelize.col('owner')),
					owner.toLowerCase()
				)
			)
		}
		if (meemType) {
			and.push({
				meemType
			})
		}
		if (mintedBy) {
			and.push(
				orm.sequelize.where(
					orm.sequelize.fn('lower', orm.sequelize.col('mintedBy')),
					mintedBy.toLowerCase()
				)
			)
		}
		const { rows: rawMeems, count } = await orm.models.Meem.findAndCountAll({
			where: {
				[Op.and]: and
			},
			order: [['createdAt', 'DESC']],
			offset: page * limit,
			limit,
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

		let finalCount = count

		rawMeems.forEach(rawMeem => {
			if (rawMeem.Properties && rawMeem.ChildProperties) {
				meems.push(services.meem.meemToIMeem(rawMeem))
			} else {
				finalCount -= 1
				log.crit(`Missing properties for Meem w/ tokenId: ${rawMeem.tokenId}`)
			}
		})

		/* Twitter-specific Code */
		const client = new TwitterApi(config.TWITTER_BEARER_TOKEN)
		const twitterIds: string[] = []

		meems.forEach(m => {
			const twitterUserId =
				m.metadata.extension_properties?.meem_tweets_extension?.tweet?.userId
			if (twitterUserId) {
				twitterIds.push(twitterUserId)
			}
		})

		if (twitterIds.length > 0) {
			const twitterUsers =
				twitterIds.length > 0
					? await client.v2.users(twitterIds, {
							'user.fields': ['profile_image_url']
					  })
					: null

			if (twitterUsers) {
				meems = await Promise.all(
					meems.map(async m => {
						const twitterUserId: string | undefined =
							m.metadata.extension_properties?.meem_tweets_extension?.tweet
								?.userId
						const twitterUser: UserV2 | undefined = twitterUserId
							? twitterUsers.data.find(u => u.id === twitterUserId)
							: undefined
						return {
							...m,
							...(twitterUserId &&
								twitterUser && {
									defaultTwitterUser: {
										id: twitterUserId,
										username: twitterUser?.username,
										displayName: twitterUser?.name,
										profileImageUrl: twitterUser?.profile_image_url || null
									}
								})
						}
					})
				)
			}
		}
		/* End Twitter-specific Code */

		return res.json({
			meems,
			itemsPerPage,
			totalItems: finalCount
		})
	}

	public static async claimMeem(
		req: IRequest<MeemAPI.v1.ClaimMeem.IDefinition>,
		res: IResponse<MeemAPI.v1.ClaimMeem.IResponseBody>
	): Promise<Response> {
		if (!req.meemId) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		if (!req.meemId.MeemPass) {
			throw new Error('MEEMPASS_NOT_FOUND')
		}

		const { tokenId } = req.params

		await services.meem.claimMeem(tokenId, req.meemId)

		return res.json({
			status: 'success'
		})
	}

	public static async mintWrappedMeem(
		req: IRequest<MeemAPI.v1.MintMeem.IDefinition>,
		res: IResponse<MeemAPI.v1.MintMeem.IResponseBody>
	): Promise<Response> {
		const data = req.body

		const meemContract = await services.meem.getMeemContract()

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
			await services.meem.mintWrappedMeem(mintData)
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

	public static async getWrappedTokens(
		req: IRequest<MeemAPI.v1.GetWrappedTokens.IDefinition>,
		res: IResponse<MeemAPI.v1.GetWrappedTokens.IResponseBody>
	): Promise<any> {
		const contract = await services.meem.getMeemContract()
		let tokenIds: Ethers.BigNumber[] = []

		const nfts = req.body.nfts.map(n => ({
			...n,
			tokenId: services.web3.toBigNumber(n.tokenId)
		}))

		try {
			tokenIds = await contract.wrappedTokens(nfts)
		} catch (e) {
			log.warn(e)
		}
		const wrappedTokens: {
			chain: MeemAPI.Chain
			contractAddress: string
			tokenId: string
			wrappedTokenId: string
		}[] = []

		nfts.forEach((nft, i) => {
			if (typeof tokenIds[i] !== 'undefined' && tokenIds[i].toNumber() !== 0) {
				wrappedTokens.push({
					...nft,
					tokenId: nft.tokenId.toHexString(),
					wrappedTokenId: tokenIds[i].toHexString()
				})
			}
		})

		return res.json({
			wrappedTokens
		})
	}

	public static async createMeemProject(
		req: IRequest<MeemAPI.v1.CreateMeemProject.IDefinition>,
		res: IResponse<MeemAPI.v1.CreateMeemProject.IResponseBody>
	): Promise<any> {
		if (!req.meemId?.MeemPass?.canCreateProjects) {
			throw new Error('NOT_AUTHORIZED')
		}

		if (
			!req.body.name ||
			!req.body.description ||
			!Array.isArray(req.body.minterAddresses)
		) {
			throw new Error('MISSING_PARAMETERS')
		}

		await services.meem.createMeemProject({
			name: req.body.name,
			description: req.body.description,
			minterAddresses: req.body.minterAddresses
		})

		return res.json({
			status: 'success'
		})
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

	public static async getChildMeems(
		req: IAPIRequestPaginated<MeemAPI.v1.GetChildMeems.IDefinition>,
		res: IResponse<MeemAPI.v1.GetChildMeems.IResponseBody>
	): Promise<any> {
		let { tokenId } = req.params
		const { owner, meemType, mintedBy } = req.query
		const { page, limit: requestedLimit } = req
		const limit = requestedLimit > 100 ? 100 : requestedLimit

		if (!tokenId) {
			throw new Error('MISSING_PARAMETERS')
		}

		// Make sure numeric token IDs are converted to hex
		tokenId = services.web3.toBigNumber(tokenId).toHexString()

		const and: Record<string, any>[] = [
			{
				parent: config.MEEM_PROXY_ADDRESS
			},
			{
				parentTokenId: tokenId
			}
		]
		if (owner) {
			and.push(
				orm.sequelize.where(
					orm.sequelize.fn('lower', orm.sequelize.col('owner')),
					owner.toLowerCase()
				)
			)
		}
		if (meemType) {
			and.push({
				meemType
			})
		}
		if (mintedBy) {
			and.push(
				orm.sequelize.where(
					orm.sequelize.fn('lower', orm.sequelize.col('mintedBy')),
					mintedBy.toLowerCase()
				)
			)
		}

		const result = await orm.models.Meem.findAndCountAll({
			where: {
				[Op.and]: and
			},
			order: [['createdAt', 'DESC']],
			include: [
				{
					model: orm.models.MeemProperties,
					as: 'Properties'
				},
				{
					model: orm.models.MeemProperties,
					as: 'ChildProperties'
				}
			],
			limit,
			offset: page * limit
		})

		return res.json({
			meems: result.rows.map(m => services.meem.meemToIMeem(m)),
			totalItems: result.count,
			itemsPerPage: limit
		})
	}

	public static async getCollectors(
		req: IAPIRequestPaginated<MeemAPI.v1.GetCollectors.IDefinition>,
		res: IResponse<MeemAPI.v1.GetCollectors.IResponseBody>
	): Promise<any> {
		const { tokenId } = req.params
		const { page, limit: requestedLimit } = req
		const limit = requestedLimit > 100 ? 100 : requestedLimit

		if (!tokenId) {
			throw new Error('MISSING_PARAMETERS')
		}

		const and: Record<string, any>[] = [
			{
				tokenId
			},
			{
				meemType: MeemAPI.MeemType.Copy
			}
		]

		const result = await orm.models.Meem.findAndCountAll({
			where: {
				[Op.and]: and
			},
			order: [['mintedAt', 'ASC']],
			include: [
				{
					model: orm.models.MeemProperties,
					as: 'Properties'
				},
				{
					model: orm.models.MeemProperties,
					as: 'ChildProperties'
				}
			],
			limit,
			offset: page * limit
		})

		const copies = result.rows.map(m => services.meem.meemToIMeem(m))

		let collectors = await Promise.all(
			copies.map(async (copy, i) => {
				const meemId = await services.meemId.getMeemId({
					walletAddress: copy.owner
				})
				return {
					...copy,
					edition: page + i + 1,
					meemId
				}
			})
		)

		const client = new TwitterApi(config.TWITTER_BEARER_TOKEN)

		const twitterIds = collectors.map(
			collector => collector.meemId.defaultTwitter
		)

		let twitterUsers: UserV2[] = []

		if (twitterIds.length > 0) {
			const twitterUsersResult = await client.v2.users(twitterIds, {
				'user.fields': ['profile_image_url']
			})
			twitterUsers = twitterUsersResult.data
		}

		collectors = collectors.map(collector => {
			const twitterUser: UserV2 | undefined = twitterUsers.find(
				u => u.id === collector.meemId.defaultTwitter
			)
			return {
				...collector,
				...(twitterUser && {
					defaultTwitterUser: {
						id: collector.meemId.defaultTwitter,
						username: twitterUser?.username,
						displayName: twitterUser?.name,
						profileImageUrl: twitterUser?.profile_image_url || null
					}
				})
			}
		})

		const collectorResults: MeemAPI.ICollectorResult[] = collectors.map(c => {
			return {
				owner: c.owner,
				edition: c.edition,
				twitterUser: c.defaultTwitterUser
			}
		})

		return res.json({
			collectors: collectorResults,
			totalItems: result.count,
			itemsPerPage: limit
		})
	}
}
