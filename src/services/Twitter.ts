import { auth, Client } from 'twitter-api-sdk'
import { OAuth2Scopes } from 'twitter-api-sdk/dist/OAuth2User'

export interface ICreateTweetResult {
	username?: string
	data?:
		| {
				id: string
				text: string
		  }
		| undefined
	errors?:
		| {
				detail?: string | undefined
				status?: number | undefined
				title: string
				type: string
		  }[]
		| undefined
}

export default class Twitter {
	public static async sendTweet(options: {
		agreementTwitterId: string
		body: string
	}) {
		log.debug('Send Tweet', { options })
		const { agreementTwitterId, body } = options

		const agreementTwitter = await orm.models.AgreementTwitter.findOne({
			where: {
				id: agreementTwitterId
			},
			include: [orm.models.Twitter]
		})

		const twitter = agreementTwitter?.Twitter

		if (!twitter) {
			throw new Error('TWITTER_NOT_FOUND')
		}

		const decrypted = await services.data.decrypt({
			strToDecrypt: twitter.encryptedAccessToken,
			privateKey: config.ENCRYPTION_KEY
		})

		const authClient = new auth.OAuth2User({
			client_id: config.TWITTER_OAUTH_CLIENT_ID,
			client_secret: config.TWITTER_OAUTH_CLIENT_SECRET,
			callback: config.TWITTER_OAUTH_CALLBACK_URL,
			scopes: config.TWITTER_AUTH_SCOPES as OAuth2Scopes[],
			token: decrypted.data
		})

		const client: Client = new Client(authClient)

		const isAccessTokenExpired = authClient.isAccessTokenExpired()

		log.debug({ isAccessTokenExpired, token: decrypted.data })

		try {
			if (isAccessTokenExpired) {
				const { token } = await authClient.refreshAccessToken()
				log.debug('Refreshed Twitter token', { token })
				authClient.token = token

				const encryptedData = await services.data.encrypt({
					data: token,
					key: config.ENCRYPTION_KEY
				})

				const user = await client.users.findMyUser()

				// Save new auth token
				twitter.encryptedAccessToken = encryptedData
				twitter.username = user.data?.username
				await twitter.save()
			}

			// TODO: Split tweet into tweet thread if it's more than 280 characters
			const createTweetResult = await client.tweets.createTweet({
				text: body.substring(0, 279)
			})

			log.debug(createTweetResult)

			return { ...createTweetResult, username: twitter.username }
		} catch (e) {
			// eslint-disable-next-line no-console
			console.log(e)
			// @ts-ignore
			if (e?.error?.error === 'invalid_request') {
				await Promise.all([
					orm.models.Twitter.destroy({
						where: {
							id: twitter.id
						}
					}),
					orm.models.AgreementTwitter.destroy({
						where: {
							TwitterId: twitter.id
						}
					})
				])
			}
			throw e
		}
	}
}
