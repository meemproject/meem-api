import AWS from 'aws-sdk'

AWS.config.update({
	region: 'us-east-1'
})

export default class StorageService {
	public static async putObject(options: {
		path: string
		data: AWS.S3.Body
		acl?: AWS.S3.ObjectCannedACL
		contentType?: string
	}) {
		const { path, data, acl } = options
		const contentType = options.contentType ?? 'image/png'
		const s3 = new AWS.S3({
			accessKeyId: config.APP_AWS_ACCESS_KEY_ID,
			secretAccessKey: config.APP_AWS_SECRET_ACCESS_KEY
		})

		log.debug(`PUT S3 Object: ${path}`)

		const result = await s3
			.putObject({
				Bucket: config.S3_BUCKET,
				Key: path,
				Body: data,
				ACL: acl ?? 'private',
				Metadata: {
					'Content-Type': contentType
				},
				ContentType: contentType
			})
			.promise()

		log.debug('PUT object finished', { result })

		return result
	}

	public static async getObject(options: { path: string }) {
		const { path } = options

		const s3 = new AWS.S3({
			accessKeyId: config.APP_AWS_ACCESS_KEY_ID,
			secretAccessKey: config.APP_AWS_SECRET_ACCESS_KEY
		})

		log.debug(`GET S3 Object: ${path}`)

		const result = await s3
			.getObject({
				Bucket: config.S3_BUCKET,
				Key: path
			})
			.promise()

		return result.Body as Buffer
	}

	public static async deleteObject(options: { path: string }) {
		const { path } = options

		const s3 = new AWS.S3({
			accessKeyId: config.APP_AWS_ACCESS_KEY_ID,
			secretAccessKey: config.APP_AWS_SECRET_ACCESS_KEY
		})

		log.debug(`DELETE S3 Object: ${path}`)

		const result = await s3
			.deleteObject({
				Bucket: config.S3_BUCKET,
				Key: path
			})
			.promise()

		return result
	}
}
