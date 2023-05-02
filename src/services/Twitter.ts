import { auth, Client } from 'twitter-api-sdk'
import { OAuth2Scopes } from 'twitter-api-sdk/dist/OAuth2User'
import { createTweet, TwitterBody } from 'twitter-api-sdk/dist/types'

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
			const chunks = this.splitIntoThreadedChunks(body)
			// const createTweetResult = await client.tweets.createTweet({
			// 	text: body.substring(0, 279)
			// })

			let firstTweetResult:
				| Awaited<ReturnType<typeof client.tweets.createTweet>>
				| undefined

			for (let i = 0; i < chunks.length; i++) {
				const chunk = chunks[i]
				const params: TwitterBody<createTweet> = {
					text: chunk
				}

				if (firstTweetResult?.data?.id) {
					params.reply = {
						in_reply_to_tweet_id: firstTweetResult.data.id
					}
				}

				const createTweetResult = await client.tweets.createTweet(params)

				if (i === 0) {
					firstTweetResult = createTweetResult
				}

				log.debug(createTweetResult)
			}

			log.debug(firstTweetResult)

			return { ...firstTweetResult, username: twitter.username }
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

	public static splitIntoThreadedChunks(str: string): string[] {
		const MAX_CHUNK_LENGTH = 275
		if (str.length <= MAX_CHUNK_LENGTH) {
			return [str]
		}

		const chunks: string[] = []
		let index = 0

		while (index < str.length) {
			let endIndex = index + MAX_CHUNK_LENGTH

			// Check if the next chunk would split a sentence
			const endOfSentence = /[.?!]/
			let splitIndex = -1
			for (let i = endIndex; i > index; i--) {
				if (endOfSentence.test(str.charAt(i))) {
					splitIndex = i
					break
				}
			}

			// If the next chunk would split a sentence, move the end index back to the end of the previous sentence
			if (splitIndex !== -1) {
				endIndex = splitIndex
			}

			// Construct the chunk string with the appropriate prefix and content
			const chunk = `${chunks.length + 1}/ ${str
				.substring(index, endIndex + 1)
				.trim()}`
			chunks.push(chunk)

			// Update the index to point to the next sentence after the current chunk
			index = endIndex + 1
		}

		return chunks
	}
}
