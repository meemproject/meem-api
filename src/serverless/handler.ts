/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-var-requires */
// eslint-disable-next-line import/no-extraneous-dependencies
/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-var-requires */
import util from 'util'
// eslint-disable-next-line import/no-extraneous-dependencies
import { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import Busboy from 'busboy'
import supertest, { SuperTest, Test } from 'supertest'
import start from '../core/start'

let server: Express.Application
let request: SuperTest<Test>

interface IFile {
	fieldname: string
	data: Buffer
	filename: string
}

interface IField {
	fieldname: string
	val: string
}

function parseMultipart(options: {
	body: Buffer
	contentType: string
}): Promise<{
	files: IFile[]
	fields: IField[]
}> {
	return new Promise((resolve, reject) => {
		const files: IFile[] = []
		const fields: IField[] = []

		const { body, contentType } = options

		const bb = new Busboy({ headers: { 'content-type': contentType } })
		bb.on('file', (fieldname, file, filename, _encoding, _mimetype) => {
			file
				.on('data', data => {
					log.trace('File [%s] got %d bytes', fieldname, data.length)
					files.push({
						fieldname,
						data,
						filename
					})
				})
				.on('end', () => log.trace('File [%s] Finished', fieldname))
		})
			.on('field', (fieldname, val) => {
				log.trace('Field [%s]: value: %j', fieldname, val)
				fields.push({
					fieldname,
					val
				})
			})
			.on('finish', () => {
				log.trace('Done parsing form!')
				resolve({
					fields,
					files
				})
			})
			.on('error', (err: Error) => {
				reject(err)
			})

		bb.end(body)
	})
}

export const handle: APIGatewayProxyHandlerV2 = async (event, context) => {
	const {
		headers,
		queryStringParameters,
		body,
		isBase64Encoded,
		requestContext
	} = event

	const { path, method: httpMethod } = requestContext.http

	if (process.env.SERVERLESS_LOG_FULL_REQUEST === 'true') {
		// eslint-disable-next-line no-console
		console.log(util.inspect({ event }, true, 999, true))
	} else {
		// eslint-disable-next-line no-console
		console.log(
			util.inspect(
				{
					httpMethod,
					path,
					headers,
					queryStringParameters,
					isBase64Encoded
				},
				true,
				999,
				true
			)
		)
	}
	context.callbackWaitsForEmptyEventLoop = false

	if (!request || !server) {
		const result = await start()
		server = result.app
		request = supertest(server)
	}

	// @ts-ignore
	if (event.source === 'serverless-plugin-warmup') {
		// eslint-disable-next-line no-console
		console.log('WARMED LAMBDA FUNCTION: handler')
		return {
			statusCode: 200,
			body: ''
		}
	}

	if (config.AWS_WEBSOCKET_GATEWAY_URL) {
		sockets?.connectLambda({
			endpoint: config.AWS_WEBSOCKET_GATEWAY_URL
		})
	} else {
		log.crit('AWS_WEBSOCKET_GATEWAY_URL is not set')
	}

	const method = httpMethod.toLowerCase()

	// @ts-ignore
	let req: supertest.Test = request[method](path).set(headers)

	if (queryStringParameters) {
		const query: {
			[key: string]: string | string[] | undefined
		} = {}
		Object.keys(queryStringParameters).forEach(k => {
			query[k] = queryStringParameters[k]
		})

		req = req.query(query)
	}
	if (body) {
		if (isBase64Encoded) {
			// Handle form data
			const contentType = headers['content-type']
			if (contentType && /^multipart\/form-data/.test(contentType)) {
				const buff = Buffer.from(body, 'base64')
				const { files, fields } = await parseMultipart({
					body: buff,
					contentType
				})
				log.trace('Treating request as multipart form-data')
				files.forEach(f => {
					req = req.attach(f.fieldname, f.data, f.filename)
				})
				fields.forEach(f => {
					req = req.field(f.fieldname, f.val)
				})
			} else {
				// Handle url encoded
				log.trace('Treating request as x-www-form-urlencoded')
				try {
					const str = Buffer.from(body, 'base64').toString('utf-8')
					log.debug({
						decodedStr: str
					})
					req = req.type('form')
					req = req.send(str)
				} catch (e) {
					log.warn(e)
				}
			}
		} else {
			req = req.send(body)
		}
	}

	const result = await req

	const responseBody = JSON.stringify(result.body)

	const multiValueHeaders: Record<string, any[]> = {}

	Object.keys(result.headers).forEach(key => {
		if (Array.isArray(result.headers[key])) {
			multiValueHeaders[key] = result.headers[key]
			delete result.headers[key]
		}
	})

	log.debug({ headers: result.headers, multiValueHeaders })

	const response = {
		statusCode: result.status,
		headers: result.headers,
		multiValueHeaders,
		body: responseBody
	}

	log.trace(response)

	return response
}
