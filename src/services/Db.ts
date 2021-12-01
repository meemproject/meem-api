import AWS from 'aws-sdk'
import { PutItemInputAttributeMap } from 'aws-sdk/clients/dynamodb'
import { MeemAPI } from '../types/meem.generated'

AWS.config.update({
	region: 'us-east-1'
})

export default class DbService {
	public static async saveSubscription(options: {
		connectionId: string
		walletAddress?: string
		events: MeemAPI.IEvent[]
	}) {
		const { connectionId, walletAddress, events } = options
		const db = new AWS.DynamoDB({
			accessKeyId: config.APP_AWS_ACCESS_KEY_ID,
			secretAccessKey: config.APP_AWS_SECRET_ACCESS_KEY
		})
		const items = events.map(e => {
			const item: PutItemInputAttributeMap = {
				connectionId: {
					S: connectionId
				},
				subscriptionKey: {
					S: e.key
				}
			}

			if (walletAddress) {
				item.walletAddress = {
					S: walletAddress
				}
			}
			return {
				PutRequest: {
					Item: item
				}
			}
		})

		const result = await db
			.batchWriteItem({
				RequestItems: {
					[config.DYNAMODB_SOCKETS_TABLE]: items
				}
			})
			.promise()

		return result
	}

	public static async getSubscriptions(options: {
		subscriptionKey: string
		walletAddress?: string
	}) {
		const { subscriptionKey } = options
		const db = new AWS.DynamoDB({
			accessKeyId: config.APP_AWS_ACCESS_KEY_ID,
			secretAccessKey: config.APP_AWS_SECRET_ACCESS_KEY
		})

		// TODO: Query/filter by walletAddress if set

		const result = await db
			.query({
				TableName: config.DYNAMODB_SOCKETS_TABLE,
				KeyConditionExpression: '#subscriptionKey = :subscriptionKey',
				ExpressionAttributeNames: {
					'#subscriptionKey': 'subscriptionKey'
				},
				ExpressionAttributeValues: {
					':subscriptionKey': {
						S: subscriptionKey
					}
				}
			})
			.promise()

		return result
	}

	public static async removeSubscriptions(options: { connectionId: string }) {
		const { connectionId } = options
		const db = new AWS.DynamoDB({
			accessKeyId: config.APP_AWS_ACCESS_KEY_ID,
			secretAccessKey: config.APP_AWS_SECRET_ACCESS_KEY
		})

		const result = await db
			.query({
				TableName: config.DYNAMODB_SOCKETS_TABLE,
				IndexName: 'connectionId-index',
				KeyConditionExpression: '#connectionId = :connectionId',
				ExpressionAttributeNames: {
					'#connectionId': 'connectionId'
				},
				ExpressionAttributeValues: {
					':connectionId': {
						S: connectionId
					}
				}
			})
			.promise()

		const items = result.Items
			? result.Items.map(item => ({
					DeleteRequest: {
						Key: {
							subscriptionKey: {
								S: item.subscriptionKey.S
							},
							connectionId: {
								S: connectionId
							}
						}
					}
			  }))
			: []

		if (items.length > 0) {
			await db
				.batchWriteItem({
					RequestItems: {
						[config.DYNAMODB_SOCKETS_TABLE]: items
					}
				})
				.promise()
		}
	}

	public static async saveTweetsCheckpoint(options: {
		accountId: string
		lastTweetId: string
	}) {
		const { accountId, lastTweetId } = options
		const db = new AWS.DynamoDB({
			accessKeyId: config.APP_AWS_ACCESS_KEY_ID,
			secretAccessKey: config.APP_AWS_SECRET_ACCESS_KEY
		})

		const item: PutItemInputAttributeMap = {
			accountId: {
				S: accountId
			},
			sinceId: {
				S: lastTweetId
			}
		}

		const items = [
			{
				PutRequest: {
					Item: item
				}
			}
		]

		const result = await db
			.batchWriteItem({
				RequestItems: {
					[config.DYNAMODB_TWEETS_TABLE]: items
				}
			})
			.promise()

		return result
	}

	public static async getTweetsCheckpoint(options: { accountId: string }) {
		const { accountId } = options
		const db = new AWS.DynamoDB({
			accessKeyId: config.APP_AWS_ACCESS_KEY_ID,
			secretAccessKey: config.APP_AWS_SECRET_ACCESS_KEY
		})

		const result = await db
			.query({
				TableName: config.DYNAMODB_TWEETS_TABLE,
				KeyConditionExpression: '#accountId = :accountId',
				ExpressionAttributeNames: {
					'#accountId': 'accountId'
				},
				ExpressionAttributeValues: {
					':accountId': {
						S: accountId
					}
				}
			})
			.promise()

		return result.Items && result.Items.length > 0 ? result.Items[0] : null
	}
}
