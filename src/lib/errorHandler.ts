import { Response } from 'express'

function errorcodeToErrorString(code: number) {
	const allErrors: Record<string, any> = config.errors
	const errorKeys = Object.keys(allErrors)
	const errIdx = errorKeys.findIndex(
		k => allErrors[k].contractErrorCode === code
	)
	if (errIdx > -1) {
		return errorKeys[errIdx]
	}
	return 'UNKNOWN_CONTRACT_ERROR'
}

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
		code: errorKey,
		reason: err.reason,
		friendlyReason: err.friendlyReason
	})
}

function errorHandler(res: Response, errorKey: any) {
	try {
		switch (typeof errorKey) {
			case 'object':
				if (errorKey.error) {
					let errStr = 'UNKNOWN_CONTRACT_ERROR'
					try {
						const body = JSON.parse(errorKey.error.error.body)
						errStr = errorcodeToErrorString(body.error.code)
						return handleStringErrorKey(res, errStr)
					} catch (e) {
						// Unable to parse
					}
				} else if (errorKey.message) {
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
