import { Request, Response, NextFunction, Express } from 'express'

export default (app: Express) => {
	// Remove header identifying this as express
	app.disable('x-powered-by')

	app.use((req: Request, res: Response, next: NextFunction) => {
		let { origin } = req.headers

		if (!origin) {
			origin = `https://${config.CORS_DEFAULT_ORIGIN}`
		}

		// Detect the requesting origin and check it against the allowed origins
		if (!config.CORS_ALLOW_ALL) {
			let isAllowed = false
			for (let i = 0; i < config.CORS_ALLOWED_ORIGINS.length; i += 1) {
				const allowedOriginRegex = config.CORS_ALLOWED_ORIGINS[i]
				const regex = new RegExp(allowedOriginRegex)
				if (regex.test(origin)) {
					isAllowed = true
					break
				}
			}

			if (!isAllowed) {
				origin = `https://${config.CORS_DEFAULT_ORIGIN}`
			}
		}

		// Set allowed origin to the requesting origin (or default if not in whitelist)
		res.setHeader('Access-Control-Allow-Origin', origin)
		res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
		res.setHeader(
			'Access-Control-Allow-Methods',
			'GET,POST,PUT,PATCH,DELETE,OPTIONS'
		)
		res.setHeader('Access-Control-Allow-Credentials', 'true')
		res.setHeader('Access-Control-Expose-Headers', 'lthr-jwt')

		next()
	})
}
