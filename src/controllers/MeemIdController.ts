// eslint-disable-next-line import/no-extraneous-dependencies
import AWS from 'aws-sdk'
import { Response } from 'express'
import { TwitterApi, UserV2 } from 'twitter-api-v2'
import Twitter from '../models/Twitter'
import Wallet from '../models/Wallet'
import { IAPIRequestPaginated, IRequest, IResponse } from '../types/app'
import { MeemAPI } from '../types/meem.generated'

export default class AuthController {
	public static async getNonce(
		req: IRequest<MeemAPI.v1.GetNonce.IDefinition>,
		res: IResponse<MeemAPI.v1.GetNonce.IResponseBody>
	): Promise<Response> {
		if (!req.query.address) {
			throw new Error('MISSING_PARAMETERS')
		}
		// Generate a nonce and save it for the wallet
		const nonce = await services.meemId.getNonce({
			address: req.query.address as string
		})

		return res.json({
			nonce
		})
	}

	public static async login(
		req: IRequest<MeemAPI.v1.Login.IDefinition>,
		res: IResponse<MeemAPI.v1.Login.IResponseBody>
	): Promise<Response> {
		const { jwt } = await services.meemId.login({
			address: req.body.address,
			signature: req.body.signature
		})

		return res.json({
			jwt
		})
	}

	public static async createOrUpdateMeemId(
		req: IRequest<MeemAPI.v1.CreateOrUpdateMeemId.IDefinition>,
		res: IResponse<MeemAPI.v1.CreateOrUpdateMeemId.IResponseBody>
	): Promise<Response> {
		// Verify twitter and wallet, create MeemId and return JWT
		const data = {
			address: req.body.address,
			signature: req.body.signature,
			twitterAccessToken: req.body.twitterAccessToken,
			twitterAccessSecret: req.body.twitterAccessSecret
		}
		if (config.DISABLE_ASYNC_MINTING) {
			await services.meemId.createOrUpdateMeemId(data)
		} else {
			const lambda = new AWS.Lambda({
				accessKeyId: config.APP_AWS_ACCESS_KEY_ID,
				secretAccessKey: config.APP_AWS_SECRET_ACCESS_KEY,
				region: 'us-east-1'
			})

			await lambda
				.invoke({
					InvocationType: 'Event',
					FunctionName: config.LAMBDA_MEEMID_UPDATE_FUNCTION,
					Payload: JSON.stringify(data)
				})
				.promise()
		}
		return res.json({
			status: 'success'
		})
	}

	public static async getMeemId(
		req: IRequest<MeemAPI.v1.GetMeemId.IDefinition>,
		res: IResponse<MeemAPI.v1.GetMeemId.IResponseBody>
	): Promise<Response> {
		// Verify twitter and wallet, create MeemId and return JWT
		if (!req.query.address && !req.query.twitterId) {
			throw new Error('MISSING_PARAMETERS')
		}

		const item: Wallet | Twitter | null = await (req.query.address
			? (orm.models.Wallet.findByAddress(
					req.query.address
			  ) as unknown as Wallet)
			: orm.models.Twitter.findOne({
					where: {
						twitterId: req.query.twitterId
					}
			  }))

		if (!item || !item.MeemIdentificationId) {
			throw new Error('MEEM_ID_NOT_FOUND')
		}

		const meemId = await services.meemId.getMeemId({
			meemIdentificationId: item.MeemIdentificationId
		})

		let defaultTwitterUser
		if (meemId.defaultTwitter && meemId.defaultTwitter !== '') {
			const client = new TwitterApi(config.TWITTER_BEARER_TOKEN)
			const twitterUser = await client.v2.user(meemId.defaultTwitter, {
				'user.fields': ['profile_image_url']
			})
			defaultTwitterUser = {
				id: twitterUser.data.id,
				username: twitterUser.data.username,
				displayName: twitterUser.data.name,
				profileImageUrl: twitterUser.data.profile_image_url || null
			}
		}

		return res.json({
			meemId: {
				...meemId,
				defaultTwitterUser
			}
		})
	}

