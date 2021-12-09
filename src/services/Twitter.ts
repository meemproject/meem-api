// import { Octokit } from '@octokit/rest'
// import request from 'superagent'
// import { MeemAPI } from '../types/meem.generated'

import {
	ETwitterStreamEvent,
	TweetStream,
	TwitterApi,
	TweetV2,
	TweetV2SingleStreamResult,
	UserV2
} from 'twitter-api-v2'
import Tweet from '../models/Tweet'
import DbService from './Db'

export default class TwitterService {
	public static async getMeemMentionTweets(): Promise<{
		tweets: TweetV2[]
		meta: any
	}> {
		const client = new TwitterApi(config.TWITTER_BEARER_TOKEN)

		const tweetCheckpoint = await DbService.getTweetsCheckpoint({
			type: 'mention_meem'
		})

		try {
			// TODO: Swap out TWITTER_MEEM_ACCOUNT_ID for actual TWITTER_MEEM_ACCOUNT_ID and delete meem_mention checkpoint ind DB
			const twitterResponse = await client.v2.userMentionTimeline(
				config.TWITTER_MEEM_ACCOUNT_ID,
				{
					max_results: 10,
					since_id: tweetCheckpoint ? tweetCheckpoint?.sinceId.S : undefined,
					'tweet.fields': ['created_at'],
					pagination_token:
						tweetCheckpoint?.nextToken.S !== ''
							? tweetCheckpoint?.nextToken.S
							: undefined
				}
			)

			const tweets = twitterResponse.data.data || []

			// TODO: Look for tweets with specific string to trigger minting

			// If tweet checkpoint does not contain a next token but the response does, save newestId
			// If tweets response does not contain a next token, change sinceId to newestId and remove next token on checkpoint

			const nextToken = twitterResponse.data.meta.next_token
			const shouldUpdateNewestId =
				!tweetCheckpoint ||
				(!!nextToken && tweetCheckpoint.nextToken.S === '') ||
				(!nextToken &&
					tweetCheckpoint?.newestId.S === tweetCheckpoint?.sinceId.S)

			if (tweetCheckpoint) {
				const newestId = shouldUpdateNewestId
					? twitterResponse.data.meta.newest_id ||
					  tweetCheckpoint?.newestId.S ||
					  ''
					: tweetCheckpoint?.newestId.S || ''
				const sinceId = !nextToken
					? newestId || tweetCheckpoint.sinceId.S || ''
					: tweetCheckpoint.sinceId.S || ''

				DbService.saveTweetsCheckpoint({
					type: 'mention_meem',
					sinceId,
					newestId,
					nextToken: nextToken || ''
				})
			} else {
				DbService.saveTweetsCheckpoint({
					type: 'mention_meem',
					sinceId: twitterResponse.data.meta.newest_id,
					newestId: twitterResponse.data.meta.newest_id,
					nextToken: nextToken || ''
				})
			}

			return {
				tweets,
				meta: twitterResponse.data.meta
			}
		} catch (e) {
			log.warn(e)
			return {
				tweets: [],
				meta: {}
			}
		}
	}

	public static async getMeemActionTweets(): Promise<{
		tweets: TweetV2[]
		meta: any
	}> {
		const client = new TwitterApi(config.TWITTER_BEARER_TOKEN)

		const tweetCheckpoint = await DbService.getTweetsCheckpoint({
			type: 'action_meem'
		})

		try {
			// TODO: Swap out TWITTER_MEEM_ACTION for actual TWITTER_MEEM_ACTION and delete action_meem checkpoint ind DB
			const twitterResponse = await client.v2.search(
				`#${config.TWITTER_MEEM_ACTION}`,
				{
					max_results: 10,
					since_id: tweetCheckpoint ? tweetCheckpoint?.sinceId.S : undefined,
					'tweet.fields': ['created_at'],
					next_token:
						tweetCheckpoint?.nextToken.S !== ''
							? tweetCheckpoint?.nextToken.S
							: undefined
				}
			)

			const tweets = twitterResponse.data.data || []

			// TODO: mint tweets

			const nextToken = twitterResponse.data.meta.next_token
			const shouldUpdateNewestId =
				!tweetCheckpoint ||
				(!!nextToken && tweetCheckpoint.nextToken.S === '') ||
				(!nextToken &&
					tweetCheckpoint?.newestId.S === tweetCheckpoint?.sinceId.S)

			if (tweetCheckpoint) {
				const newestId = shouldUpdateNewestId
					? twitterResponse.data.meta.newest_id ||
					  tweetCheckpoint?.newestId.S ||
					  ''
					: tweetCheckpoint?.newestId.S || ''
				const sinceId = !nextToken
					? newestId || tweetCheckpoint.sinceId.S || ''
					: tweetCheckpoint.sinceId.S || ''

				DbService.saveTweetsCheckpoint({
					type: 'action_meem',
					sinceId,
					newestId,
					nextToken: nextToken || ''
				})
			} else {
				DbService.saveTweetsCheckpoint({
					type: 'action_meem',
					sinceId: twitterResponse.data.meta.newest_id,
					newestId: twitterResponse.data.meta.newest_id,
					nextToken: nextToken || ''
				})
			}

			return {
				tweets,
				meta: twitterResponse.data.meta
			}
		} catch (e) {
			log.warn(e)
			return {
				tweets: [],
				meta: {}
			}
		}
	}

