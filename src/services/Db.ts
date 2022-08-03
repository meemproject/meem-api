// eslint-disable-next-line import/no-extraneous-dependencies
import AWS from 'aws-sdk'
// eslint-disable-next-line import/no-extraneous-dependencies
import { PutItemInputAttributeMap } from 'aws-sdk/clients/dynamodb'
import { ethers } from 'ethers'
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
					S: ethers.utils.getAddress(walletAddress)
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
		const { subscriptionKey, walletAddress } = options
		const db = new AWS.DynamoDB({
			accessKeyId: config.APP_AWS_ACCESS_KEY_ID,
			secretAccessKey: config.APP_AWS_SECRET_ACCESS_KEY
		})

		const query: AWS.DynamoDB.QueryInput = {
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
		}

		if (
			walletAddress &&
			query.ExpressionAttributeNames &&
			query.ExpressionAttributeValues
		) {
			query.FilterExpression = '#walletAddress = :walletAddress'
			query.ExpressionAttributeNames['#walletAddress'] = 'walletAddress'
			query.ExpressionAttributeValues[':walletAddress'] = {
				S: ethers.utils.getAddress(walletAddress)
			}
		}

		const result = await db.query(query).promise()

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
		type: string
		sinceId: string
		newestId: string
		nextToken: string
	}) {
		const { type, sinceId, newestId, nextToken } = options
		const db = new AWS.DynamoDB.DocumentClient({
			accessKeyId: config.APP_AWS_ACCESS_KEY_ID,
			secretAccessKey: config.APP_AWS_SECRET_ACCESS_KEY
		})

		const item: { [key: string]: any } = {
			type,
			sinceId,
			newestId,
			nextToken
		}

		let updateExpression = 'set'
		const expressionAttributeNames: AWS.DynamoDB.ExpressionAttributeNameMap = {}
		const expressionAttributeValues: AWS.DynamoDB.ExpressionAttributeValueMap =
			{}

		const itemKeys = Object.keys(item)

		itemKeys.forEach((property, i) => {
			if (property !== 'type') {
				updateExpression += ` #${property} = :${property}${
					i < itemKeys.length - 1 ? ',' : ''
				}`
				expressionAttributeNames[`#${property}`] = property
				expressionAttributeValues[`:${property}`] = item[property] || ''
			}
		})

		const params: AWS.DynamoDB.UpdateItemInput = {
			TableName: config.DYNAMODB_TWEET_CHECKPOINTS_TABLE,
			Key: {
				type: item.type
			},
			UpdateExpression: updateExpression,
			ExpressionAttributeNames: expressionAttributeNames,
			ExpressionAttributeValues: expressionAttributeValues
		}

		log.debug(params)

		const result = await db.update(params).promise()

		return result
	}

	public static async getTweetsCheckpoint(options: { type: string }) {
		const { type } = options
		const db = new AWS.DynamoDB({
			accessKeyId: config.APP_AWS_ACCESS_KEY_ID,
			secretAccessKey: config.APP_AWS_SECRET_ACCESS_KEY
		})

		const result = await db
			.query({
				TableName: config.DYNAMODB_TWEET_CHECKPOINTS_TABLE,
				KeyConditionExpression: '#type = :type',
				ExpressionAttributeNames: {
					'#type': 'type'
				},
				ExpressionAttributeValues: {
					':type': {
						S: type
					}
				}
			})
			.promise()

		return result.Items && result.Items.length > 0 ? result.Items[0] : null
	}
}
