import { Response } from 'express'

export interface IErrorResponse {
	status: string
	code: string
	reason: string
	friendlyReason: string
	debug?: string
}

function errorcodeToErrorString(contractErrorName: string) {
	const allErrors: Record<string, any> = config.errors
	const errorKeys = Object.keys(allErrors)
	const errIdx = errorKeys.findIndex(
		k => allErrors[k].contractErrorCode === contractErrorName
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
	let code = errorKey
	// @ts-ignore
	if (errorKey && config.errors[errorKey]) {
		// @ts-ignore
		err = config.errors[errorKey]
	} else {
		log.warn(
			`errorResponder Middleware: Invalid error key specified: ${errorKey}`
		)

		code = 'SERVER_ERROR'
	}

	const response: IErrorResponse = {
		status: 'failure',
		code,
		reason: err.reason,
		friendlyReason: err.friendlyReason
	}

	if (config.ENABLE_VERBOSE_ERRORS) {
		response.debug = errorKey
	}

	return res.status(err.httpCode).json(response)
}

function errorHandler(res: Response, errorKey: any) {
	try {
		log.debug(errorKey)
		switch (typeof errorKey) {
			case 'object':
				if (errorKey?.error?.error?.body) {
					let errStr = 'UNKNOWN_CONTRACT_ERROR'
					try {
						const body = JSON.parse(errorKey.error.error.body)
						log.warn(body)
						const inter = services.meem.meemInterface()
						const errInfo = inter.parseError(body.error.data)
						errStr = errorcodeToErrorString(errInfo.name)
					} catch (e) {
						// Unable to parse
					}
					return handleStringErrorKey(res, errStr)
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
