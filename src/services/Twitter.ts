// import type { ethers as Ethers } from 'ethers'
import _ from 'lodash'
// import { DateTime } from 'luxon'
// import { Op } from 'sequelize'
import {
	TwitterApi,
	// TweetV2,
	// ApiV2Includes,
	UserV2
	// SendTweetV2Params,
	// TweetV2PostTweetResult,
	// TweetV2SingleResult
} from 'twitter-api-v2'
import { v4 as uuidv4 } from 'uuid'
import Hashtag from '../models/Hashtag'
import MeemContract from '../models/MeemContract'
// import Prompt from '../models/Prompt'
import Tweet from '../models/Tweet'
import Twitter from '../models/Twitter'
// import { MeemAPI } from '../types/meem.generated'

// function errorcodeToErrorString(contractErrorName: string) {
// 	const allErrors: Record<string, any> = config.errors
// 	const errorKeys = Object.keys(allErrors)
// 	const errIdx = errorKeys.findIndex(
// 		k => allErrors[k].contractErrorCode === contractErrorName
// 	)
// 	if (errIdx > -1) {
// 		return errorKeys[errIdx]
// 	}
// 	return 'UNKNOWN_CONTRACT_ERROR'
// }
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

	// public static async checkForMissedTweets(): Promise<void> {
	// 	log.trace('Checking for missed tweets')
	// 	const latestTweet = await orm.models.Tweet.findOne({
	// 		order: [['createdAt', 'DESC']]
	// 	})

	// 	if (!latestTweet) {
	// 		return
	// 	}

	// 	const client = new TwitterApi(config.TWITTER_BEARER_TOKEN)

	// 	const endTime = DateTime.now()
	// 		.toUTC()
	// 		.minus({ minutes: 5 })
	// 		.toFormat('yyyy-MM-DDTHH:mm:ssZ')

	// 	try {
	// 		const twitterResponse = await client.v2.search(
	// 			`(meem OR meemtest) -is:retweet -is:reply`,
	// 			{
	// 				end_time: endTime,
	// 				max_results: 100,
	// 				'tweet.fields': [
	// 					'created_at',
	// 					'entities',
	// 					'attachments',
	// 					'conversation_id'
	// 				],
	// 				'user.fields': ['profile_image_url'],
	// 				'media.fields': [
	// 					'media_key',
	// 					'type',
	// 					'height',
	// 					'width',
	// 					'url',
	// 					'preview_image_url'
	// 				],
	// 				expansions: [
	// 					'author_id',
	// 					'in_reply_to_user_id',
	// 					'referenced_tweets.id',
	// 					'attachments.media_keys'
	// 				]
	// 			}
	// 		)

	// 		const tweets = (twitterResponse.data.data || []).filter(tweet => {
	// 			return /&gt;meem/gi.test(tweet.text)
	// 		})

	// 		await Promise.all(
	// 			tweets.map(async tweet => {
	// 				const tweetExists = await orm.models.Tweet.findOne({
	// 					where: {
	// 						tweetId: tweet.id
	// 					}
	// 				})
	// 				if (!tweetExists) {
	// 					return TwitterService.mintAndStoreTweet(
	// 						tweet,
	// 						twitterResponse.data.includes
	// 					)
	// 				}
	// 				return null
	// 			})
	// 		)

	// 		return
	// 	} catch (e) {
	// 		log.crit(e)
	// 	}
	// }

	// public static async getTwitterUserMeemId(
	// 	twitterUserId: string
	// ): Promise<MeemAPI.IMeemId | null> {
	// 	const item = await orm.models.Twitter.findOne({
	// 		where: {
	// 			twitterId: twitterUserId
	// 		}
	// 	})

	// 	if (!item || !item.MeemIdentificationId) {
	// 		log.error(`No meemId found for twitter ID: ${twitterUserId}`)
	// 		return null
	// 	}

	// 	const tweetUserMeemId = await services.meemId.getMeemId({
	// 		meemIdentificationId: item.MeemIdentificationId
	// 	})

	// 	if (tweetUserMeemId.wallets.length === 0) {
	// 		log.error(`No wallet found for meemId: ${item.MeemIdentificationId}`)
	// 		return null
	// 	}

	// 	return tweetUserMeemId
	// }

	public static async verifyMeemContractTwitter(args: {
		twitterUsername: string
		meemContract: MeemContract
	}): Promise<UserV2> {
		const client = new TwitterApi(config.TWITTER_BEARER_TOKEN)

		const twitterUserResult = await client.v2.userByUsername(
			args.twitterUsername,
			{
				'user.fields': ['id', 'username', 'name', 'profile_image_url']
			}
		)

		if (!twitterUserResult) {
			log.crit('No Twitter user found for username')
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
				twitterId: twitterUserResult.data.id,
				isDefault: true
			})
		} else {
			twitter = existingTwitter
		}

		if (!twitter) {
			log.crit('Twitter not found or created')
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
				isClubsTweet = clubSlug?.toLowerCase() === args.meemContract.slug
			}

			return isClubsTweet
		})

		if (!clubsTweet) {
			log.crit('Unable to find verification tweet')
			throw new Error('SERVER_ERROR')
		}

		return twitterUserResult.data
	}

	// public static async handleMeemReplyTweet(
	// 	tweetData: TweetV2,
	// 	includes?: ApiV2Includes
	// ): Promise<void> {
	// 	const tweetUser = includes?.users?.find(u => u.id === tweetData.author_id)
	// 	const meemTweetRepliedToId = tweetData.referenced_tweets?.find(
	// 		t => t.type === 'replied_to'
	// 	)?.id

	// 	if (!tweetUser?.id || !meemTweetRepliedToId) {
	// 		return
	// 	}

	// 	const meemTweetRepliedTo = await orm.models.Tweet.findOne({
	// 		where: {
	// 			tweetId: meemTweetRepliedToId
	// 		},
	// 		include: [
	// 			{
	// 				model: orm.models.Meem
	// 			}
	// 		]
	// 	})

	// 	if (!meemTweetRepliedTo) {
	// 		return
	// 	}

	// 	const tweetUserMeemId = await this.getTwitterUserMeemId(tweetUser.id)

	// 	const prompt = await orm.models.Prompt.findOne({
	// 		where: {
	// 			tweetId: meemTweetRepliedToId
	// 		}
	// 	})

	// 	if (prompt) {
	// 		services.prompts.mintPromptReplyTweet({
	// 			tweetUser,
	// 			tweetUserMeemId,
	// 			meemTweetRepliedToId,
	// 			prompt,
	// 			promptResponseTweetData: tweetData,
	// 			promptResponseTweetIncludes: includes
	// 		})
	// 	}
	// }

	// public static async mintAndStoreTweet(
	// 	tweetData: TweetV2,
	// 	includes?: ApiV2Includes
	// ): Promise<void> {
	// 	// Make sure tweet contains >meem action
	// 	const isMeemActionTweet = /&gt;meem/gi.test(tweetData.text)

	// 	if (!isMeemActionTweet) {
	// 		return
	// 	}

	// 	const isTestMeem = /&gt;meemtest/gi.test(tweetData.text)
	// 	const isDevMeem = /&gt;meemdev/gi.test(tweetData.text)

	// 	// Since stream rules are environment-independent
	// 	// Make sure we're not minting meems while testing locally
	// 	const isTestEnv =
	// 		process.env.NODE_ENV === 'local' || config.TESTING === true
	// 	if ((!isTestEnv && isTestMeem) || (isTestEnv && !isTestMeem)) {
	// 		return
	// 	}

	// 	if (
	// 		(isDevMeem && config.NETWORK !== MeemAPI.NetworkName.Rinkeby) ||
	// 		(!isDevMeem &&
	// 			!isTestMeem &&
	// 			config.NETWORK === MeemAPI.NetworkName.Rinkeby)
	// 	) {
	// 		return
	// 	}

	// 	const isRetweetOrReply =
	// 		!!tweetData.referenced_tweets && tweetData.referenced_tweets?.length > 0

	// 	const tweetUser = includes?.users?.find(u => u.id === tweetData.author_id)

	// 	if (!tweetUser?.id) {
	// 		return
	// 	}

	// 	const item = await orm.models.Twitter.findOne({
	// 		where: {
	// 			twitterId: tweetUser.id
	// 		}
	// 	})

	// 	if (!item || !item.MeemIdentificationId) {
	// 		log.error(`No meemId found for twitter ID: ${tweetUser.id}`)
	// 		return
	// 	}

	// 	const tweetUserMeemId = await services.meemId.getMeemId({
	// 		meemIdentificationId: item.MeemIdentificationId
	// 	})

	// 	if (tweetUserMeemId.wallets.length === 0) {
	// 		log.error(`No wallet found for meemId: ${item.MeemIdentificationId}`)
	// 		return
	// 	}

	// 	const { isWhitelisted } = tweetUserMeemId.meemPass.twitter

	// 	if (!isWhitelisted) {
	// 		log.error(`meemId not whitelisted: ${item.MeemIdentificationId}`)

	// 		await this.tweet(
	// 			`Sorry @${tweetUser.username}, your Meem ID hasn't been approved yet!`,
	// 			{
	// 				reply: {
	// 					in_reply_to_tweet_id: tweetData.id
	// 				}
	// 			}
	// 		)
	// 		return
	// 	}

	// 	const { tweetsPerDayQuota } = tweetUserMeemId.meemPass.twitter

	// 	const startOfDay = DateTime.now().startOf('day').toJSDate()

	// 	// TODO: If user is retweeting how do we handle quota?
	// 	const userTweetsToday = await orm.models.Tweet.findAll({
	// 		where: {
	// 			userId: tweetUser.id,
	// 			createdAt: {
	// 				[Op.gt]: startOfDay
	// 			}
	// 		}
	// 	})

	// 	if (userTweetsToday.length >= tweetsPerDayQuota) {
	// 		log.error(`User reached tweet quota: ${item.MeemIdentificationId}`)

	// 		await this.tweet(
	// 			`Sorry @${tweetUser.username}, you've reached your meem quota for the day!`,
	// 			{
	// 				reply: {
	// 					in_reply_to_tweet_id: tweetData.id
	// 				}
	// 			}
	// 		)
	// 		return
	// 	}

	// 	if (isRetweetOrReply && tweetData.referenced_tweets) {
	// 		// Get the original tweet referenced
	// 		let originalTweet: TweetV2SingleResult
	// 		if (config.TESTING) {
	// 			originalTweet = {
	// 				data: {
	// 					id: uuidv4(),
	// 					text: 'blah blah'
	// 				}
	// 			}
	// 		} else {
	// 			const client = new TwitterApi(config.TWITTER_BEARER_TOKEN)
	// 			originalTweet = await client.v2.singleTweet(
	// 				tweetData.referenced_tweets[0].id,
	// 				{
	// 					'tweet.fields': ['created_at', 'entities', 'attachments'],
	// 					'user.fields': ['profile_image_url'],
	// 					'media.fields': [
	// 						'media_key',
	// 						'type',
	// 						'height',
	// 						'width',
	// 						'url',
	// 						'preview_image_url'
	// 					],
	// 					expansions: [
	// 						'author_id',
	// 						'in_reply_to_user_id',
	// 						'referenced_tweets.id',
	// 						'attachments.media_keys'
	// 					]
	// 				}
	// 			)
	// 		}

	// 		if (
	// 			config.ENABLE_TWEET_CURATION &&
	// 			originalTweet &&
	// 			originalTweet.data.referenced_tweets &&
	// 			originalTweet.data.referenced_tweets.length > 0
	// 		) {
	// 			// TODO: Do we want to handle nested retweets back to the original M0?
	// 			// This will currently only allow retweets/replies to original tweets to mint an M0
	// 			log.error('The referenced tweet is not an original tweet')
	// 		} else if (config.ENABLE_TWEET_CURATION && originalTweet) {
	// 			// TODO: Mint original tweet if it does not exist
	// 			//	- Mint on behalf of meember if exists or contract address if not?
	// 			const originalTweetUser = originalTweet.includes?.users?.find(
	// 				u => u.id === originalTweet.data.author_id
	// 			)

	// 			if (!originalTweetUser?.id) {
	// 				return
	// 			}

	// 			const originalTweeterTwitter = await orm.models.Twitter.findOne({
	// 				where: {
	// 					twitterId: originalTweetUser.id
	// 				}
	// 			})

	// 			if (
	// 				!originalTweeterTwitter ||
	// 				!originalTweeterTwitter.MeemIdentificationId
	// 			) {
	// 				log.error(
	// 					`No meemId found for original tweet twitter ID: ${originalTweetUser.id}`
	// 				)

	// 				await this.mintTweet({
	// 					tweetData: originalTweet.data,
	// 					tweetIncludes: originalTweet.includes,
	// 					twitterUser: originalTweetUser,
	// 					remix: {
	// 						meemId: tweetUserMeemId,
	// 						tweetData,
	// 						twitterUser: tweetUser
	// 					}
	// 				})
	// 			} else {
	// 				const originalTweeterMeemId = await services.meemId.getMeemId({
	// 					meemIdentificationId: originalTweeterTwitter.MeemIdentificationId
	// 				})

	// 				if (originalTweeterMeemId.wallets.length === 0) {
	// 					log.error(
	// 						`No wallet found for original tweeter meemId: ${originalTweeterTwitter.MeemIdentificationId}`
	// 					)
	// 					return
	// 				}

	// 				await this.mintTweet({
	// 					meemId: originalTweeterMeemId,
	// 					tweetData: originalTweet.data,
	// 					tweetIncludes: originalTweet.includes,
	// 					twitterUser: originalTweetUser,
	// 					remix: {
	// 						meemId: tweetUserMeemId,
	// 						tweetData,
	// 						twitterUser: tweetUser
	// 					}
	// 				})
	// 			}

	// 			// TODO: Mint child MEEM on behalf of the user who retweeted/replied?
	// 		}
	// 	} else {
	// 		// Mint tweet on behalf of user
	// 		// Check if this is a prompt tweet
	// 		let prompt: Prompt | null = null
	// 		if (tweetUser.id === config.TWITTER_MEEM_ACCOUNT_ID) {
	// 			prompt = await orm.models.Prompt.findOne({
	// 				where: {
	// 					tweetId: tweetData.id
	// 				}
	// 			})
	// 		}

	// 		await this.mintTweet({
	// 			meemId: tweetUserMeemId,
	// 			tweetData,
	// 			tweetIncludes: includes,
	// 			twitterUser: tweetUser,
	// 			...(prompt && {
	// 				prompt,
	// 				parentMeemTokenId: config.TWITTER_PROMPTS_PROJECT_TOKEN_ID
	// 			})
	// 		})
	// 	}

	// 	// Minting a tweet counts as being onboarded
	// 	if (!config.TESTING && !tweetUserMeemId.hasOnboarded) {
	// 		await orm.models.MeemIdentification.update(
	// 			{
	// 				hasOnboarded: true
	// 			},
	// 			{
	// 				where: {
	// 					id: item.MeemIdentificationId
	// 				}
	// 			}
	// 		)
	// 	}

	// 	// log.debug(event)
	// 	// log.debug(tweet)
	// }

	// public static async storeTweet(options: {
	// 	tweetData: TweetV2
	// 	twitterUser: UserV2
	// }): Promise<Tweet> {
	// 	const { tweetData, twitterUser } = options

	// 	const tweetText = TwitterService.decodeEntities(tweetData.text)

	// 	const tweet = await orm.models.Tweet.create({
	// 		tweetId: tweetData.id,
	// 		text: tweetText,
	// 		userId: twitterUser?.id,
	// 		username: twitterUser?.username || '',
	// 		userProfileImageUrl: twitterUser?.profile_image_url || '',
	// 		conversationId: tweetData.conversation_id || ''
	// 	})

	// 	const hashtags = tweetData.entities?.hashtags || []

	// 	await Promise.all(
	// 		hashtags.map(async hashtag => {
	// 			let existingTag = await orm.models.Hashtag.findOne({
	// 				where: {
	// 					tag: hashtag.tag
	// 				}
	// 			})

	// 			if (!existingTag) {
	// 				existingTag = await orm.models.Hashtag.create({
	// 					tag: hashtag.tag
	// 				})
	// 			}

	// 			return orm.models.TweetHashtag.create({
	// 				HashtagId: existingTag.id,
	// 				TweetId: tweet.id
	// 			})
	// 		})
	// 	)

	// 	return tweet
	// }

	// public static async mintTweet(options: {
	// 	meemId?: MeemAPI.IMeemId
	// 	tweetData: TweetV2
	// 	tweetIncludes?: ApiV2Includes
	// 	twitterUser: UserV2
	// 	parentMeemTokenId?: string
	// 	remix?: {
	// 		meemId: MeemAPI.IMeemId
	// 		tweetData: TweetV2
	// 		twitterUser: UserV2
	// 	}
	// 	prompt?: Prompt
	// }): Promise<Ethers.ContractReceipt> {
	// 	const {
	// 		meemId,
	// 		parentMeemTokenId,
	// 		tweetData,
	// 		tweetIncludes,
	// 		twitterUser,
	// 		remix,
	// 		prompt
	// 	} = options
	// 	let toAddress = config.MEEM_PROXY_ADDRESS
	// 	if (meemId) {
	// 		if (meemId.defaultWallet !== MeemAPI.zeroAddress) {
	// 			toAddress = meemId.defaultWallet
	// 		} else if (meemId.wallets.length > 0) {
	// 			// eslint-disable-next-line prefer-destructuring
	// 			toAddress = meemId.wallets[0]
	// 		}
	// 	}

	// 	const existingTweet = await orm.models.Tweet.findOne({
	// 		where: {
	// 			tweetId: tweetData.id
	// 		}
	// 	})

	// 	if (existingTweet) {
	// 		throw new Error('TOKEN_ALREADY_EXISTS')
	// 	}

	// 	const tweet = await this.storeTweet({ tweetData, twitterUser })
	// 	let remixTweet: Tweet | null = null

	// 	// Mint tweet MEEM

	// 	try {
	// 		const tweetMeemId = uuidv4()
	// 		const meemContract = await services.meem.getMeemContract({
	// 			walletPrivateKey: config.TWITTER_WALLET_PRIVATE_KEY
	// 		})

	// 		const tweetImage = await this.screenshotTweet(tweet)

	// 		const tweetedAt = tweetData.created_at
	// 			? DateTime.fromISO(tweetData.created_at)
	// 			: DateTime.fromJSDate(tweet.createdAt)

	// 		const mediaKeys =
	// 			tweetData.attachments?.media_keys && tweetIncludes
	// 				? tweetData.attachments.media_keys
	// 				: []
	// 		let mediaAttachments: any[] | undefined

	// 		if (mediaKeys.length > 0 && tweetIncludes?.media) {
	// 			mediaAttachments = mediaKeys?.map(k => {
	// 				return tweetIncludes.media?.find(m => m.media_key === k) || {}
	// 			})
	// 		}

	// 		const meemMetadata = await services.meem.saveMeemMetadataasync(
	// 			{
	// 				name: `@${tweet.username} ${tweetedAt.toFormat(
	// 					'MM-DD-yyyy HH:mm:ss'
	// 				)}`,
	// 				description: tweet.text,
	// 				imageBase64: tweetImage || '',
	// 				meemId: tweetMeemId,
	// 				extensionProperties: {
	// 					meem_tweets_extension: {
	// 						tweet: {
	// 							tweetId: tweet.tweetId,
	// 							text: tweet.text,
	// 							userId: tweet.userId,
	// 							username: tweet.username,
	// 							userProfileImageUrl: tweet.userProfileImageUrl,
	// 							updatedAt: tweet.updatedAt,
	// 							createdAt: tweet.createdAt,
	// 							...(tweetData.entities && { entities: tweetData.entities }),
	// 							...(mediaAttachments && {
	// 								attachements: {
	// 									media: mediaAttachments
	// 								}
	// 							})
	// 						},
	// 						...(prompt && {
	// 							prompt: {
	// 								body: prompt.body,
	// 								startAt: prompt.startAt.toString(),
	// 								tweetId: prompt.tweetId
	// 							}
	// 						})
	// 					}
	// 				}
	// 			},
	// 			MeemAPI.MeemMetadataStorageProvider.Ipfs
	// 		)
	// 		let { recommendedGwei } = await services.web3.getGasEstimate({
	// 			chain: MeemAPI.networkNameToChain(config.NETWORK)
	// 		})

	// 		if (recommendedGwei > config.MAX_GAS_PRICE_GWEI) {
	// 			// throw new Error('GAS_PRICE_TOO_HIGH')
	// 			log.warn(`Recommended fee over max: ${recommendedGwei}`)
	// 			recommendedGwei = config.MAX_GAS_PRICE_GWEI
	// 		}

	// 		const properties = services.meem.buildProperties({
	// 			splits: [
	// 				{
	// 					toAddress: config.DAO_WALLET,
	// 					amount: 100,
	// 					lockedBy: config.MEEM_WALLET_ADDRESS
	// 				}
	// 			]
	// 		})

	// 		let mintTx: Ethers.ContractTransaction
	// 		let remixMetadata: {
	// 			metadata: MeemAPI.IMeemMetadata
	// 			tokenURI: string
	// 		} | null = null

	// 		if (remix) {
	// 			const remixMeemId = uuidv4()
	// 			remixTweet = await this.storeTweet({
	// 				tweetData: remix.tweetData,
	// 				twitterUser: remix.twitterUser
	// 			})
	// 			const remixTweetImage = await this.screenshotTweet(remixTweet)
	// 			const remixerAccountAddress = remix.meemId?.defaultWallet
	// 			const remixTweetedAt = tweetData.created_at
	// 				? DateTime.fromISO(tweetData.created_at)
	// 				: DateTime.fromJSDate(tweet.createdAt)

	// 			remixMetadata = await services.meem.saveMeemMetadataasync(
	// 				{
	// 					name: `@${remixTweet.username} ${remixTweetedAt.toFormat(
	// 						'MM-DD-yyyy HH:mm:ss'
	// 					)}`,
	// 					description: remixTweet.text,
	// 					imageBase64: remixTweetImage || '',
	// 					meemId: remixMeemId,
	// 					extensionProperties: {
	// 						meem_tweets_extension: {
	// 							tweet: {
	// 								tweetId: remixTweet.tweetId,
	// 								text: remixTweet.text,
	// 								userId: remixTweet.userId,
	// 								username: remixTweet.username,
	// 								userProfileImageUrl: remixTweet.userProfileImageUrl,
	// 								updatedAt: remixTweet.updatedAt,
	// 								createdAt: remixTweet.createdAt,
	// 								...(remix.tweetData.entities && {
	// 									entities: remix.tweetData.entities
	// 								})
	// 							}
	// 						}
	// 					}
	// 				},
	// 				MeemAPI.MeemMetadataStorageProvider.Ipfs
	// 			)

	// 			const mintParams: Parameters<Meem['mintAndRemix']> = [
	// 				{
	// 					to: toAddress,
	// 					tokenURI: meemMetadata.tokenURI,
	// 					parentChain: MeemAPI.networkNameToChain(config.NETWORK),
	// 					parent: config.MEEM_PROXY_ADDRESS,
	// 					parentTokenId: parentMeemTokenId || config.TWITTER_PROJECT_TOKEN_ID,
	// 					meemType: MeemAPI.MeemType.Remix,
	// 					// data: JSON.stringify({
	// 					// 	tweetId: tweet.tweetId,
	// 					// 	text: tweet.text,
	// 					// 	username: tweet.username,
	// 					// 	userId: tweet.userId
	// 					// }),
	// 					isURILocked: false,
	// 					reactionTypes: MeemAPI.defaultReactionTypes,
	// 					uriSource: MeemAPI.UriSource.TokenUri,
	// 					// TODO: Is mintedBy the remixer here?
	// 					mintedBy: remixerAccountAddress
	// 				},
	// 				services.meem.propertiesToMeemPropertiesStruct(properties),
	// 				services.meem.propertiesToMeemPropertiesStruct(properties),
	// 				{
	// 					to: remix.meemId?.defaultWallet,
	// 					tokenURI: remixMetadata.tokenURI,
	// 					parentChain: MeemAPI.networkNameToChain(config.NETWORK),
	// 					parent: config.MEEM_PROXY_ADDRESS,
	// 					parentTokenId: config.TWITTER_PROJECT_TOKEN_ID,
	// 					meemType: MeemAPI.MeemType.Remix,
	// 					// data: JSON.stringify({
	// 					// 	tweetId: remixTweet.tweetId,
	// 					// 	text: remixTweet.text,
	// 					// 	username: remixTweet.username,
	// 					// 	userId: remixTweet.userId
	// 					// }),
	// 					isURILocked: false,
	// 					reactionTypes: MeemAPI.defaultReactionTypes,
	// 					uriSource: MeemAPI.UriSource.TokenUri,
	// 					mintedBy: remix.meemId?.defaultWallet
	// 				},
	// 				services.meem.propertiesToMeemPropertiesStruct(properties),
	// 				services.meem.propertiesToMeemPropertiesStruct(properties),
	// 				{
	// 					gasLimit: (+config.MINT_GAS_LIMIT * 2).toString(),
	// 					gasPrice: services.web3.gweiToWei(recommendedGwei).toNumber()
	// 				}
	// 			]

	// 			log.debug('Minting Tweet MEEM and Remix w/ params', { mintParams })

	// 			mintTx = await meemContract.mintAndRemix(...mintParams)

	// 			log.debug(`Minting w/ transaction hash: ${mintTx.hash}`)
	// 		} else {
	// 			const mintParams: Parameters<Meem['mint']> = [
	// 				{
	// 					to: toAddress,
	// 					tokenURI: meemMetadata.tokenURI,
	// 					parentChain: MeemAPI.networkNameToChain(config.NETWORK),
	// 					parent: config.MEEM_PROXY_ADDRESS,
	// 					parentTokenId: parentMeemTokenId || config.TWITTER_PROJECT_TOKEN_ID,
	// 					meemType: MeemAPI.MeemType.Remix,
	// 					// data: JSON.stringify({
	// 					// 	tweetId: tweet.tweetId,
	// 					// 	text: tweet.text,
	// 					// 	username: tweet.username,
	// 					// 	userId: tweet.userId
	// 					// }),
	// 					isURILocked: false,
	// 					reactionTypes: MeemAPI.defaultReactionTypes,
	// 					uriSource: MeemAPI.UriSource.TokenUri,
	// 					mintedBy: toAddress
	// 				},
	// 				services.meem.propertiesToMeemPropertiesStruct(properties),
	// 				services.meem.propertiesToMeemPropertiesStruct(properties),
	// 				{
	// 					gasLimit: config.MINT_GAS_LIMIT,
	// 					gasPrice: services.web3.gweiToWei(recommendedGwei).toNumber()
	// 				}
	// 			]

	// 			log.debug('Minting Tweet MEEM w/ params', { mintParams })

	// 			mintTx = await meemContract.mint(...mintParams)

	// 			log.debug(`Minting w/ transaction hash: ${mintTx.hash}`)
	// 		}

	// 		const receipt = await mintTx.wait()

	// 		const transferEvents = receipt.events?.filter(e => e.event === 'Transfer')

	// 		let tokenId: number | undefined
	// 		let remixTokenId: number | undefined
	// 		const emitPromises: Promise<any>[] = []

	// 		transferEvents?.forEach(transferEvent => {
	// 			if (transferEvent.args && transferEvent.args[2]) {
	// 				const t = (transferEvent.args[2] as Ethers.BigNumber).toNumber()
	// 				const returnData = {
	// 					toAddress,
	// 					tokenURI: meemMetadata.tokenURI,
	// 					tokenId: t,
	// 					transactionHash: receipt.transactionHash
	// 				}
	// 				emitPromises.push(
	// 					sockets?.emit({
	// 						subscription: MeemAPI.MeemEvent.MeemMinted,
	// 						eventName: MeemAPI.MeemEvent.MeemMinted,
	// 						data: returnData
	// 					}) ?? Promise.resolve()
	// 				)
	// 				if (!tokenId) {
	// 					tokenId = t
	// 				} else {
	// 					remixTokenId = t
	// 				}
	// 			}
	// 		})

	// 		const actionText = meemId ? `View here` : `Join Meem and claim it here`

	// 		const tweetPromises = [
	// 			this.tweet(
	// 				`Your tweet has been minted! ${actionText}: ${
	// 					config.MEEM_DOMAIN
	// 				}/meems/${tokenId ?? meemMetadata.metadata.meem_id}`,
	// 				{
	// 					reply: {
	// 						in_reply_to_tweet_id: tweetData.id
	// 					}
	// 				}
	// 			)
	// 		]

	// 		if (remix && remixMetadata) {
	// 			const remixActionText = remix.meemId
	// 				? `View here`
	// 				: `Join Meem and claim it here`
	// 			tweetPromises.push(
	// 				this.tweet(
	// 					`Your tweet has been minted! ${remixActionText}: ${
	// 						config.MEEM_DOMAIN
	// 					}/meems/${remixTokenId ?? remixMetadata.metadata.meem_id}`,
	// 					{
	// 						reply: {
	// 							in_reply_to_tweet_id: remix?.tweetData.id
	// 						}
	// 					}
	// 				)
	// 			)
	// 		}

	// 		await Promise.all(tweetPromises)

	// 		return receipt
	// 	} catch (e) {
	// 		await Promise.all([tweet.destroy(), remixTweet?.destroy()])
	// 		const err = e as any
	// 		log.warn(err)
	// 		try {
	// 			log.debug('Sending error tweet')
	// 			await this.tweet(
	// 				`Oops there was an error minting your tweet! Try deleting it and retrying.`,
	// 				{
	// 					reply: {
	// 						in_reply_to_tweet_id: remix?.tweetData.id || tweetData.id
	// 					}
	// 				}
	// 			)
	// 		} catch (tweetErr) {
	// 			log.warn(tweetErr)
	// 		}
	// 		if (err.error?.error?.body) {
	// 			let errStr = 'UNKNOWN_CONTRACT_ERROR'
	// 			try {
	// 				const body = JSON.parse(err.error.error.body)
	// 				log.warn(body)
	// 				const inter = services.meem.meemInterface()
	// 				const errInfo = inter.parseError(body.error.data)
	// 				errStr = errorcodeToErrorString(errInfo.name)
	// 			} catch (parseError) {
	// 				// Unable to parse
	// 				throw new Error('SERVER_ERROR')
	// 			}
	// 			throw new Error(errStr)
	// 		}
	// 		throw new Error('SERVER_ERROR')
	// 	}
	// }

	// public static async screenshotTweet(tweet: any): Promise<string | undefined> {
	// 	if (config.TESTING) {
	// 		return ''
	// 	}
	// 	const puppeteer = services.puppeteer.getInstance()
	// 	const browser = await puppeteer.launch({
	// 		// headless: true, // debug only
	// 		args: ['--no-sandbox']
	// 	})

	// 	const page = await browser.newPage()

	// 	await page.goto(
	// 		`https://publish.twitter.com/?query=https%3A%2F%2Ftwitter.com%2F${tweet.username}%2Fstatus%2F${tweet.tweetId}&widget=Tweet`,
	// 		{
	// 			waitUntil: ['load', 'networkidle0', 'domcontentloaded']
	// 		}
	// 	)

	// 	await page.waitForSelector('.twitter-tweet-rendered', {
	// 		visible: true
	// 	})

	// 	const renderedTweet = await page.$('.twitter-tweet-rendered')

	// 	const buffer = await renderedTweet?.screenshot({
	// 		type: 'png'
	// 	})

	// 	await browser.close()

	// 	const base64 = buffer?.toString('base64')

	// 	return base64
	// }

	// public static async tweet(
	// 	status: string,
	// 	payload?: Partial<SendTweetV2Params> | undefined
	// ): Promise<TweetV2PostTweetResult> {
	// 	if (config.TESTING) {
	// 		return {
	// 			data: {
	// 				id: uuidv4(),
	// 				text: ''
	// 			}
	// 		}
	// 	}
	// 	const tweetClient = new TwitterApi({
	// 		appKey: config.TWITTER_MEEM_ACCOUNT_CONSUMER_KEY,
	// 		appSecret: config.TWITTER_MEEM_ACCOUNT_CONSUMER_SECRET,
	// 		accessToken: config.TWITTER_MEEM_ACCOUNT_TOKEN,
	// 		accessSecret: config.TWITTER_MEEM_ACCOUNT_SECRET
	// 	})
	// 	return tweetClient.v2.tweet(status, payload)
	// }

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
