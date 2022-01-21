import { ETwitterStreamEvent, TwitterApi } from 'twitter-api-v2'

export default class TwitterListener {
	public async start() {
		this.setupListners()
			.then(() => {})
			.catch(e => {
				log.crit(e)
			})
	}

	private async setupListners() {
		const client = new TwitterApi(config.TWITTER_BEARER_TOKEN)
		try {
			await services.twitter.checkForMissedTweets()
			const stream = await client.v2.searchStream({
				'tweet.fields': ['created_at', 'entities'],
				'user.fields': ['profile_image_url'],
				expansions: ['author_id', 'in_reply_to_user_id', 'referenced_tweets.id']
			})

			// Awaits for a tweet
			stream.on(
				// Emitted when Node.js {response} emits a 'error' event (contains its payload).
				ETwitterStreamEvent.ConnectionError,
				err => log.crit('Tweet stream connection error!', err)
			)

			stream.on(
				// Emitted when Node.js {response} is closed by remote or using .close().
				ETwitterStreamEvent.ConnectionClosed,
				() => log.crit('Tweet stream connection has been closed.')
			)

			stream.on(
				// Emitted when a Twitter payload (a tweet or not, given the endpoint).
				ETwitterStreamEvent.Data,
				async eventData => {
					services.twitter.mintAndStoreTweet(eventData.data, eventData.includes)
				}
			)

			stream.on(
				// Emitted when a Twitter sent a signal to maintain connection active
				ETwitterStreamEvent.DataKeepAlive,
				() => log.trace('Tweet stream sent a keep-alive packet.')
			)

			// Enable reconnect feature
			stream.autoReconnect = true

			log.info('Twitter listeners set up')
		} catch (e) {
			log.crit('Error connecting to Twitter stream', e)
			throw new Error('Error connecting to Twitter stream')
		}
	}
}
