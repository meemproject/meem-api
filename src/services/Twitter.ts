import _ from 'lodash'
import { TwitterApi, UserV2 } from 'twitter-api-v2'
import { v4 as uuidv4 } from 'uuid'
import Hashtag from '../models/Hashtag'
import MeemContract from '../models/MeemContract'
import Tweet from '../models/Tweet'
import Twitter from '../models/Twitter'

export default class TwitterService {
	public static async getUser(options: {
		accessToken: string
		accessSecret: string
	}) {
		if (config.TESTING) {
			return services.testing.getTwitterUserV1()
		}
		const { accessToken, accessSecret } = options
		const api = new TwitterApi({
			appKey: config.TWITTER_CONSUMER_KEY,
			appSecret: config.TWITTER_CONSUMER_SECRET,
			accessToken,
			accessSecret
		})
		const user = await api.currentUser()
		return user
	}

	public static async getTweets(): Promise<Tweet[]> {
		const tweets = await orm.models.Tweet.findAll({
			include: {
				model: Hashtag,
				attributes: ['id', 'tag'],
				through: {
					attributes: []
				}
			},
			limit: 100,
			order: [['createdAt', 'DESC']]
		})

		return tweets
	}

	public static async verifyMeemContractTwitter(data: {
		twitterUsername: string
		meemContract: MeemContract
	}): Promise<UserV2> {
		const client = new TwitterApi(config.TWITTER_BEARER_TOKEN)

		const twitterUserResult = await client.v2.userByUsername(
			data.twitterUsername,
			{
				'user.fields': ['id', 'username', 'name', 'profile_image_url']
			}
		)

		if (!twitterUserResult) {
			log.crit('No Twitter user found for username')
			throw new Error('SERVER_ERROR')
		}

		const usersLatestTweets = await client.v2.userTimeline(
			twitterUserResult.data.id,
			{
				'tweet.fields': ['created_at', 'entities']
			}
		)

		const clubsTweet = usersLatestTweets.data.data.find(tweet => {
			let isClubsTweet = false

			const clubUrl = tweet.entities?.urls?.find(url => {
				return /clubs\.link/.test(url.expanded_url)
			})

			if (clubUrl) {
				const clubSlug = _.last(clubUrl.expanded_url.split('/'))
				isClubsTweet = clubSlug?.toLowerCase() === data.meemContract.slug
			}

			return isClubsTweet
		})

		if (!clubsTweet) {
			log.crit('Unable to find verification tweet')
			throw new Error('SERVER_ERROR')
		}

		let twitter: Twitter | undefined
		const existingTwitter = await orm.models.Twitter.findOne({
			where: {
				twitterId: twitterUserResult.data.id
			}
		})

		if (!existingTwitter) {
			twitter = await orm.models.Twitter.create({
				id: uuidv4(),
				twitterId: twitterUserResult.data.id
			})
		} else {
			twitter = existingTwitter
		}

		if (!twitter) {
			log.crit('Twitter not found or created')
			throw new Error('SERVER_ERROR')
		}

		return twitterUserResult.data
	}

	private static decodeEntities(encodedString: string) {
		const symbols = /&(nbsp|amp|quot|lt|gt);/g
		const translate: { [key: string]: string } = {
			nbsp: ' ',
			amp: '&',
			quot: '"',
			lt: '<',
			gt: '>'
		}
		return encodedString
			.replace(symbols, (match, entity) => {
				return translate[entity]
			})
			.replace(/&#(\d+);/gi, (match, numStr) => {
				const num = parseInt(numStr, 10)
				return String.fromCharCode(num)
			})
	}
}
