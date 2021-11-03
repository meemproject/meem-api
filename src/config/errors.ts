const errors = {
	DEPRECATED: {
		httpCode: 410,
		status: 'failure',
		code: 'DEPRECATED',
		reason: 'This endpoint has been deprecated.',
		friendlyReason:
			'Sorry, something went wrong. Please try again in a few minutes.'
	},
	SERVER_ERROR: {
		httpCode: 500,
		status: 'failure',
		code: 'SERVER_ERROR',
		reason: 'An unknown error occurred in the API.',
		friendlyReason: 'Something went wrong here. Please try again.'
	},
	USER_NOT_LOGGED_IN: {
		httpCode: 403,
		status: 'failure',
		code: 'USER_NOT_LOGGED_IN',
		reason: 'The user is not logged in and should re-authenticate.',
		friendlyReason: 'Please log in to continue.'
	},
	NOT_AUTHORIZED: {
		httpCode: 403,
		status: 'failure',
		code: 'NOT_AUTHORIZED',
		reason:
			'The user does not have sufficient permissions to perform this action.',
		friendlyReason: "Sorry, you can't do that."
	},
	INVALID_REQUEST: {
		httpCode: 400,
		status: 'failure',
		code: 'INVALID_REQUEST',
		reason:
			"An incorrect combination of parameters or trying to do operations on something you can't.",
		friendlyReason:
			'Sorry, something went wrong. Please try again in a few minutes.'
	},
	MISSING_PARAMETERS: {
		httpCode: 406,
		status: 'failure',
		code: 'MISSING_PARAMETERS',
		reason: 'The request parameters are missing something that is required',
		friendlyReason:
			'Sorry, something went wrong. Please try again in a few minutes.'
	},
	INVALID_PARAMETERS: {
		httpCode: 406,
		status: 'failure',
		code: 'INVALID_PARAMETERS',
		reason:
			'The parameters sent do not meet the requirements.  Check the docs.',
		friendlyReason:
			'Sorry, something went wrong. Please try again in a few minutes.'
	},
	RATE_LIMIT_EXCEEDED: {
		httpCode: 420,
		status: 'failure',
		code: 'RATE_LIMIT_EXCEEDED',
		reason: 'Rate limit exceeded',
		friendlyReason: "You're making too many requests. Enhance your calm."
	}
}

export default errors
