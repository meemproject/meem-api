import AWS from 'aws-sdk'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
import { Response } from 'express'
import moment from 'moment'
import TwitterApi, { UserV2 } from 'twitter-api-v2'
import { v4 as uuidv4 } from 'uuid'
import { IAPIRequestPaginated, IRequest, IResponse } from '../types/app'
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
		const { tokenId } = req.params
		const meemContract = services.meem.getMeemContract()

		const meem: any = await meemContract.getMeem(tokenId)
		const tokenURI = await meemContract.tokenURI(tokenId)
		const metadata = (await services.meem.getErc721Metadata(
			tokenURI
		)) as MeemAPI.IMeemMetadata

		// TODO: Clean up this output so it matches IMeem
		return res.json({
			meem: {
				...services.meem.meemToInterface({ tokenId, meem }),
				tokenURI,
				metadata
			}
		})
	}

	public static async getMeems(
		req: IAPIRequestPaginated<MeemAPI.v1.GetMeems.IDefinition>,
		res: IResponse<MeemAPI.v1.GetMeems.IResponseBody>
	): Promise<Response> {
		const { owner } = req.query
		const { page, limit: requestedLimit } = req
		const limit = requestedLimit > 100 ? 100 : requestedLimit
		const itemsPerPage = limit
		let meems: MeemAPI.IMetadataMeem[] = []
		let where: Record<string, any> = {}
		if (owner) {
			where = orm.sequelize.where(
				orm.sequelize.fn('lower', orm.sequelize.col('owner')),
				owner.toLowerCase()
			)
		}
		const { rows: rawMeems, count } = await orm.models.Meem.findAndCountAll({
			where,
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
				meems.push({
					tokenId: rawMeem.tokenId,
					owner: rawMeem.owner,
					parentChain: rawMeem.parentChain,
					parent: MeemAPI.zeroAddress,
					parentTokenId: rawMeem.parentTokenId,
					rootChain: rawMeem.rootChain,
					root: MeemAPI.zeroAddress,
					rootTokenId: rawMeem.rootTokenId,
					generation: rawMeem.generation,
					properties: rawMeem.Properties,
					childProperties: rawMeem.ChildProperties,
					mintedAt: moment(rawMeem.mintedAt).unix(),
					data: rawMeem.data,
					metadata: rawMeem.metadata
				})
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

	public static async mintMeem(
		req: IRequest<MeemAPI.v1.MintMeem.IDefinition>,
		res: IResponse<MeemAPI.v1.MintMeem.IResponseBody>
	): Promise<Response> {
		const data = req.body

		const meemContract = services.meem.getMeemContract()

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
		const contract = services.meem.getMeemContract()
		let tokenIds: ethers.BigNumber[] = []

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
}
