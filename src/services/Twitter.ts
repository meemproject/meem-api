// import { Octokit } from '@octokit/rest'
// import request from 'superagent'
// import { MeemAPI } from '../types/meem.generated'

import { TwitterApi } from 'twitter-api-v2'
import DbService from './Db'

export default class TwitterService {
	public static async getMeemTweets(): Promise<any[]> {
		const client = new TwitterApi(config.TWITTER_BEARER_TOKEN)

		const tweetCheckpoint = await DbService.getTweetsCheckpoint({
			accountId: config.TWITTER_MEEM_ACCOUNT_ID
		})

		log.debug(tweetCheckpoint?.sinceId.S)

		try {
			const twitterResponse = await client.v2.userMentionTimeline(
				config.TWITTER_MEEM_ACCOUNT_ID,
				{
					max_results: 10,
					since_id: '721009365688291328',
					'tweet.fields': ['created_at']
				}
			)
			const tweets = twitterResponse.data.data || []

			if (tweets.length > 0) {
				const lastTweetId = tweets[0].id
				DbService.saveTweetsCheckpoint({
					accountId: config.TWITTER_MEEM_ACCOUNT_ID,
					lastTweetId
				})
			}

			return tweets
		} catch (e) {
			log.warn(e)
			return []
		}
	}
}
