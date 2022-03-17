import _ from 'lodash'
import moment from 'moment'
import { Op } from 'sequelize'
import { TweetV2, TwitterApi } from 'twitter-api-v2'
import { MeemAPI } from '../types/meem.generated'

const prompts = [
	{
		body: `What is the username you use online when you don't want to be found?`,
		startAt: moment()
			.tz('America/Los_Angeles')
			.startOf('day')
			.add(6, 'hours')
			.toDate()
	},
	{
		body: `What are you glad wasn’t around when you were growing up?`,
		startAt: moment()
			.tz('America/Los_Angeles')
			.startOf('day')
			.add(7, 'hours')
			.toDate()
	},
	{
		body: `What do you wish people talked about more?`,
		startAt: moment()
			.tz('America/Los_Angeles')
			.startOf('day')
			.add(8, 'hours')
			.toDate()
	}
]

export default class PromptsService {
	public static async seedPrompts() {
		await orm.models.Prompt.sync({ force: true })
		const failedPrompts: any[] = []
		for (let i = 0; i < prompts.length; i += 1) {
			try {
				log.debug(`Syncing ${i + 1} / ${prompts.length} prompts`)
				// eslint-disable-next-line no-await-in-loop
				await orm.models.Prompt.create(prompts[i])
			} catch (e) {
				failedPrompts.push(prompts[i])
				log.crit(e)
				log.debug(prompts[i])
			}
		}
	}

	public static async sendNextPrompt() {
		if (!config.ENABLE_SEND_PROMPTS) {
			return
		}

		const tweetClient = new TwitterApi({
			appKey: config.TWITTER_MEEM_ACCOUNT_CONSUMER_KEY,
			appSecret: config.TWITTER_MEEM_ACCOUNT_CONSUMER_SECRET,
			accessToken: config.TWITTER_MEEM_ACCOUNT_TOKEN,
			accessSecret: config.TWITTER_MEEM_ACCOUNT_SECRET
		})

		const nextPrompt = await orm.models.Prompt.findOne({
			order: [['startAt', 'ASC']],
			where: {
				hasStarted: false,
				startAt: {
					[Op.lte]: moment().tz('America/Los_Angeles').toDate()
				}
			}
		})
		if (nextPrompt) {
			log.debug(`NEXT PROMPT`, nextPrompt?.body)

			try {
				const meemAction =
					config.NETWORK === MeemAPI.NetworkName.Rinkeby ? '>meemdev' : '>meem'
				const promptTweet = await tweetClient.v2.tweet(
					`${nextPrompt.body} #0xMeemPrompt ${meemAction}`
				)
				nextPrompt.hasStarted = true
				nextPrompt.tweetId = promptTweet.data.id
				await nextPrompt.save()
			} catch (e) {
				log.error(e)
			}
		}
	}

	public static async mintResponseTweet(tweet: TweetV2) {
		log.debug(`Minting tweet: ${tweet.text}`)

		// Check if user is a meember
		// Only mint if this is the first reply to this tweet from this user
		// If not a meember, let them know they can join/claim their meem
	}

	public static async endCurrentPrompt() {
		// END: Prompt Tweet Logic

		// 1. Get the latests prompt tweet
		// - TODO: Decipher which tweets are prompt tweets vs. other 0xMeem tweets?

		// 2. Search for replies to tweet and mint them on behalf of user.
		// - TODO: Can any user reply/mint response or do they have to be a Meember?

		// 3. Search for likes on answers at X hour and quote tweet to mint the winner
		// - TODO: Instead of quote tweet, should we mint a special Meem for the winner?
		// - TODO: Tie breaker?

		const client = new TwitterApi(config.TWITTER_BEARER_TOKEN)

		// const endTime = moment().tz('America/Los_Angeles').startOf('day')

		try {
			const promptTweetResponse = await client.v2.search(
				`from:${config.TWITTER_MEEM_ACCOUNT_ID} #0xMeemPrompt -is:retweet -is:reply`,
				{
					max_results: 10,
					'tweet.fields': ['created_at', 'public_metrics', 'conversation_id'],
					expansions: ['author_id']
				}
			)

			const tweets = promptTweetResponse.data.data

			if (tweets.length < 1) {
				return
			}

			const promptTweet = tweets[0]

			const tweetExists = await orm.models.Tweet.findOne({
				where: {
					tweetId: promptTweet.id
				}
			})

			if (!tweetExists) {
				// TODO: This should never happen!
				return
			}

			// TODO: Loop through paginated results of replies
			const responseTweets = await client.v2.search(
				`conversation_id:${promptTweet.conversation_id} -from:${config.TWITTER_MEEM_ACCOUNT_ID} is:reply`,
				{
					'tweet.fields': ['created_at', 'public_metrics'],
					expansions: ['author_id']
				}
			)

			if (!responseTweets.data?.data || responseTweets.data?.data.length < 1) {
				return
			}

			const sortedResponses = _.orderBy(
				responseTweets.data.data,
				t => {
					return t.public_metrics?.like_count || 0
				},
				'desc'
			)

			// TODO: Sort by earliest reply in case of a tie

			const winner = sortedResponses[0]
			const winningUser = responseTweets.includes?.users?.find(
				u => u.id === winner.author_id
			)

			if (!winningUser) {
				return
			}

			log.debug(`${winner.text} - ${winner.public_metrics?.like_count} Likes`)

			const tweetClient = new TwitterApi({
				appKey: config.TWITTER_MEEM_ACCOUNT_CONSUMER_KEY,
				appSecret: config.TWITTER_MEEM_ACCOUNT_CONSUMER_SECRET,
				accessToken: config.TWITTER_MEEM_ACCOUNT_TOKEN,
				accessSecret: config.TWITTER_MEEM_ACCOUNT_SECRET
			})

			try {
				// TODO: This doesn't work since quoted tweet is not an original tweet. How should we handle this?
				const meemAction =
					config.NETWORK === MeemAPI.NetworkName.Rinkeby ? '>meemdev' : '>meem'
				await tweetClient.v2.tweet(
					`Winner winner chicken dinner! @${winningUser.username}, your response to today's #0xMeemPrompt received the most likes. ${meemAction}`,
					{
						quote_tweet_id: winner.id
					}
				)
			} catch (e) {
				log.error(e)
			}

			return
		} catch (e) {
			log.crit(e)
		}
	}
}
