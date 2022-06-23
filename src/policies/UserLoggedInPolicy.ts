import { Request, Response, NextFunction } from 'express'

export default async (req: Request, res: Response, next: NextFunction) => {
	if (!req.wallet) {
		return res.error(Error('USER_NOT_LOGGED_IN'))
	}

	return next()
}
