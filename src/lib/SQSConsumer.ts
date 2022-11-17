import https from 'https'
// eslint-disable-next-line import/no-extraneous-dependencies
import AWS from 'aws-sdk'
import { Consumer } from 'sqs-consumer'

AWS.config.update({
	region: 'us-east-1',
	accessKeyId: config.APP_AWS_ACCESS_KEY_ID,
	secretAccessKey: config.APP_AWS_SECRET_ACCESS_KEY
})

const app = Consumer.create({
	queueUrl: config.SQS_QUEUE_URL,
	handleMessageBatch: async records => {
		const promises: Promise<any>[] = []

		records.forEach(record => {
			if (typeof record.Body === 'string') {
				try {
					const e = JSON.parse(record.Body)
					promises.push(services.queue.handleEvent({ event: e }))
				} catch (e) {
					log.warn(e)
				}
			}
		})

		const results = await Promise.allSettled(promises)
		results.forEach(result => {
			if (result.status === 'rejected') {
				log.warn(result.reason)
			}
		})
	},
	sqs: new AWS.SQS({
		httpOptions: {
			agent: new https.Agent({
				keepAlive: true
			})
		}
	})
})

app.on('error', err => {
	log.crit(err.message)
})

app.on('processing_error', err => {
	log.crit(err.message)
})

app.on('timeout_error', err => {
	log.crit(err.message)
})

app.start()

log.superInfo('SQS Consumer Listening')
