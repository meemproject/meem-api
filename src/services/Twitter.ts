// import { Octokit } from '@octokit/rest'
// import request from 'superagent'
// import { MeemAPI } from '../types/meem.generated'

import { TweetV2, TwitterApi } from 'twitter-api-v2'
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
}
