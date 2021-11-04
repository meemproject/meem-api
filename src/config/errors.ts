const errors = {
	DEPRECATED: {
		httpCode: 410,
		status: 'failure',
		reason: 'This endpoint has been deprecated.',
		friendlyReason:
			'Sorry, something went wrong. Please try again in a few minutes.'
	},
	SERVER_ERROR: {
		httpCode: 500,
		status: 'failure',
		reason: 'An unknown error occurred in the API.',
		friendlyReason: 'Something went wrong here. Please try again.'
	},
	USER_NOT_LOGGED_IN: {
		httpCode: 403,
		status: 'failure',
		reason: 'The user is not logged in and should re-authenticate.',
		friendlyReason: 'Please log in to continue.'
	},
	NOT_AUTHORIZED: {
		httpCode: 403,
		status: 'failure',
		reason:
			'The user does not have sufficient permissions to perform this action.',
		friendlyReason: "Sorry, you can't do that."
	},
	INVALID_REQUEST: {
		httpCode: 400,
		status: 'failure',
		reason:
			"An incorrect combination of parameters or trying to do operations on something you can't.",
		friendlyReason:
			'Sorry, something went wrong. Please try again in a few minutes.'
	},
	MISSING_PARAMETERS: {
		httpCode: 406,
		status: 'failure',
		reason: 'The request parameters are missing something that is required',
		friendlyReason:
			'Sorry, something went wrong. Please try again in a few minutes.'
	},
	INVALID_PARAMETERS: {
		httpCode: 406,
		status: 'failure',
		reason:
			'The parameters sent do not meet the requirements.  Check the docs.',
		friendlyReason:
			'Sorry, something went wrong. Please try again in a few minutes.'
	},
	RATE_LIMIT_EXCEEDED: {
		httpCode: 420,
		status: 'failure',
		reason: 'Rate limit exceeded',
		friendlyReason: "You're making too many requests. Enhance your calm."
	},
	MISSING_TOKEN_ADDRESS: {
		httpCode: 400,
		status: 'failure',
		reason: 'Must provide tokenAddress – Contract address of NFT to meemify',
		friendlyReason:
			'Must provide tokenAddress – Contract address of NFT to meemify'
	},
	MISSING_TOKEN_ID: {
		httpCode: 400,
		status: 'failure',
		reason:
			'Must provide tokenId – Contract tokenId from address of NFT to meemify',
		friendlyReason:
			'Must provide tokenId – Contract tokenId from address of NFT to meemify'
	},
	MISSING_CHAIN_ID: {
		httpCode: 400,
		status: 'failure',
		reason: 'Must provide chain – Chain ID of the NFT to meemify',
		friendlyReason: 'Must provide chain – Chain ID of the NFT to meemify'
	},
	MISSING_ACCOUNT_ADDRESS: {
		httpCode: 400,
		status: 'failure',
		reason: 'Must provide accountAddress – Wallet address of the NFT owner',
		friendlyReason:
			'Must provide accountAddress – Wallet address of the NFT owner'
	},
	INVALID_PERMISSIONS: {
		httpCode: 400,
		status: 'failure',
		reason: 'Must provide proper permissions',
		friendlyReason: 'Must provide proper permissions'
	},
	INVALID_MEEM_PROJECT: {
		httpCode: 400,
		status: 'failure',
		reason: 'tokenAddress not a valid Meem Project',
		friendlyReason: 'tokenAddress not a valid Meem Project'
	},
	TOKEN_NOT_OWNED: {
		httpCode: 400,
		status: 'failure',
		reason:
			'Owner account address does not own the token you are trying to meemify',
		friendlyReason:
			'Owner account address does not own the token you are trying to meemify'
	},
	TRANSFER_EVENT_NOT_FOUND: {
		httpCode: 500,
		status: 'failure',
		reason: 'Error confirming token transfer',
		friendlyReason: 'Error confirming token transfer'
	}
}

export default errors
