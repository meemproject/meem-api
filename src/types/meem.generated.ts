/* eslint-disable no-new */
/* eslint-disable import/export */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable no-unused-vars */
/* eslint-disable no-redeclare */
/* eslint-disable @typescript-eslint/no-unused-vars */
export namespace MeemAPI {
export interface IError {
	status: string
	code: string
	reason: string
	friendlyReason: string
}

export enum HttpMethod {
	Get = 'GET',
	Post = 'POST',
	Patch = 'PATCH',
	Put = 'PUT',
	Options = 'OPTIONS',
	Delete = 'DELETE'
}

export interface IApiResponseBody {
	apiVersion: string
}

/** The source of the event. Who emits the event. */
export enum EventSource {
	Server = 'server',
	Client = 'client'
}

export interface IEvent {
	key: string
	data?: Record<string, any>
}

export type AsyncReturnType<T extends (...args: any) => Promise<any>> =
	T extends (...args: any) => Promise<infer R> ? R : any


export enum License {
	Cc0 = 'cc0',
	Unknown = 'unknown'
}

export interface IWhitelist {
	[contractAddress: string]: IWhitelistItem
}

export interface IWhitelistItem {
	/** The chain for the contract */
	chain: Chain

	/** Whether all holders are whitelisted */
	allAddresses?: boolean

	/** Specific addresses to allow mint access for this token (overriden by allAddresses) */
	addresses?: string[]

	/** The NFT name */
	name: string

	/** The NFT description */
	description: string

	/** The name of the original NFT creator */
	creator?: string

	/** The license */
	license: License

	/** Link to the license */
	licenseURL?: string

	/** Description of the T&C */
	terms?: string

	/** Link to the terms and conditions */
	termsURL?: string

	/** Link to the NFT website */
	websiteURL?: string
}

export interface IAccessList {
	addresses: {
		/* The wallet address to configure access */
		[address: string]: IAccessAddressListItem
	}
	tokens: {
		/* The token address to confibure access */
		[address: string]: IWhitelistItem
	}
}

export interface IAccessAddressListItem {
	/** Whether to allow mint access to all tokens */
	allTokens?: boolean

