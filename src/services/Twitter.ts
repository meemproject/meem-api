// import { Octokit } from '@octokit/rest'
// import request from 'superagent'
// import { MeemAPI } from '../types/meem.generated'

import { ethers } from 'ethers'
import moment from 'moment'
import { TwitterApi, TweetV2, TweetV2SingleStreamResult } from 'twitter-api-v2'
import { v4 as uuidv4 } from 'uuid'
import Hashtag from '../models/Hashtag'
import Tweet from '../models/Tweet'
import { Meem } from '../types'
import { MeemAPI } from '../types/meem.generated'
import DbService from './Db'

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

	public static async getMeemMentionTweetsFromTwitter(): Promise<{
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

	public static async getMeemActionTweetsFromTwitter(action: string): Promise<{
		tweets: TweetV2[]
		meta: any
	}> {
		const client = new TwitterApi(config.TWITTER_BEARER_TOKEN)

		const tweetCheckpoint = await DbService.getTweetsCheckpoint({
			type: `action_${action}`
		})

		try {
			// TODO: Swap out TWITTER_MEEM_ACTION for actual TWITTER_MEEM_ACTION and delete action_meem checkpoint ind DB
			const twitterResponse = await client.v2.search(`\\${action}`, {
				max_results: 10,
				since_id: tweetCheckpoint ? tweetCheckpoint?.sinceId.S : undefined,
				'tweet.fields': ['created_at'],
				next_token:
					tweetCheckpoint?.nextToken.S !== ''
						? tweetCheckpoint?.nextToken.S
						: undefined
			})

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

	public static async mintAndStoreTweet(
		event: TweetV2SingleStreamResult
	): Promise<void> {
		// TODO: check whitelist for twitter user ID
		// TODO: if user is whitelisted, get their wallet address from their Meem ID
		// TODO: in meem webhook, update tweet in db with meem token id
		// TODO: Cron to retry minting meems for tweets without an associated MEEM
		// TODO: Send reply tweet from @0xmeem

		const hashtags = event.data.entities?.hashtags || []

		// Make sure tweet contains >meem action
		const isMeemActionTweet = /&gt;meem/gi.test(event.data.text)

		if (!isMeemActionTweet) {
			return
		}

		const isTestMeem = /&gt;meemtest/gi.test(event.data.text)

		// Since stream rules are environment-independent
		// Make sure we're not minting meems while testing locally

		if (!config.TESTING && isTestMeem) {
			return
		}

		const user = event.includes?.users?.find(u => u.id === event.data.author_id)

		if (!user?.id) {
			return
		}

		const item = await orm.models.Twitter.findOne({
			where: {
				twitterId: user.id
			}
		})

		if (!item || !item.MeemIdentificationId) {
			log.error(`No meemId found for twitter ID: ${user.id}`)
			return
		}

		const meemId = await services.meemId.getMeemId({
			meemIdentificationId: item.MeemIdentificationId
		})

		if (meemId.wallets.length === 0) {
			log.error(`No wallet found for meemId: ${item.MeemIdentificationId}`)
			return
		}

		const { isWhitelisted } = meemId.meemPass.twitter
		const wallet = meemId.wallets[0]

		const client = new TwitterApi({
			appKey: config.TWITTER_MEEM_ACCOUNT_CONSUMER_KEY,
			appSecret: config.TWITTER_MEEM_ACCOUNT_CONSUMER_SECRET,
			accessToken: config.TWITTER_MEEM_ACCOUNT_TOKEN,
			accessSecret: config.TWITTER_MEEM_ACCOUNT_SECRET
		})

		if (!isWhitelisted) {
			log.error(`meemId not whitelisted: ${item.MeemIdentificationId}`)

			await client.v2.tweet(
				`Sorry @${user.username}, your Meem ID hasn't been approved yet!`,
				{
					reply: {
						in_reply_to_tweet_id: event.data.id
					}
				}
			)
			return
		}

		const tweet = await orm.models.Tweet.create({
			tweetId: event.data.id,
			text: event.data.text,
			userId: user?.id,
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

		// Mint tweet MEEM

		try {
			const tweetMeemId = uuidv4()
			const meemContract = services.meem.getMeemContract({
				walletPrivateKey: config.TWITTER_WALLET_PRIVATE_KEY
			})
			const accountAddress = wallet

			const tweetImage = await this.screenshotTweet(tweet)

			const meemMetadata = await services.git.saveMeemMetadata({
				name: `@${tweet.username} ${moment(
					event.data.created_at || tweet.createdAt
				).format('MM-DD-YYYY HH:mm:ss')}`,
				description: tweet.text,
				imageBase64: tweetImage || '',
				meemId: tweetMeemId,
				generation: 0,
				extensionProperties: {
					meem_tweets_extension: {
						tweet: {
							tweetId: tweet.tweetId,
							text: tweet.text,
							authorId: tweet.userId,
							username: tweet.username,
							userProfileImageUrl: tweet.userProfileImageUrl,
							updatedAt: tweet.updatedAt,
							createdAt: tweet.createdAt,
							...(event.data.entities && { entities: event.data.entities })
						}
					}
				}
			})
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
					rootChain: MeemAPI.Chain.Polygon,
					root: config.MEEM_PROXY_ADDRESS,
					rootTokenId: config.TWITTER_PROJECT_TOKEN_ID,
					permissionType: MeemAPI.PermissionType.Remix,
					data: JSON.stringify({
						tweetId: tweet.tweetId,
						text: tweet.text,
						username: tweet.username
					})
				},
				properties,
				properties,
				{
					gasPrice: services.web3.gweiToWei(recommendedGwei).toNumber()
				}
			]

			log.debug('Minting Tweet MEEM w/ params', { mintParams })

			// !! DON'T CALL THIS FROM A CONTRACT - IT'S AN ADMIN FUNCTION THAT SETS THE SPLIT REQUIREMENTS FOR ALL MEEMS
			// await meemContract.setNonOwnerSplitAllocationAmount(0)

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
				log.debug(returnData)
				try {
					const newMeem = await meemContract.getMeem(returnData.tokenId)
					const branchName =
						config.NETWORK === MeemAPI.NetworkName.Rinkeby ? `test` : `master`
					const updatedMetadata = await services.git.updateMeemMetadata({
						tokenURI: `https://raw.githubusercontent.com/meemproject/metadata/${branchName}/meem/${tweetMeemId}.json`,
						generation: newMeem.generation.toNumber(),
						tokenId: returnData.tokenId,
						metadataId: tweetMeemId
					})
					await client.v2.tweet(
						`Your tweet has been minted! View here: ${updatedMetadata.external_url}`,
						{
							reply: {
								in_reply_to_tweet_id: event.data.id
							}
						}
					)
				} catch (updateErr) {
					log.warn('Error updating Meem metadata', updateErr)
				}
			}
		} catch (e) {
			const err = e as any
			log.warn(err)
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

		// log.debug(event)
		// log.debug(tweet)
	}

	public static async screenshotTweet(tweet: any): Promise<string | undefined> {
		// eslint-disable-next-line
		const puppeteer = require('puppeteer')
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
