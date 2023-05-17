import AWS from 'aws-sdk'
import type { SendEmailRequest } from 'aws-sdk/clients/ses'
import { PromiseResult } from 'aws-sdk/lib/request'

export default class AwsService {
	public static async sendEmail(options: {
		to: string[]
		from?: string
		subject: string
		body: string
	}): Promise<PromiseResult<AWS.SES.SendEmailResponse, AWS.AWSError>> {
		const { to, from, subject, body } = options
		if (config.TESTING) {
			// @ts-ignore
			return
		}

		const ses = new AWS.SES({
			region: 'us-east-1',

			credentials: {
				accessKeyId: config.APP_AWS_ACCESS_KEY_ID,
				secretAccessKey: config.APP_AWS_SECRET_ACCESS_KEY
			}
		})
		const params: SendEmailRequest = {
			Destination: {
				ToAddresses: to
			},
			Message: {
				Body: {
					Html: {
						Charset: 'UTF-8',
						// Data: transactionalTemplate({
						// 	subject,
						// 	inboxPreview: "Here's an inbox preview of the message."
						// })
						Data: body
					}
				},
				Subject: {
					Charset: 'UTF-8',
					Data: subject
				}
			},
			Source: from ?? 'Meem <hello@meem.wtf>'
		}

		const result = await ses.sendEmail(params).promise()

		return result
	}
}