	/** Specific tokens to allow mint access (overriden by allTokens) */
	tokens?: string[]
}

/** The zero address. Used in Meems to denote fields that are not set. */
export const zeroAddress = '0x0000000000000000000000000000000000000000'

/** The chain id corresponding to the smart contract */
export enum Chain {
	Ethereum,
	Polygon,
	Cardano,
	Solana,
	Rinkeby
}

/** The permission type corresponding to the smart contract */
export enum PermissionType {
	Copy,
	Remix,
	Read
}

/** The permission corresponding to the smart contract */
export enum Permission {
	Owner,
	Anyone,
	Addresses,
	Holders
}

/** The propety type corresponding to the smart contract */
export enum PropertyType {
	Meem,
	Child
}

/** Various eth-like chains and their corresponding ids */
export enum NetworkChainId {
	Mainnet = 1,
	Rinkeby = 4,
	Polygon = 137,
	Mumbai = 80001
}

/** The network name as expected by ethers.providers.InfuraProvider */
export enum NetworkName {
	Mainnet = 'homestead',
	Rinkeby = 'rinkeby',
	Polygon = 'matic',
	Mumbai = 'mumbai'
}

/** Convert Chain to NetworkName */
export const chainToNetworkName = (chain: Chain): NetworkName => {
	switch (+chain) {
		case Chain.Ethereum:
			return NetworkName.Mainnet

		case Chain.Rinkeby:
			return NetworkName.Rinkeby

		case Chain.Polygon:
			return NetworkName.Polygon

		default:
			throw new Error('INVALID_CHAIN')
	}
}

/** Convert NetworkName to Chain */
export const networkNameToChain = (networkName: NetworkName): Chain => {
	switch (networkName) {
		case NetworkName.Mainnet:
			return Chain.Ethereum

		case NetworkName.Rinkeby:
			return Chain.Rinkeby

		case NetworkName.Polygon:
			return Chain.Polygon

		default:
			throw new Error('INVALID_CHAIN')
	}
}

/** Convert Chain to friendly, readable network name */
export const chainToFriendlyNetworkName = (chain: Chain) => {
	switch (+chain) {
		case Chain.Ethereum:
			return 'Ethereum'

		case Chain.Rinkeby:
			return 'Rinkeby'

		case Chain.Polygon:
			return 'Polygon'

		default:
			throw new Error('INVALID_CHAIN')
	}
}

/** A single split */
export interface IMeemSplit {
	toAddress: string
	amount: number
	lockedBy: string
}

export interface IMeemMetadata {
	name: string
	description: string
	external_url: string
	image: string
	image_original: string
	meem_properties: {
		root_token_uri: string | null
		root_token_address: string | null
		root_token_id: string | null
		root_token_metadata: any | null
		parent_token_uri: any | null
		parent_token_address: string | null
		parent_token_id: string | null
		parent_token_metadata: any | null
	}
	extension_properties?: any
}

export interface IMeemPermission {
	permission: Permission
	addresses: string[]
	/** BigNumber hex string */
	numTokens: string
	lockedBy: string
}

export interface IMeemProperties {
	/** BigNumber hex string */
	totalChildren: string
	totalChildrenLockedBy: string
	/** BigNumber hex string */
	childrenPerWallet: string
	childrenPerWalletLockedBy: string
	copyPermissions: IMeemPermission[]
	remixPermissions: IMeemPermission[]
	readPermissions: IMeemPermission[]
	copyPermissionsLockedBy: string
	remixPermissionsLockedBy: string
	readPermissionsLockedBy: string
	splits: IMeemSplit[]
	splitsLockedBy: string
}

export interface IMeem {
	/** Address of the token owner */
	owner: string
	tokenURI?: string
	parentChain: Chain
	parent: string
	/** BigNumber hex string */
	parentTokenId: string
	generation: number
	rootChain: Chain
	root: string
	/** BigNumber hex string */
	rootTokenId: string
	properties: IMeemProperties
	childProperties: IMeemProperties
	/** Unix timestamp of when the Meem was minted */
	mintedAt: number
	data: string
}

export interface IERC721Metadata {
	name?: string
	image?: string
	description?: string
}

export interface INFT {
	/** The address of the contract of the NFT */
	tokenAddress: string
	/** The token id of the NFT */
	tokenId: string
	/** The type of NFT contract standard */
	contractType: string
	/** The address of the owner of the NFT */
	ownerOf: string
	/** The blocknumber when the amount or owner changed */
	blockNumber: string
	/** The blocknumber when the NFT was minted */
	blockNumberMinted: string
	/** The uri to the metadata of the token */
	tokenUri?: string
	/** The metadata of the token */
	metadata?: string
	/** When the metadata was last updated */
	syncedAt?: string
	/** The number of this item the user owns (used by ERC1155) */
	amount?: string
	/** The name of the Token contract */
	name: string
	/** The symbol of the NFT contract */
	symbol: string
}

export interface IChainNFTsResult {
	total: number
	page: number
	pageSize: number
	chain: Chain
	nfts: INFT[]
}

export interface IMeemId {
	/** List of wallet addresses */
	wallets: string[]
	/** List of twitter IDs */
	twitters: string[]

	meemPass: {
		twitter: {
			hasApplied: boolean
			isWhitelisted: boolean
			tweetsPerDayQuota: number
		}
	}
}

export namespace v1 {

/** Create Meem Image */
export namespace CreateMeemImage {
	export interface IPathParams {}

	export const path = () => `/images/1.0/meems/create-image`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		tokenAddress?: string
		tokenId?: number
		chain?: number
		base64Image?: string
		imageUrl?: string
	}

