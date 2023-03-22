import { Response } from 'express'
import { auth, Client } from 'twitter-api-sdk'
import { OAuth2Scopes } from 'twitter-api-sdk/dist/OAuth2User'
import { Events } from '../services/Analytics'
import { IAuthenticatedRequest, IResponse } from '../types/app'
import { MeemAPI } from '../types/meem.generated'

export default class TwitterController {
	public static async auth(
		req: IAuthenticatedRequest<MeemAPI.v1.AuthenticateWithTwitter.IDefinition>,
		res: IResponse<MeemAPI.v1.AuthenticateWithTwitter.IResponseBody>
	): Promise<any> {
		const agreementId = req.query.agreementId as string
		const jwt = req.query.jwt as string
		const returnUrl = req.query.returnUrl as string

		if (!agreementId) {
			throw new Error('MISSING_PARAMETERS')
		}

		const agreement = await orm.models.Agreement.findOne({
			where: {
				id: agreementId
			}
		})

		if (!agreement) {
			throw new Error('AGREEMENT_NOT_FOUND')
		}

		const isAdmin = await agreement.isAdmin(req.wallet.address)

		if (!isAdmin) {
			throw new Error('NOT_AUTHORIZED')
		}

		const authClient = new auth.OAuth2User({
			client_id: config.TWITTER_OAUTH_CLIENT_ID,
			client_secret: config.TWITTER_OAUTH_CLIENT_SECRET,
			callback: config.TWITTER_OAUTH_CALLBACK_URL,
			scopes: config.TWITTER_AUTH_SCOPES as OAuth2Scopes[]
		})

		const state = crypto.randomUUID()
		const challenge = crypto.randomUUID()

		const authUrl = authClient.generateAuthURL({
			code_challenge_method: 'plain',
			code_challenge: challenge,
			state
		})

		res.cookie('state', state, {
			httpOnly: true
		})

		res.cookie('challenge', challenge, {
			httpOnly: true
		})

		res.cookie('agreementId', agreementId, {
			httpOnly: true
		})

		res.cookie('meemJwt', jwt, {
			httpOnly: true
		})

		res.cookie('returnUrl', returnUrl, {
			httpOnly: true
		})

		services.analytics.track([
			{
				name: Events.TwitterAuthStarted,
				agreementId,
				params: {}
			}
		])

		res.redirect(authUrl)
	}

	public static async callback(
		req: IAuthenticatedRequest,
		res: Response
	): Promise<any> {
		const authClient = new auth.OAuth2User({
			client_id: config.TWITTER_OAUTH_CLIENT_ID,
			client_secret: config.TWITTER_OAUTH_CLIENT_SECRET,
			callback: config.TWITTER_OAUTH_CALLBACK_URL,
			scopes: config.TWITTER_AUTH_SCOPES as OAuth2Scopes[]
		})
		log.debug(
			{ cookies: req.cookies, signedCookies: req.signedCookies },
			{
				client_id: config.TWITTER_OAUTH_CLIENT_ID,
				client_secret: config.TWITTER_OAUTH_CLIENT_SECRET,
				callback: config.TWITTER_OAUTH_CALLBACK_URL,
				scopes: config.TWITTER_AUTH_SCOPES as OAuth2Scopes[]
			}
		)

		const { agreementId, state, challenge } = req.cookies

		authClient.generateAuthURL({
			code_challenge_method: 'plain',
			code_challenge: challenge,
			state
		})
		const accessToken = await authClient.requestAccessToken(
			req.query.code as string
		)

		const agreement = await orm.models.Agreement.findOne({
			where: {
				id: agreementId
			}
		})

		if (!agreement) {
			throw new Error('AGREEMENT_NOT_FOUND')
		}

		const isAdmin = await agreement.isAdmin(req.wallet.address)

		if (!isAdmin) {
			throw new Error('NOT_AUTHORIZED')
		}

		// Save the access token for the agreement
		const encryptedData = await services.data.encrypt({
			data: accessToken.token,
			key: config.ENCRYPTION_KEY
		})

		const client = new Client(authClient)
		const user = await client.users.findMyUser()

		log.debug({ path: `${agreementId}/services/twitter` })

		let twitter = await orm.models.Twitter.findOne({
			where: {
				twitterId: user.data?.id
			}
		})

		if (!twitter) {
			twitter = orm.models.Twitter.build()
		}
		twitter.username = user.data?.username
		twitter.encryptedAccessToken = encryptedData
		twitter.twitterId = user.data?.id ?? ''
		await twitter.save()

		let agreementTwiter = await orm.models.AgreementTwitter.findOne({
			where: {
				agreementId,
				TwitterId: twitter.id
			}
		})

		if (!agreementTwiter) {
			agreementTwiter = await orm.models.AgreementTwitter.create({
				agreementId,
				TwitterId: twitter.id
			})
		}

		services.analytics.track([
			{
				name: Events.TwitterAuthCompleted,
				agreementId,
				params: {
					twitterId: twitter.twitterId,
					agreementTwitterId: agreementTwiter.id
				}
			}
		])

		log.debug({ accessToken })

		res.clearCookie('state')
		res.clearCookie('challenge')
		res.clearCookie('agreementId')
		res.clearCookie('meemJwt')
		res.clearCookie('returnUrl')
		res.redirect(req.cookies.returnUrl)
	}

	public static async disconnect(
		req: IAuthenticatedRequest<MeemAPI.v1.DisconnectTwitter.IDefinition>,
		res: IResponse<MeemAPI.v1.DisconnectTwitter.IResponseBody>
	): Promise<any> {
		const { agreementTwitterId } = req.body

		if (!agreementTwitterId) {
			throw new Error('MISSING_PARAMETERS')
		}

		const agreementTwitter = await orm.models.AgreementTwitter.findOne({
			where: {
				id: agreementTwitterId
			},
			include: [orm.models.Agreement]
		})

		if (!agreementTwitter || !agreementTwitter.Agreement) {
			throw new Error('TWITTER_NOT_FOUND')
		}

		const isAdmin = await agreementTwitter.Agreement.isAdmin(req.wallet.address)

		if (!isAdmin) {
			throw new Error('NOT_AUTHORIZED')
		}

		services.analytics.track([
			{
				name: Events.TwitterDisconnected,
				agreementId: agreementTwitter.agreementId,
				params: {
					agreementTwitterId: agreementTwitter.id
				}
			}
		])

		await agreementTwitter.destroy()

		return res.json({
			status: 'success'
		})
	}
}