	public static async getMe(
		req: IRequest<MeemAPI.v1.GetMe.IDefinition>,
		res: IResponse<MeemAPI.v1.GetMe.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}
		return res.json({
			walletId: req.wallet.id,
			address: req.wallet.address
		})
	}

	public static async getMeemPasses(
		req: IAPIRequestPaginated<MeemAPI.v1.GetMeemPasses.IDefinition>,
		res: IResponse<MeemAPI.v1.GetMeemPasses.IResponseBody>
	): Promise<Response> {
		const { page, limit } = req

		const meemIds = await orm.models.MeemIdentification.findAndCountAll({
			limit,
			order: [['createdAt', 'DESC']],
			offset: page * limit,
			distinct: true,
			include: [
				{
					model: orm.models.Twitter,
					required: true
				},
				{
					model: orm.models.Wallet,
					required: true
				},
				{
					model: orm.models.MeemPass,
					required: true
				}
			]
		})

		const twitters = meemIds.rows.map(mId =>
			mId.Twitters && mId.Twitters?.length > 0
				? mId.Twitters[0].twitterId
				: null
		)

		const twitterIds = twitters.filter(twitterId => !!twitterId) as string[]

		const client = new TwitterApi(config.TWITTER_BEARER_TOKEN)

		const twitterUsers =
			twitterIds.length > 0 ? await client.v2.users(twitterIds) : null

		const meemIdData = meemIds.rows.map(mId => {
			const tweetsPerDayQuota = mId.MeemPass?.tweetsPerDayQuota ?? 0
			const twitterUser: UserV2 | undefined =
				mId.Twitters && mId.Twitters.length > 0 && twitterUsers
					? twitterUsers.data.find(
							u => mId.Twitters && u.id === mId.Twitters[0].twitterId
					  )
					: undefined
			return {
				id: mId.MeemPass?.id,
				createdAt: mId.MeemPass?.createdAt,
				twitter: {
					username: twitterUser?.username || '',
					twitterId:
						mId.Twitters && mId.Twitters.length > 0
							? mId.Twitters[0].twitterId
							: null,
					hasApplied: mId.MeemPass?.hasApplied === true,
					isWhitelisted: tweetsPerDayQuota > 0,
					tweetsPerDayQuota
				}
			}
		})

		return res.json({
			meemPasses: meemIdData,
			itemsPerPage: limit,
			totalItems: meemIds.count
		})
	}

	public static async updateMeemPass(
		req: IRequest<MeemAPI.v1.UpdateMeemPass.IDefinition>,
		res: IResponse<MeemAPI.v1.UpdateMeemPass.IResponseBody>
	): Promise<Response> {
		if (!req.meemId) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		if (!req.meemId.MeemPass) {
			throw new Error('MEEMPASS_NOT_FOUND')
		}

		req.meemId.MeemPass.hasApplied = req.body.hasAppliedTwitter === true

		await req.meemId.MeemPass.save()

		return res.json({
			status: 'success'
		})
	}

	public static async updateMeemPassById(
		req: IRequest<MeemAPI.v1.UpdateMeemPassById.IDefinition>,
		res: IResponse<MeemAPI.v1.UpdateMeemPassById.IResponseBody>
	): Promise<Response> {
		if (!req.meemId) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		if (!req.meemId.MeemPass) {
			throw new Error('MEEMPASS_NOT_FOUND')
		}

		if (!req.params.meemPassId) {
			throw new Error('MEEMPASS_NOT_FOUND')
		}

		const meemPass = await orm.models.MeemPass.findOne({
			where: {
				id: req.params.meemPassId
			},
			include: [orm.models.MeemIdentification]
		})

		if (!meemPass) {
			throw new Error('MEEMPASS_NOT_FOUND')
		}

		if (!meemPass.MeemIdentification) {
			throw new Error('MEEMPASS_NOT_FOUND')
		}

		if (!req.meemId.MeemPass.isAdmin) {
			throw new Error('NOT_AUTHORIZED')
		}

		let shouldSendWhitelistTweet = false

		if (req.body.isWhitelisted === true && meemPass.tweetsPerDayQuota < 1) {
			meemPass.tweetsPerDayQuota = config.MEEMPASS_DEFAULT_TWEETS_PER_DAY_QUOTA
			shouldSendWhitelistTweet = true
		} else if (
			req.body.isWhitelisted === false &&
			meemPass.tweetsPerDayQuota > 1
		) {
			meemPass.tweetsPerDayQuota = 0
		}

		await meemPass.save()

		if (shouldSendWhitelistTweet) {
			const meemId = await services.meemId.getMeemId({
				meemIdentificationId: meemPass.MeemIdentification.id
			})

			let { defaultTwitter } = meemId

			if (!defaultTwitter && meemId.twitters.length > 0) {
				// eslint-disable-next-line prefer-destructuring
				defaultTwitter = meemId.twitters[0]
			}

			if (meemId && defaultTwitter) {
				const userClient = new TwitterApi(config.TWITTER_BEARER_TOKEN)
				const tweetClient = new TwitterApi({
					appKey: config.TWITTER_MEEM_ACCOUNT_CONSUMER_KEY,
					appSecret: config.TWITTER_MEEM_ACCOUNT_CONSUMER_SECRET,
					accessToken: config.TWITTER_MEEM_ACCOUNT_TOKEN,
					accessSecret: config.TWITTER_MEEM_ACCOUNT_SECRET
				})

				const twitterUserResult = await userClient.v2.user(defaultTwitter)
				if (twitterUserResult) {
					try {
						await tweetClient.v2.tweet(
							`Hey @${twitterUserResult.data.username}, you're a meember now. Start here: ${config.MEEM_DOMAIN}/app`
						)
					} catch (e) {
						log.error(e)
					}
				}
			}
		}

		return res.json({
			status: 'success'
		})
	}

	public static async updateMeemId(
		req: IRequest<MeemAPI.v1.UpdateMeemId.IDefinition>,
		res: IResponse<MeemAPI.v1.UpdateMeemId.IResponseBody>
	): Promise<Response> {
		if (!req.meemId) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		const { addressToRemove, twitterIdToRemove } = req.body

		await services.meemId.updateMeemId({
			meemId: req.meemId,
			addressToRemove,
			twitterIdToRemove
		})

		return res.json({
			status: 'success'
		})
	}
}
