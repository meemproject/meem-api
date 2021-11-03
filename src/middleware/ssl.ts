import { Request, Response, NextFunction, Express } from 'express'

// Cloudflare ssl

export default (app: Express) => {
	app.use((req: Request, res: Response, next: NextFunction) => {
		const cf = req.headers['cf-visitor']
		let isSecureCFConnection = false
		if (cf && typeof cf === 'string') {
			const cfParsed = JSON.parse(cf)
			if (cfParsed.scheme === 'https') {
				isSecureCFConnection = true
			}
		}

		if (
			process.env.ALLOW_NON_SSL !== 'true' &&
			// @ts-ignore
			!req.connection.encrypted &&
			req.headers['x-forwarded-proto'] !== 'https' &&
			req.headers['X-Forwarded-Proto'] !== 'https' &&
			!isSecureCFConnection
		) {
			return res.status(400).json({
				status: 'failure',
				reason: 'unsecure protocol'
			})
		}

		return next()
	})
}