	export interface IResponseBody extends IApiResponseBody {
		image: string
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}



/** Create Meem Image */
export namespace CreateMeemProject {
	export interface IPathParams {}

	export const path = () => `/images/1.0/projects`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		name: string
		description: string
		minterAddresses: string[]
	}

	export interface IResponseBody extends IApiResponseBody {
		status: 'success'
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}



export namespace CreateOrUpdateMeemId {
	export interface IPathParams {}

	export const path = () => `/api/1.0/meemId`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** Wallet address to add or lookup by */
		address: string
		/** Signature of wallet address */
		signature: string

		/** Twitter account to add or lookup by */
		twitterAccessToken: string
		/** Twitter account to add or lookup by */
		twitterAccessSecret: string
	}

	export interface IResponseBody extends IApiResponseBody {
		status: 'success'
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}



/** Get Meem access config */
export namespace GetAccessList {
	export interface IPathParams {}

	export const path = () => `/api/1.0/access`

	export const method = HttpMethod.Get

	export interface IQueryParams {}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {
		access: IAccessList
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}



/** Get Config */
export namespace GetConfig {
	export interface IPathParams {}

	export const path = () => '/api/1.0/config'

	export const method = HttpMethod.Get

	export interface IQueryParams {}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}



/** Get Info about Token */
export namespace GetIPFSFile {
	export interface IPathParams {}

	export const path = () => `/api/1.0/ipfs`

	export const method = HttpMethod.Get

	export interface IQueryParams {
		filename: string
	}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}



export namespace GetMe {
	export interface IPathParams {}

	export const path = () => `/api/1.0/me`

	export const method = HttpMethod.Get

