// import { Octokit } from '@octokit/rest'
// import request from 'superagent'
// import { MeemAPI } from '../types/meem.generated'

import { TweetV2, TwitterApi } from 'twitter-api-v2'
import DbService from './Db'

export default class TwitterService {
	public static async getMeemTweets(): Promise<{
		tweets: TweetV2[]
		meta: any
	}> {
		const client = new TwitterApi(config.TWITTER_BEARER_TOKEN)

		const tweetCheckpoint = await DbService.getTweetsCheckpoint({
			accountId: config.TWITTER_MEEM_ACCOUNT_ID
		})

		try {
			const twitterResponse = await client.v2.userMentionTimeline(
				config.TWITTER_MEEM_ACCOUNT_ID,
				{
					max_results: 5,
					since_id: tweetCheckpoint
						? tweetCheckpoint?.sinceId.S
						: config.TWITTER_OLDEST_TWEET_ID,
					'tweet.fields': ['created_at'],
					pagination_token:
						tweetCheckpoint?.nextToken.S !== ''
							? tweetCheckpoint?.nextToken.S
							: undefined
				}
			)

			// If tweet checkpoint does not contain a next token but the response does, save newestId
			// If tweets response does not contain a next token, change sinceId to newestId and remove next token on checkpoint

			const tweets = twitterResponse.data.data || []
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
					: tweetCheckpoint.sinceId.S || config.TWITTER_OLDEST_TWEET_ID

				DbService.saveTweetsCheckpoint({
					accountId: config.TWITTER_MEEM_ACCOUNT_ID,
					sinceId,
					newestId,
					nextToken: nextToken || ''
				})
			} else {
				DbService.saveTweetsCheckpoint({
					accountId: config.TWITTER_MEEM_ACCOUNT_ID,
					sinceId: config.TWITTER_OLDEST_TWEET_ID,
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
