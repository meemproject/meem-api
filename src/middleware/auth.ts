import { Request, Response, NextFunction, Express } from 'express'

export default (app: Express) => {
	app.use(async (req: Request, _res: Response, next: NextFunction) => {
		let jwt: string | undefined

		if (req.headers.authorization && /^JWT/.test(req.headers.authorization)) {
			jwt = req.headers.authorization.replace(/^JWT /, '')
		} else if (req.query.jwt) {
			jwt = req.query.jwt as string
		}

		if (jwt) {
			try {
				const jwtData = services.meemId.verifyJWT(jwt)
				if (jwtData.meemId) {
					const meemId = await orm.models.MeemIdentification.findOne({
						where: {
							id: jwtData.meemId
						},
						include: [
							orm.models.Wallet,
							orm.models.Twitter,
							orm.models.MeemPass
						]
					})

					if (meemId) {
						req.meemId = meemId
					}
				} else if (jwtData.walletAddress) {
					const wallet = await orm.models.Wallet.findOne({
						where: {
							address: jwtData.walletAddress
						}
					})

					if (wallet) {
						req.wallet = wallet
					}
				}
			} catch (e) {
				log.warn(e)
			}
		}

		next()
	})
}