	public static async connectToTwitterStream(): Promise<TweetStream> {
		const client = new TwitterApi(config.TWITTER_BEARER_TOKEN)
		try {
			const stream = await client.v2.searchStream({
				'tweet.fields': ['created_at', 'entities'],
				'user.fields': ['profile_image_url'],
				expansions: ['author_id']
			})

			log.trace('Tweet stream connected!')

			// Awaits for a tweet
			stream.on(
				// Emitted when Node.js {response} emits a 'error' event (contains its payload).
				ETwitterStreamEvent.ConnectionError,
				err => log.debug('Tweet stream connection error!', err)
			)

			stream.on(
				// Emitted when Node.js {response} is closed by remote or using .close().
				ETwitterStreamEvent.ConnectionClosed,
				() => log.debug('Tweet stream connection has been closed.')
			)

			stream.on(
				// Emitted when a Twitter payload (a tweet or not, given the endpoint).
				ETwitterStreamEvent.Data,
				async eventData => {
					// await firebase.db
					// 	.collection('tweets')
					// 	.doc(eventData.data.id)
					// 	.set({
					// 		...eventData.data,
					// 		includes: eventData.includes,
					// 		matching_rules: eventData.matching_rules
					// 	})
					TwitterService.handleTweet(eventData)
				}
			)

			stream.on(
				// Emitted when a Twitter sent a signal to maintain connection active
				ETwitterStreamEvent.DataKeepAlive,
				() => log.trace('Tweet stream sent a keep-alive packet.')
			)

			// Enable reconnect feature
			stream.autoReconnect = true

			return stream
		} catch (e) {
			log.error(e)
			throw new Error('Error connecting to Twitter stream')
		}
	}

	private static async handleTweet(
		event: TweetV2SingleStreamResult
	): Promise<void> {
		// TODO: check whitelist for twitter user ID
		// TODO: if user is whitelisted, store tweet data in db
		// TODO: mint tweet meem
		// TODO: in meem webhook, update tweet in db with meem token id

		const hashtags = event.data.entities?.hashtags || []
		const meemActions = new RegExp('\\\\meem', 'gi')

		let sanitizedText = event.data.text.replace(meemActions, '')

		sanitizedText = sanitizedText.replace(/\s\s+/g, ' ')

		const user = event.includes?.users?.find(u => u.id === event.data.author_id)
		const tweet = await orm.models.Tweet.create({
			tweetId: event.data.id,
			text: event.data.text,
			sanitizedText: sanitizedText.trim(),
			username: user?.username || '',
			userProfileImageUrl: user?.profile_image_url || ''
		})

		await Promise.all(
			hashtags.map(async hashtag => {
				let existingTag = await orm.models.Hashtag.findOne({
					where: {
						tag: hashtag.tag
					}
				})

				if (!existingTag) {
					existingTag = await orm.models.Hashtag.create({
						tag: hashtag.tag
					})
				}

				return orm.models.TweetHashtag.create({
					HashtagId: existingTag.id,
					TweetId: tweet.id
				})
			})
		)

		// log.debug(event)
		// log.debug(tweet)
	}
}
