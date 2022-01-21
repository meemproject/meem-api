// import { Octokit } from '@octokit/rest'
// import request from 'superagent'
// import { MeemAPI } from '../types/meem.generated'

import { ethers } from 'ethers'
import moment from 'moment'
import { Op } from 'sequelize'
import { TwitterApi, TweetV2, ApiV2Includes, UserV2 } from 'twitter-api-v2'
import { v4 as uuidv4 } from 'uuid'
import Hashtag from '../models/Hashtag'
import Tweet from '../models/Tweet'
import { Meem } from '../types'
import { MeemAPI } from '../types/meem.generated'

function errorcodeToErrorString(contractErrorName: string) {
	const allErrors: Record<string, any> = config.errors
	const errorKeys = Object.keys(allErrors)
	const errIdx = errorKeys.findIndex(
		k => allErrors[k].contractErrorCode === contractErrorName
	)
	if (errIdx > -1) {
		return errorKeys[errIdx]
	}
	return 'UNKNOWN_CONTRACT_ERROR'
}
export default class TwitterService {
	public static async getUser(options: {
		accessToken: string
		accessSecret: string
	}) {
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

	public static async checkForMissedTweets(): Promise<void> {
		log.trace('Checking for missed tweets')
		const latestTweet = await orm.models.Tweet.findOne({
			order: [['createdAt', 'DESC']]
		})

		if (!latestTweet) {
			return
		}

		const client = new TwitterApi(config.TWITTER_BEARER_TOKEN)
		const endTime = moment()
			.utc()
			.subtract(5, 'minutes')
			.format('YYYY-MM-DDTHH:mm:ssZ')

		try {
			const twitterResponse = await client.v2.search(
				`(meem OR meemtest) -is:retweet -is:reply`,
				{
					end_time: endTime,
					max_results: 100,
					'tweet.fields': ['created_at', 'entities'],
					'user.fields': ['profile_image_url'],
					expansions: ['author_id']
				}
			)

			const tweets = (twitterResponse.data.data || []).filter(tweet => {
				return /&gt;meem/gi.test(tweet.text)
			})

			await Promise.all(
				tweets.map(async tweet => {
					const tweetExists = await orm.models.Tweet.findOne({
						where: {
							tweetId: tweet.id
						}
					})
					if (!tweetExists) {
						return TwitterService.mintAndStoreTweet(
							tweet,
							twitterResponse.data.includes
						)
					}
					return null
				})
			)

			return
		} catch (e) {
			log.crit(e)
		}
	}

	public static async mintAndStoreTweet(
		tweetData: TweetV2,
		includes?: ApiV2Includes
	): Promise<void> {
		// TODO: Retry unsuccessful mints?

		// Make sure tweet contains >meem action
		const isMeemActionTweet = /&gt;meem/gi.test(tweetData.text)

		if (!isMeemActionTweet) {
			return
		}

		const isTestMeem = /&gt;meemtest/gi.test(tweetData.text)
		const isDevMeem = /&gt;meemdev/gi.test(tweetData.text)

		// Since stream rules are environment-independent
		// Make sure we're not minting meems while testing locally

		if ((!config.TESTING && isTestMeem) || (config.TESTING && !isTestMeem)) {
			return
		}

		if (
			(isDevMeem && config.NETWORK !== MeemAPI.NetworkName.Rinkeby) ||
			(!isDevMeem &&
				!isTestMeem &&
				config.NETWORK === MeemAPI.NetworkName.Rinkeby)
		) {
			return
		}

		const client = new TwitterApi(config.TWITTER_BEARER_TOKEN)
		const isRetweetOrReply =
			!!tweetData.referenced_tweets && tweetData.referenced_tweets?.length > 0

		const tweetUser = includes?.users?.find(u => u.id === tweetData.author_id)

		if (!tweetUser?.id) {
			return
		}

		const item = await orm.models.Twitter.findOne({
			where: {
				twitterId: tweetUser.id
			}
		})

		if (!item || !item.MeemIdentificationId) {
			log.error(`No meemId found for twitter ID: ${tweetUser.id}`)
			return
		}

		const tweetUserMeemId = await services.meemId.getMeemId({
			meemIdentificationId: item.MeemIdentificationId
		})

		if (tweetUserMeemId.wallets.length === 0) {
			log.error(`No wallet found for meemId: ${item.MeemIdentificationId}`)
			return
		}

		const { isWhitelisted } = tweetUserMeemId.meemPass.twitter

		const tweetClient = new TwitterApi({
			appKey: config.TWITTER_MEEM_ACCOUNT_CONSUMER_KEY,
			appSecret: config.TWITTER_MEEM_ACCOUNT_CONSUMER_SECRET,
			accessToken: config.TWITTER_MEEM_ACCOUNT_TOKEN,
			accessSecret: config.TWITTER_MEEM_ACCOUNT_SECRET
		})

		if (!isWhitelisted) {
			log.error(`meemId not whitelisted: ${item.MeemIdentificationId}`)

			await tweetClient.v2.tweet(
				`Sorry @${tweetUser.username}, your Meem ID hasn't been approved yet!`,
				{
					reply: {
						in_reply_to_tweet_id: tweetData.id
					}
				}
			)
			return
		}

		const { tweetsPerDayQuota } = tweetUserMeemId.meemPass.twitter

		const startOfDay = moment().utc().startOf('day').toDate()

		// TODO: If user is retweeting how do we handle quota?
		const userTweetsToday = await orm.models.Tweet.findAll({
			where: {
				userId: tweetUser.id,
				createdAt: {
					[Op.gt]: startOfDay
				}
			}
		})

		if (userTweetsToday.length >= tweetsPerDayQuota) {
			log.error(`User reached tweet quota: ${item.MeemIdentificationId}`)

			await tweetClient.v2.tweet(
				`Sorry @${tweetUser.username}, you've reached your meem quota for the day!`,
				{
					reply: {
						in_reply_to_tweet_id: tweetData.id
					}
				}
			)
			return
		}

		if (isRetweetOrReply && tweetData.referenced_tweets) {
			// Get the original tweet referenced
			const originalTweet = await client.v2.singleTweet(
				tweetData.referenced_tweets[0].id,
				{
					'tweet.fields': ['created_at', 'entities'],
					'user.fields': ['profile_image_url'],
					expansions: [
						'author_id',
						'in_reply_to_user_id',
						'referenced_tweets.id'
					]
				}
			)
			if (
				originalTweet &&
				originalTweet.data.referenced_tweets &&
				originalTweet.data.referenced_tweets.length > 0
			) {
				// TODO: Do we want to handle nested retweets back to the original M0?
				// This will currently only allow retweets/replies to original tweets to mint an M0
				log.error('The referenced tweet is not an original tweet')
			} else if (originalTweet) {
				// TODO: Mint original tweet if it does not exist
				//	- Mint on behalf of meember if exists or zero address if not?
				const originalTweetUser = originalTweet.includes?.users?.find(
					u => u.id === originalTweet.data.author_id
				)

				if (!originalTweetUser?.id) {
					return
				}

				const originalTweeterTwitter = await orm.models.Twitter.findOne({
					where: {
						twitterId: originalTweetUser.id
					}
				})

				if (
					!originalTweeterTwitter ||
					!originalTweeterTwitter.MeemIdentificationId
				) {
					log.error(
						`No meemId found for original tweet twitter ID: ${originalTweetUser.id}`
					)
					return
				}

				const originalTweeterMeemId = await services.meemId.getMeemId({
					meemIdentificationId: originalTweeterTwitter.MeemIdentificationId
				})

				if (originalTweeterMeemId.wallets.length === 0) {
					log.error(
						`No wallet found for original tweeter meemId: ${originalTweeterTwitter.MeemIdentificationId}`
					)
					return
				}

				log.debug('TODO: Mint original tweet and child MEEM')
				await this.mintTweet(
					originalTweeterMeemId,
					originalTweet.data,
					originalTweetUser
				)

				// TODO: Mint child MEEM on behalf of the user who retweeted/replied?
			}
		} else {
			// Mint tweet on behalf of user
			await this.mintTweet(tweetUserMeemId, tweetData, tweetUser)
		}

		// Minting a tweet counts as being onboarded
		if (!tweetUserMeemId.hasOnboarded) {
			await orm.models.MeemIdentification.update(
				{
					hasOnboarded: true
				},
				{
					where: {
						id: item.MeemIdentificationId
					}
				}
			)
		}

		// log.debug(event)
		// log.debug(tweet)
	}

	public static async mintTweet(
		meemId: MeemAPI.IMeemId,
		tweetData: TweetV2,
		user: UserV2
	): Promise<ethers.ContractReceipt> {
		const wallet = meemId.defaultWallet
		const tweet = await orm.models.Tweet.create({
			tweetId: tweetData.id,
			text: tweetData.text,
			userId: user?.id,
			username: user?.username || '',
			userProfileImageUrl: user?.profile_image_url || ''
		})

		const hashtags = tweetData.entities?.hashtags || []

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

		// Mint tweet MEEM

		const client = new TwitterApi(config.TWITTER_BEARER_TOKEN)
		const tweetClient = new TwitterApi({
			appKey: config.TWITTER_MEEM_ACCOUNT_CONSUMER_KEY,
			appSecret: config.TWITTER_MEEM_ACCOUNT_CONSUMER_SECRET,
			accessToken: config.TWITTER_MEEM_ACCOUNT_TOKEN,
			accessSecret: config.TWITTER_MEEM_ACCOUNT_SECRET
		})

		try {
			const tweetMeemId = uuidv4()
			const meemContract = services.meem.getMeemContract({
				walletPrivateKey: config.TWITTER_WALLET_PRIVATE_KEY
			})
			const accountAddress = wallet

			const tweetImage = await this.screenshotTweet(tweet)

			const meemMetadata = await services.meem.saveMeemMetadataasync(
				{
					tokenAddress: config.MEEM_PROXY_ADDRESS,
					tokenId: config.TWITTER_PROJECT_TOKEN_ID,
					name: `@${tweet.username} ${moment(
						tweetData.created_at || tweet.createdAt
					).format('MM-DD-YYYY HH:mm:ss')}`,
					description: tweet.text,
					imageBase64: tweetImage || '',
					meemId: tweetMeemId,
					extensionProperties: {
						meem_tweets_extension: {
							tweet: {
								tweetId: tweet.tweetId,
								text: tweet.text,
								userId: tweet.userId,
								username: tweet.username,
								userProfileImageUrl: tweet.userProfileImageUrl,
								updatedAt: tweet.updatedAt,
								createdAt: tweet.createdAt,
								...(tweetData.entities && { entities: tweetData.entities })
							}
						}
					}
				},
				MeemAPI.MeemMetadataStorageProvider.Ipfs
			)
			let { recommendedGwei } = await services.web3.getGasEstimate({
				chain: MeemAPI.networkNameToChain(config.NETWORK)
			})

			if (recommendedGwei > config.MAX_GAS_PRICE_GWEI) {
				// throw new Error('GAS_PRICE_TOO_HIGH')
				log.warn(`Recommended fee over max: ${recommendedGwei}`)
				recommendedGwei = config.MAX_GAS_PRICE_GWEI
			}

			const properties = services.meem.buildProperties({
				totalChildren: '-1',
				copyPermissions: [
					{
						permission: MeemAPI.Permission.Anyone,
						addresses: [],
						numTokens: '0',
						lockedBy: MeemAPI.zeroAddress
					}
				],
				remixPermissions: [
					{
						permission: MeemAPI.Permission.Owner,
						addresses: [],
						numTokens: '0',
						lockedBy: MeemAPI.zeroAddress
					}
				],
				splits: [
					{
						toAddress: '0x40c6BeE45d94063c5B05144489cd8A9879899592',
						amount: 100,
						lockedBy: MeemAPI.zeroAddress
					}
				]
			})

			const mintParams: Parameters<Meem['mint']> = [
				{
					to: accountAddress,
					mTokenURI: meemMetadata.tokenURI,
					parentChain: MeemAPI.Chain.Polygon,
					parent: config.MEEM_PROXY_ADDRESS,
					parentTokenId: config.TWITTER_PROJECT_TOKEN_ID,
					meemType: MeemAPI.MeemType.Remix,
					data: JSON.stringify({
						tweetId: tweet.tweetId,
						text: tweet.text,
						username: tweet.username,
						userId: tweet.userId
					}),
					isVerified: true,
					mintedBy: accountAddress
				},
				properties,
				properties,
				{
					gasLimit: config.MINT_GAS_LIMIT,
					gasPrice: services.web3.gweiToWei(recommendedGwei).toNumber()
				}
			]

			log.debug('Minting Tweet MEEM w/ params', { mintParams })

			const mintTx = await meemContract.mint(...mintParams)

			log.debug(`Minting w/ transaction hash: ${mintTx.hash}`)

			const receipt = await mintTx.wait()

			const transferEvent = receipt.events?.find(e => e.event === 'Transfer')

			if (transferEvent && transferEvent.args && transferEvent.args[2]) {
				const tokenId = (transferEvent.args[2] as ethers.BigNumber).toNumber()
				const returnData = {
					toAddress: accountAddress,
					tokenURI: meemMetadata.tokenURI,
					tokenId,
					transactionHash: receipt.transactionHash
				}
				await sockets?.emit({
					subscription: MeemAPI.MeemEvent.MeemMinted,
					eventName: MeemAPI.MeemEvent.MeemMinted,
					data: returnData
				})
				// log.debug(returnData)
			}
			await tweetClient.v2.tweet(
				`Your tweet has been minted! View here: ${meemMetadata.metadata.external_url}`,
				{
					reply: {
						in_reply_to_tweet_id: tweetData.id
					}
				}
			)

			return receipt
		} catch (e) {
			const err = e as any
			log.warn(err)
			await client.v2.tweet(
				`Oops there was an error minting your tweet! Try deleting it and retrying.`,
				{
					reply: {
						in_reply_to_tweet_id: tweetData.id
					}
				}
			)
			if (err.error?.error?.body) {
				let errStr = 'UNKNOWN_CONTRACT_ERROR'
				try {
					const body = JSON.parse(err.error.error.body)
					log.warn(body)
					const inter = services.meem.meemInterface()
					const errInfo = inter.parseError(body.error.data)
					errStr = errorcodeToErrorString(errInfo.name)
				} catch (parseError) {
					// Unable to parse
					throw new Error('SERVER_ERROR')
				}
				throw new Error(errStr)
			}
			throw new Error('SERVER_ERROR')
		}
	}

	public static async screenshotTweet(tweet: any): Promise<string | undefined> {
		const puppeteer = services.puppeteer.getInstance()
		const browser = await puppeteer.launch({
			// headless: true, // debug only
			args: ['--no-sandbox']
		})

		const page = await browser.newPage()

		await page.goto(
			`https://publish.twitter.com/?query=https%3A%2F%2Ftwitter.com%2F${tweet.username}%2Fstatus%2F${tweet.tweetId}&widget=Tweet`,
			{
				waitUntil: ['load', 'networkidle0', 'domcontentloaded']
			}
		)

		await page.waitForSelector('.twitter-tweet-rendered')

		const renderedTweet = await page.$('.twitter-tweet-rendered')

		const buffer = await renderedTweet?.screenshot({
			type: 'png'
		})

		await browser.close()

		const base64 = buffer?.toString('base64')

		return base64
	}
}
