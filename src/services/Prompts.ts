import _ from 'lodash'
import moment from 'moment-timezone'
import { Op } from 'sequelize'
import { ApiV2Includes, TweetV2, TwitterApi, UserV2 } from 'twitter-api-v2'
import Prompt from '../models/Prompt'
import { MeemAPI } from '../types/meem.generated'

const promptsText = [
	`What's the best part of getting older?`,
	`What are you glad wasn’t around when you were growing up?`,
	`What do you wish people talked about more?`,
	`You're suddenly invisible. Where do you go?`,
	`What’s your most treasured possession that anyone could buy for $25 or less?`
]

export default class PromptsService {
	public static async seedPrompts() {
		const prompts = promptsText.map((p, i) => {
			return {
				body: p,
				startAt: moment()
					.tz('America/Los_Angeles')
					.startOf('day')
					.add(i, 'days')
					.add(7, 'hours')
					.toDate()
			}
		})
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
		if (!config.ENABLE_PROMPTS) {
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

	public static async mintPromptReplyTweet(options: {
		tweetUser: UserV2
		tweetUserMeemId: MeemAPI.IMeemId | null
		prompt: Prompt
		meemTweetRepliedToId: string
		promptResponseTweetData: TweetV2
		promptResponseTweetIncludes: ApiV2Includes | undefined
	}) {
		const {
			tweetUser,
			tweetUserMeemId,
			prompt,
			meemTweetRepliedToId,
			promptResponseTweetData,
			promptResponseTweetIncludes
		} = options

		log.debug(
			`Meember (${!!tweetUserMeemId}) replied to prompt: (${prompt.id})`
		)

		const promptTweet = await orm.models.Tweet.findOne({
			where: {
				tweetId: meemTweetRepliedToId
			},
			include: [
				{
					model: orm.models.Meem
				}
			]
		})

		const promptTweetMeemTokenId = promptTweet?.Meem?.tokenId

		if (
			promptResponseTweetData.conversation_id &&
			promptTweetMeemTokenId &&
			tweetUser.id !== config.TWITTER_MEEM_ACCOUNT_ID
		) {
			// Make sure this user has not minted a reply to this prompt already
			const conversationTweet = await orm.models.Tweet.findOne({
				where: {
					userId: tweetUser.id,
					conversationId: promptResponseTweetData.conversation_id
				}
			})

			if (conversationTweet) {
				await services.twitter.tweet(
					`@${tweetUser.username} It looks like you've already submitted a response to this prompt. We look forward to your response tomorrow!`,
					{
						reply: {
							in_reply_to_tweet_id: promptResponseTweetData.id
						}
					}
				)
				return
			}

			// Mint the tweet
			log.debug(`Mint reply tweet to prompt meem ${promptTweetMeemTokenId}`)

			await services.twitter.mintTweet({
				meemId: tweetUserMeemId || undefined,
				tweetData: promptResponseTweetData,
				tweetIncludes: promptResponseTweetIncludes,
				twitterUser: tweetUser,
				parentMeemTokenId: promptTweetMeemTokenId,
				prompt
			})
		}
	}

	public static async endCurrentPrompt() {
		if (!config.ENABLE_PROMPTS) {
			return
		}
		// END: Prompt Tweet Logic

		// 3. Search for likes on answers at X hour and quote tweet to mint the winner
		// - TODO: Instead of quote tweet, should we mint a special Meem for the winner?
		// - TODO: Tie breaker?

		const promptToEnd = await orm.models.Prompt.findOne({
			order: [['startAt', 'ASC']],
			where: {
				hasStarted: true,
				hasEnded: false,
				startAt: {
					[Op.lte]: moment()
						.tz('America/Los_Angeles')
						.subtract(12, 'hours')
						.toDate()
				}
			}
		})

		if (!promptToEnd) {
			return
		}

		// Get all tweets with same conversation ID
		// Get the tweet data from twitter API
		// Sort by votes
		// Retweet the winner

		log.debug(`Ending prompt: ${promptToEnd.id}`)

		const client = new TwitterApi(config.TWITTER_BEARER_TOKEN)

		// const endTime = moment().tz('America/Los_Angeles').startOf('day')

		const getTweets = async (tweetIds: string[]) => {
			const promptTweetResponse = await client.v2.tweets(tweetIds, {
				'tweet.fields': ['created_at', 'public_metrics', 'conversation_id'],
				expansions: ['author_id']
			})
			return promptTweetResponse
		}

		try {
			const promptReplyTweets = await orm.models.Tweet.findAll({
				where: {
					userId: {
						[Op.not]: config.TWITTER_MEEM_ACCOUNT_ID
					},
					conversationId: promptToEnd.tweetId
				}
			})

			const promptReplyTweetGroups = _.chunk(promptReplyTweets)
			const promptReplyUsers: UserV2[] = []

			const promptReplyTweetGroupsData = await Promise.all(
				promptReplyTweetGroups.map(async g => {
					const tweetIds = g.map(t => t.tweetId)
					const tweetResponse = await getTweets(tweetIds)

					if (tweetResponse.includes?.users) {
						promptReplyUsers.push(...tweetResponse.includes.users)
					}

					return tweetResponse.data
				})
			)

			const promptReplyTweetsData = _.flatten(promptReplyTweetGroupsData)

			if (promptReplyTweetsData.length < 1) {
				return
			}

			const sortedResponses = _.orderBy(
				promptReplyTweetsData,
				t => {
					return t.public_metrics?.like_count || 0
				},
				'desc'
			)

			const winner = sortedResponses[0]
			const winningUser = promptReplyUsers.find(u => u.id === winner.author_id)

			if (winningUser) {
				const tweetClient = new TwitterApi({
					appKey: config.TWITTER_MEEM_ACCOUNT_CONSUMER_KEY,
					appSecret: config.TWITTER_MEEM_ACCOUNT_CONSUMER_SECRET,
					accessToken: config.TWITTER_MEEM_ACCOUNT_TOKEN,
					accessSecret: config.TWITTER_MEEM_ACCOUNT_SECRET
				})

				try {
					await tweetClient.v2.tweet(
						`Winner winner vegan-friendly chicken substitute dinner! @${winningUser.username} received the most likes in today's #0xMeemPrompt.`,
						{
							quote_tweet_id: winner.id
						}
					)
				} catch (e) {
					log.error(e)
				}
			}

			promptToEnd.hasEnded = true

			await promptToEnd.save()

			return
		} catch (e) {
			log.crit(e)
		}
	}
}
