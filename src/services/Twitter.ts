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
import { PermissionType } from '../types/shared/meem.shared'
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
		// TODO: mint tweet meem
		// TODO: in meem webhook, update tweet in db with meem token id
		// TODO: Cron to retry minting meems for tweets without an associated MEEM

		const hashtags = event.data.entities?.hashtags || []

		// TODO: If we need to remove the meem actions from the tweet text?
		// const meemActions = new RegExp('\\\\meem', 'gi')

		// let sanitizedText = event.data.text.replace(meemActions, '')

		// sanitizedText = sanitizedText.replace(/\s\s+/g, ' ').trim()

		const isLocalMeem = /\\local/gi.test(event.data.text)

		log.debug('IS LOCAL', isLocalMeem)

		// Since stream rules are environment-independent
		// Make sure we're not minting meems while testing locally

		if (!config.TESTING && isLocalMeem) {
			return
		}

		const user = event.includes?.users?.find(u => u.id === event.data.author_id)
		const tweet = await orm.models.Tweet.create({
			tweetId: event.data.id,
			text: event.data.text,
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
			const meemId = uuidv4()
			const meemContract = services.meem.getMeemContract()
			const accountAddress = '0xE7EDF0FeAebaF19Ad799eA9246E7bd8a38002d89'

			// TODO: Create Tweet Meem Image

			// let base64Image: string | undefined

			// if (data.s3ImagePath) {
			// 	const imageData = await services.storage.getObject({
			// 		path: data.s3ImagePath
			// 	})

			// 	base64Image = imageData.toString('base64')
			// }

			const meemMetadata = await services.git.saveMeemMetadata({
				name: `@${tweet.username} ${moment(
					event.data.created_at || tweet.createdAt
				)}`,
				description: tweet.text,
				imageBase64: '',
				originalImage: '',
				meemId,
				generation: 0
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
						permission: 1,
						addresses: [],
						numTokens: '0',
						lockedBy: MeemAPI.zeroAddress
					}
				],
				splits: [
					{
						toAddress: accountAddress,
						amount: 10000,
						lockedBy: MeemAPI.zeroAddress
					}
				]
			})

			const mintParams: Parameters<Meem['mint']> = [
				accountAddress,
				meemMetadata.tokenURI,
				1,
				MeemAPI.zeroAddress,
				0,
				// TODO: Set root chain based on parent if necessary
				1,
				MeemAPI.zeroAddress,
				0,
				properties,
				properties,
				// TODO: Set permission type based on copy/remix
				PermissionType.Copy,
				{
					gasPrice: services.web3.gweiToWei(recommendedGwei).toNumber()
				}
			]

			log.debug('Minting Tweet MEEM w/ params', { mintParams })

			await meemContract.setNonOwnerSplitAllocationAmount(0)

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
				try {
					const newMeem = await meemContract.getMeem(returnData.tokenId)
					const branchName =
						config.NETWORK === MeemAPI.NetworkName.Rinkeby ? `test` : `master`
					await services.git.updateMeemMetadata({
						tokenURI: `https://raw.githubusercontent.com/meemproject/metadata/${branchName}/meem/${meemId}.json`,
						generation: newMeem.generation.toNumber(),
						tokenId: returnData.tokenId,
						metadataId: meemId
					})
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
					const body = JSON.parse(e.error.error.body)
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
}
