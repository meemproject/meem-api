// eslint-disable-next-line import/no-extraneous-dependencies
import AWS from 'aws-sdk'
import { encodeSingle } from 'ethers-multisend'
import { MeemAPI } from '../types/meem.generated'

export interface IEvent {
	eventName: MeemAPI.QueueEvent
	data: Record<string, any>
}

export default class QueueService {
	public static async handleEvent(options: { event: IEvent }) {
		const { event } = options
		log.trace('Queue.handleEvent', { event })

		if (event.eventName === MeemAPI.QueueEvent.RunTransaction) {
			// Save the transaction to the db
			const transaction = await orm.models.Transaction.create({
				encodeTransactionInput: event.data.encodeTransactionInput,
				transactionType: event.data.transactionType,
				customABI: event.data.customABI,
				chainId: event.data.chainId
			})

			// Encode and send the transaction
			const encoded = encodeSingle(transaction.encodeTransactionInput)
			const { provider } = await services.ethers.getProvider({
				chainId: transaction.chainId
			})
			const tx = await provider.transact.sendTransaction(encoded.data)
			transaction.hash = tx.hash
			await transaction.save()

			try {
				// Update the transaction status in the db
				await tx.wait()
				transaction.status = MeemAPI.TransactionStatus.Success
				await transaction.save()
			} catch (e) {
				log.warn(e)
				transaction.status = MeemAPI.TransactionStatus.Failure
				await transaction.save()
			}
		} else {
			log.warn(`No event handlers for ${event.eventName}`)
		}
	}

	public static sendMessage(message: AWS.SQS.SendMessageBatchRequestEntry) {
		// eslint-disable-next-line no-async-promise-executor
		return new Promise(async (resolve, reject) => {
			const sqs = new AWS.SQS({
				region: 'us-east-1',
				apiVersion: '2012-11-05',
				accessKeyId: config.APP_AWS_ACCESS_KEY_ID,
				secretAccessKey: config.APP_AWS_SECRET_ACCESS_KEY
			})

			sqs.sendMessageBatch(
				{
					QueueUrl: config.SQS_QUEUE_URL,
					Entries: [message]
				},
				(err, response) => {
					if (err) {
						log.warn(err)
						reject(err)
						return
					}
					resolve(response)
				}
			)
		})
	}
}
