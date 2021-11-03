import { Response } from 'express'

function genericError(res: Response) {
	return res.status(500).json({
		status: 'failure',
		code: 'SERVER_ERROR',
		reason: 'Unable to find specific error',
		friendlyReason:
			'Sorry, something went wrong. Please try again in a few minutes.'
	})
}
function handleStringErrorKey(res: Response, errorKey: string) {
	let err = config.errors.SERVER_ERROR
	// @ts-ignore
	if (errorKey && config.errors[errorKey]) {
		// @ts-ignore
		err = config.errors[errorKey]
	} else {
		log.warn(
			`errorResponder Middleware: Invalid error key specified: ${errorKey}`
		)
	}

	return res.status(err.httpCode).json({
		status: 'failure',
		code: err.code,
		reason: err.reason,
		friendlyReason: err.friendlyReason
	})
}

function errorHandler(res: Response, errorKey: any) {
	try {
		switch (typeof errorKey) {
			case 'object':
				if (errorKey.lthrResponseError === true) {
					return res.status(errorKey.httpCode).json({
						status: errorKey.status,
						code: errorKey.code,
						reason: errorKey.reason,
						friendlyReason: errorKey.friendlyReason
					})
				}
				if (errorKey.message) {
					return handleStringErrorKey(res, errorKey.message)
				}
				return genericError(res)

			case 'string':
			default:
				return handleStringErrorKey(res, errorKey)
		}
	} catch (e) {
		log.crit(e)
		return genericError(res)
	}
}

export default errorHandler
