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
	},
	CREATE_IMAGE_ERROR: {
		httpCode: 500,
		status: 'failure',
		reason: 'There was an error creating the image',
		friendlyReason: 'There was an error creating the image'
	},
	// Contract errors
	UNKNOWN_CONTRACT_ERROR: {
		httpCode: 500,
		status: 'failure',
		reason: 'An unknown contract error occurred. Check the API logs.',
		friendlyReason: 'Sorry, something went wrong'
	},
	MINTING_ACCESS_DENIED: {
		contractErrorCode: 'MintingAccessDenied',
		httpCode: 400,
		status: 'failure',
		reason: 'The account address does not have permission to mint this token.',
		friendlyReason:
			'The account address does not have permission to mint this token.'
	},
	MISSING_REQUIRED_ROLE: {
		contractErrorCode: 'MissingRequiredRole',
		httpCode: 400,
		status: 'failure',
		reason: 'The user is missing the required role to perform that action.',
		friendlyReason:
			'The user is missing the required role to perform that action.'
	},
	NOT_TOKEN_OWNER: {
		contractErrorCode: 'NotTokenOwner',
		httpCode: 400,
		status: 'failure',
		reason: 'The user must be the token owner to perform that action.',
		friendlyReason: 'The user must be the token owner to perform that action.'
	},
	INVALID_NON_OWNER_SPLIT_ALLOCATION_AMOUNT: {
		contractErrorCode: 'InvalidNonOwnerSplitAllocationAmount',
		httpCode: 400,
		status: 'failure',
		reason: 'An invalid split allocation was sent.',
		friendlyReason: 'An invalid split allocation was sent.'
	},
	NO_RENOUNCE_OTHERS: {
		contractErrorCode: 'NoRenounceOthers',
		httpCode: 400,
		status: 'failure',
		reason: "You can't renounce for others.",
		friendlyReason: "You can't renounce for others."
	},
	INVALID_ZERO_ADDRESS_QUERY: {
		contractErrorCode: 'InvalidZeroAddressQuery',
		httpCode: 400,
		status: 'failure',
		reason: 'An invalid query against the zero address was made.',
		friendlyReason: 'An invalid query against the zero address was made.'
	},
	INDEX_OUT_OF_RANGE: {
		contractErrorCode: 'IndexOutOfRange',
		httpCode: 400,
		status: 'failure',
		reason: 'The array index is out of range.',
		friendlyReason: 'The array index is out of range.'
	},
	TOKEN_NOT_FOUND: {
		contractErrorCode: 'TokenNotFound',
		httpCode: 404,
		status: 'failure',
		reason: 'The token could not be found.',
		friendlyReason: 'The token could not be found.'
	},
	TOKEN_ALREADY_EXISTS: {
		contractErrorCode: 'TokenAlreadyExists',
		httpCode: 400,
		status: 'failure',
		reason: 'The token already exists.',
		friendlyReason: 'The token already exists.'
	},
	NO_APPROVE_SELF: {
		contractErrorCode: 'NoApproveSelf',
		httpCode: 400,
		status: 'failure',
		reason: 'You can not approve yourself.',
		friendlyReason: 'You can not approve yourself.'
	},
	NOT_APPROVED: {
		contractErrorCode: 'NotApproved',
		httpCode: 400,
		status: 'failure',
		reason: 'The address is not approved to perform that action.',
		friendlyReason: 'The address is not approved to perform that action.'
	},
	ERC721_RECEIVER_NOT_IMPLEMENTED: {
		contractErrorCode: 'ERC721ReceiverNotImplemented',
		httpCode: 400,
		status: 'failure',
		reason:
			'The address is not safe to send. It must implement ERC721Receiver.',
		friendlyReason:
			'The address is not safe to send. It must implement ERC721Receiver.'
	},
	TO_ADDRESS_INVALID: {
		contractErrorCode: 'ToAddressInvalid',
		httpCode: 400,
		status: 'failure',
		reason: 'The to address is invalid.',
		friendlyReason: 'The to address is invalid.'
	},
	NO_TRANSFER_WRAPPED_NFT: {
		contractErrorCode: 'NoTransferWrappedNFT',
		httpCode: 400,
		status: 'failure',
		reason: 'A wNFT may not be transferred. It may only be claimed.',
		friendlyReason: 'A wNFT may not be transferred. It may only be claimed.'
	},
	NFT_ALREADY_WRAPPED: {
		contractErrorCode: 'NFTAlreadyWrapped',
		httpCode: 400,
		status: 'failure',
		reason: 'A Meem has already been created from that NFT.',
		friendlyReason: 'A Meem has already been created from that NFT.'
	},
	PROPERTY_LOCKED: {
		contractErrorCode: 'PropertyLocked',
		httpCode: 400,
		status: 'failure',
		reason: 'The property may not be updated because it is locked.',
		friendlyReason: 'The property may not be updated because it is locked.'
	},
	INVALID_PROPERTY_TYPE: {
		contractErrorCode: 'InvalidPropertyType',
		httpCode: 400,
		status: 'failure',
		reason: 'An invalid property type was sent to the contract.',
		friendlyReason: 'An invalid property type was sent to the contract.'
	},
	INVALID_PERMISSION_TYPE: {
		contractErrorCode: 'InvalidPermissionType',
		httpCode: 400,
		status: 'failure',
		reason: 'An invalid permission type was sent to the contract.',
		friendlyReason: 'An invalid permission type was sent to the contract.'
	},
	INVALID_TOTAL_CHILDREN: {
		contractErrorCode: 'InvalidTotalChildren',
		httpCode: 400,
		status: 'failure',
		reason:
			'An invalid number for totalChildren was sent. It can not be less than the existing number of children.',
		friendlyReason:
			'An invalid number for totalChildren was sent. It can not be less than the existing number of children.'
	},
	CHILD_DEPTH_EXCEEDED: {
		contractErrorCode: 'ChildDepthExceeded',
		httpCode: 400,
		status: 'failure',
		reason: 'Child Meem depth exceeded. Choose a different Meem.',
		friendlyReason: 'Child Meem depth exceeded. Choose a different Meem.'
	},
	GAS_PRICE_TOO_HIGH: {
		httpCode: 503,
		status: 'failure',
		reason: 'The current gas price is too high. Please wait and try again.',
		friendlyReason:
			'The current gas price is too high. Please wait and try again.'
	}
}

export default errors