	export interface IQueryParams {}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {
		/** The MeemId */
		meemId: IMeemId
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}



/** Get Meem */
export namespace GetMeem {
	export interface IPathParams {
		/** The token id to fetch */
		tokenId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/meems/${options.tokenId}`

	export const method = HttpMethod.Get

	export interface IQueryParams {}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {
		meem: IMeem
		metadata: any
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}



export namespace GetMeemId {
	export interface IPathParams {}

	export const path = () => `/api/1.0/meemId`

	export const method = HttpMethod.Get

	export interface IQueryParams {
		/** Wallet address to lookup by */
		address?: string
		/** Twitter id to lookup by */
		twitterId?: string
	}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {
		/** The MeemId */
		meemId: IMeemId
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}



/** Get Meem */
export namespace GetMeems {
	export interface IPathParams {}

	export const path = (options: IPathParams) => `/api/1.0/meems`

	export const method = HttpMethod.Get

	export interface IQueryParams {
		parentTokenAddress?: string
		parentTokenId?: number
		parentChain?: number
	}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {
		meems: any[] // TODO: replace with IMeem type
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}



/** Get NFTs owned by an account */
export namespace GetNFTs {
	export interface IPathParams {}

	export const path = () => `/api/1.0/nfts`

	export const method = HttpMethod.Get

	export interface IQueryParams {
		address: string
		/** Limit results to only these chains */
		chains?: Chain[]
		offset?: number
		limit?: number
	}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {
		chains: IChainNFTsResult[]
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}



export namespace GetNonce {
	export interface IPathParams {}

	export const path = () => `/api/1.0/getNonce`

	export const method = HttpMethod.Get

	export interface IQueryParams {
		/** The address that will be signing */
		address: string
	}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {
		nonce: string
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}



/** Get Info about Token */
export namespace GetTokenInfo {
	export interface IPathParams {}

	export const path = () => `/api/1.0/tokenInfo`

	export const method = HttpMethod.Get

	export interface IQueryParams {
		address: string
		tokenId: number
		networkName: NetworkName
	}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {
		owner: string
		tokenURI: string
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}



/** Get Meem Tweets */
export namespace GetTweets {
	export interface IPathParams {}

	export const path = () => `/api/1.0/tweets`

	export const method = HttpMethod.Get

	export interface IQueryParams {}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {
		tweets: any[]
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}



/** Get Twitter Access Token */
export namespace GetTwitterAccessToken {
	export interface IPathParams {}

	export const path = () => `/api/1.0/meemid/twitter/access-token`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		oauthToken: string
		oauthTokenSecret: string
		oauthVerifier: string
	}

	export interface IResponseBody extends IApiResponseBody {
		accessToken: string
		accessTokenSecret: string
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}



/** Get Twitter Auth Url */
export namespace GetTwitterAuthUrl {
	export interface IPathParams {}

	export const path = () => `/api/1.0/meemid/twitter/request-url`

	export const method = HttpMethod.Get

	export interface IQueryParams {}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {
		url: string
		oauthToken: string
		oauthTokenSecret: string
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}



/** Get whitelisted NFT contracts */
export namespace GetWhitelist {
	export interface IPathParams {}

	export const path = () => `/api/1.0/whitelist`

	export const method = HttpMethod.Get

	export interface IQueryParams {}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {
		whitelist: {
			[contractAddress: string]: IWhitelistItem
		}
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}



/** Get Meem tokenIds of wNFTs */
export namespace GetWrappedTokens {
	export interface IPathParams {}

	export const path = () => `/api/1.0/meems/getWrappedTokens`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** Array of nfts to check */
		nfts: {
			/** The chain where the original NFT lives */
			chain: Chain
			/** The original NFT contract address */
			contractAddress: string
			/** The original NFT tokenId. Bignumberish */
			tokenId: string
		}[]
	}

	export interface IResponseBody extends IApiResponseBody {
		/** The wrapped tokens */
		wrappedTokens: {
			chain: Chain
			contractAddress: string
			tokenId: string
			/** The hex string of the wrapped token id */
			wrappedTokenId: string
		}[]
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}



export namespace Login {
	export interface IPathParams {}

	export const path = () => `/api/1.0/login`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** Login w/ wallet. Both address and signature must be provided */
		address?: string
		/** Login w/ wallet. Both address and signature must be provided */
		signature?: string

		/** Login twitter access token */
		twitterAccessToken?: string
		twitterAccessSecret?: string
	}

	export interface IResponseBody extends IApiResponseBody {
		/** The MeemId */
		meemId: IMeemId
		/** JWT that can be used for future authentication */
		jwt: string
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}



/** Mint a new Meem */
export namespace MintMeem {
	export interface IPathParams {}

	export const path = () => `/api/1.0/meems/mint`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** Optional name of the Meem to be stored in the Meem metadata */
		name?: string

		/** Optional description of the Meem to be stored in the Meem metadata */
		description?: string

		/** The contract address of the original NFT that is being minted as a Meem */
		tokenAddress: string

		/** The tokenId of the original NFT */
		tokenId: number

		/** The chain where the original NFT lives */
		chain: Chain

		/** Base64 image string to use for the minted meem image */
		base64Image?: string

		/** The address of the original NFT owner. Also where the Meem will be minted to. */
		accountAddress: string

		properties?: Partial<IMeemProperties>

		childProperties?: Partial<IMeemProperties>
	}

	export interface IResponseBody extends IApiResponseBody {
		// transactionHash: string
		// tokenId: number
		status: 'success'
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}



/** Get Meem */
export namespace SearchMeemIds {
	export interface IPathParams {}

	export const path = () => `/api/1.0/meemids/search`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		accountAddress?: string
	}

	export interface IResponseBody extends IApiResponseBody {
		meemIds: IMeemId[]
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}



/** Update user MeemPass */
export namespace UpdateMeemPass {
	export interface IPathParams {}

	export const path = () => `/api/1.0/me/meemPass`

	export const method = HttpMethod.Patch

	export interface IQueryParams {}

	export interface IRequestBody {
		hasAppliedTwitter: boolean
	}

	export interface IResponseBody extends IApiResponseBody {
		status: 'success'
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}

}
export enum MeemEvent {

			Err = 'err',
MeemIdUpdated = 'meemIdUpdated',
MeemMinted = 'meemMinted',
Subscribe = 'subscribe',
SubscribeAck = 'subscribeAck',
Unsubscribe = 'unsubscribe',
UnubscribeAck = 'unubscribeAck',
		
}
export namespace Events {

export namespace Err {
export const eventName = MeemEvent.Err
 
	export const eventSource = EventSource.Server

	export interface ISubscribePayload {}

	export interface IEventPayload extends Record<string, any> {}
}



export namespace MeemIdUpdated {
export const eventName = MeemEvent.MeemIdUpdated
 
	export const eventSource = EventSource.Server

	export interface ISubscribePayload {}

	export interface IEventPayload {
		meemId: IMeemId
		jwt: string
	}
}



export namespace MeemMinted {
export const eventName = MeemEvent.MeemMinted
 
	export const eventSource = EventSource.Server

	export interface ISubscribePayload {}

	export interface IEventPayload {
		/** The wallet address where the Meem was minted */
		toAddress: string

		/** The URI for the minted Meem */
		tokenURI: string

		/** The tokenId */
		tokenId: string

		/** The transaction hash */
		transactionHash: string
	}
}



export namespace Subscribe {
export const eventName = MeemEvent.Subscribe
 
	export const eventSource = EventSource.Client

	export interface IEventPayload {
		// @ts-ignore
		type: MeemEvent.Subscribe
		walletAddress?: string
		events: {
			key: string
			data?: Record<string, any>
		}[]
	}
}



export namespace SubscribeAck {
export const eventName = MeemEvent.SubscribeAck
 
	export const eventSource = EventSource.Server

	export interface ISubscribePayload {}

	export interface IEventPayload {
		// @ts-ignore
		events: SubscribeType[]
	}
}



export namespace Unsubscribe {
export const eventName = MeemEvent.Unsubscribe
 
	export const eventSource = EventSource.Client

	export interface IEventPayload {
		// @ts-ignore
		type: MeemEvent.Unsubscribe
		// @ts-ignore
		events: SubscribeType[]
	}
}



export namespace UnubscribeAck {
export const eventName = MeemEvent.UnubscribeAck
 
	export const eventSource = EventSource.Server

	export interface ISubscribePayload {}

	export interface IEventPayload {
		// @ts-ignore
		events: SubscribeType[]
	}
}

}

export type SubscribeType=(Events.Err.ISubscribePayload & { type: MeemEvent.Err }) | (Events.MeemIdUpdated.ISubscribePayload & { type: MeemEvent.MeemIdUpdated }) | (Events.MeemMinted.ISubscribePayload & { type: MeemEvent.MeemMinted }) | (Events.SubscribeAck.ISubscribePayload & { type: MeemEvent.SubscribeAck }) | (Events.UnubscribeAck.ISubscribePayload & { type: MeemEvent.UnubscribeAck })

export type EventListener=({
						eventName: MeemEvent.Err,
						handler: (options: {detail: Events.Err.IEventPayload}) => void
					}) | ({
						eventName: MeemEvent.MeemIdUpdated,
						handler: (options: {detail: Events.MeemIdUpdated.IEventPayload}) => void
					}) | ({
						eventName: MeemEvent.MeemMinted,
						handler: (options: {detail: Events.MeemMinted.IEventPayload}) => void
					}) | ({
						eventName: MeemEvent.SubscribeAck,
						handler: (options: {detail: Events.SubscribeAck.IEventPayload}) => void
					}) | ({
						eventName: MeemEvent.UnubscribeAck,
						handler: (options: {detail: Events.UnubscribeAck.IEventPayload}) => void
					})}