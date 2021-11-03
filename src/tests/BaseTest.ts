import { Server } from 'http'
import { Suite } from 'mocha'
import supertest, { SuperTest, Test, Response } from 'supertest'
import start from '../core/start'
import { HttpMethod } from '../types/app'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

export default class BaseTest {
	protected server!: Express.Application

	protected request!: SuperTest<Test>

	public constructor(mocha: Suite) {
		if (!mocha) {
			throw new Error('Test suite is not passing mocha to base constructor')
		}
		// Set mocha options for timeout to 30s and no retries
		mocha.timeout(30000)
		mocha.retries(0)

		before(() => this.before())
		after(() => this.after())
		beforeEach(() => this.beforeEach())
		afterEach(() => this.afterEach())
		this.setup()
	}

	protected async before() {
		const { server } = await start()
		this.server = server as Server
		this.request = supertest(this.server)

		await this.setupMocks()
	}

	protected async setupMocks() {}

	protected async after() {}

	protected async setup() {
		log.warn('No tests run because there is no setup() method')
	}

	protected beforeEach() {}

	protected afterEach() {}

	protected async makeRequest(options: {
		path: string
		method: HttpMethod
		query?: Record<string, any>
		// eslint-disable-next-line @typescript-eslint/ban-types
		data?: string | object
		expect?: number
	}): Promise<Response> {
		const { path, method, data, query, expect } = options
		let req = this.getRequest(method)(path)

		if (query) {
			req = req.query(query)
		}

		if (data) {
			req = req.send(data)
		}

		if (typeof expect === 'number') {
			req = req.expect(expect)
		}

		const result = await req

		return result
	}

	protected wait(ms: number) {
		return new Promise(resolve => {
			setTimeout(() => resolve(), ms)
		})
	}

	protected getRequest(method: HttpMethod) {
		switch (method) {
			case HttpMethod.Options:
				return this.request.options
			case HttpMethod.Delete:
				return this.request.delete
			case HttpMethod.Patch:
				return this.request.patch
			case HttpMethod.Post:
				return this.request.post
			case HttpMethod.Get:
			default:
				return this.request.get
		}
	}
}
