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

export interface IApiPaginatedResponseBody extends IApiResponseBody {
	totalItems: number
	itemsPerPage: number
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

export interface IRequestPaginated {
	/** The current page to fetch. Page starts at 0 index */
	page?: number

	/** The number of records to fetch */
	limit?: number
}


export enum License {
	Cc0 = 'cc0',
	Unknown = 'unknown'
}

export enum MeemMetadataStorageProvider {
	Git = 'git',
	Ipfs = 'ipfs'
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

/** The Meem type */
export enum MeemType {
	Original,
	Copy,
	Remix,
	Wrapped
}

/** The permission corresponding to the smart contract */
export enum Permission {
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
	Mumbai = 'mumbai',
	Hardhat = 'hardhat'
}

export enum UriSource {
	TokenUri,
	Data
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

		case 99:
			return NetworkName.Hardhat

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

		case NetworkName.Hardhat:
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
export interface IMeemMetadataLike {
	meem_metadata_type: string
	meem_metadata_version: string
	[key: string]: any
}

export enum OpenSeaDisplayType {
	Number = 'number',
	BoostNumber = 'boost_number',
	BoostPercentage = 'boost_percentage'
}

export interface IOpenseaStringTrait {
	trait_type?: string
	value: string
}

/**
 * For numeric traits, OpenSea currently supports three different options, number (lower right in the image below), boost_percentage (lower left in the image above), and boost_number (similar to boost_percentage but doesn't show a percent sign). If you pass in a value that's a number and you don't set a display_type, the trait will appear in the Rankings section (top right in the image above).
 *
 * Adding an optional max_value sets a ceiling for a numerical trait's possible values. It defaults to the maximum that OpenSea has seen so far on the assets on your contract. If you set a max_value, make sure not to pass in a higher value.
 * */
export interface IOpenseaNumericTrait {
	display_type?: OpenSeaDisplayType
	trait_type?: string
	value: number
	max_value?: number
}

/** OpenSea also supports a date display_type. Traits of this type will appear in the right column near "Rankings" and "Stats." Pass in a unix timestamp as the value. */
export interface IOpenseaDateTrait {
	display_type: 'date'
	trait_type: string
	value: number
}

export interface IEnjinProperties {
	[propertyName: string]:
		| string
		| {
				name: string
				value: string | number | string[] | number[]
				[additionalProperties: string]:
					| string
					| number
					| string[]
					| number[]
					| Record<string, any>
		  }
}

/** Based on Opensea metadata standards: https://docs.opensea.io/docs/metadata-standards */
// export interface ICreateMeemMetadata {
// 	/** Name of the item. */
// 	name: string

// 	/** A human readable description of the item. Markdown is supported. */
// 	description: string

// 	/** Background color of the item. Must be a six-character hexadecimal without a pre-pended #. */
// 	background_color?: string

// 	/** An external URL */
// 	external_url?: string

// 	/**
// 	 * A URL to a multi-media attachment for the item. The file extensions GLTF, GLB, WEBM, MP4, M4V, OGV, and OGG are supported, along with the audio-only extensions MP3, WAV, and OGA.
// 	 *
// 	 * Animation_url also supports HTML pages, allowing you to build rich experiences and interactive NFTs using JavaScript canvas, WebGL, and more. Scripts and relative paths within the HTML page are now supported. However, access to browser extensions is not supported. */
// 	animation_url?: string

// 	/** A URL to a YouTube video. */
// 	youtube_url?: string

// 	/** Opensea metadata standard attributes */
// 	attributes?: (
// 		| IOpenseaStringTrait
// 		| IOpenseaNumericTrait
// 		| IOpenseaDateTrait
// 	)[]

// 	properties?: IEnjinProperties

// 	generation?: number

// 	/** UUID to associate w/ this Meem */
// 	meem_id?: string

// 	/** Additional meem properties. For trusted minters only. */
// 	meem_properties?: IMeemMetadataLikeProperties

// 	/** Extension properties. For trusted minters only. */
// 	extension_properties?: Record<string, any>
// }

export interface IMeemPermission {
	permission: Permission
	addresses: string[]
	/** BigNumber hex string */
	numTokens: string
	// lockedBy: string
	costWei: string
	mintStartTimestamp: string
	mintEndTimestamp: string
	merkleRoot: string
}

export interface IMeemProperties {
	/** BigNumber hex string */
	totalCopies: string
	totalCopiesLockedBy: string
	totalRemixes: string
	totalRemixesLockedBy: string
	/** BigNumber hex string */
	copiesPerWallet: string
	copiesPerWalletLockedBy: string
	remixesPerWallet: string
	remixesPerWalletLockedBy: string
	copyPermissions: IMeemPermission[]
	remixPermissions: IMeemPermission[]
	readPermissions: IMeemPermission[]
	copyPermissionsLockedBy: string
	remixPermissionsLockedBy: string
	readPermissionsLockedBy: string
	splits: IMeemSplit[]
	splitsLockedBy: string
	isTransferrable: boolean
	isTransferrableLockedBy: string
	mintStartAt: number
	mintEndAt: number
	mintDatesLockedBy: string
	transferLockupUntil: number
	transferLockupUntilLockedBy: string
}

export interface IAgreementBaseProperties {
	/** BigNumber hex string */
	totalOriginalsSupply: string
	totalOriginalsSupplyLockedBy: string
	mintPermissions: IMeemPermission[]
	mintPermissionsLockedBy: string
	splits: IMeemSplit[]
	splitsLockedBy: string
	/** BigNumber hex string */
	originalsPerWallet: string
	originalsPerWalletLockedBy: string
	isTransferrable: boolean
	isTransferrableLockedBy: string
	mintStartAt: number
	mintEndAt: number
	mintDatesLockedBy: string
	transferLockupUntil: number
	transferLockupUntilLockedBy: string
}

export interface IAgreementInitParams {
	symbol?: string
	name: string
	contractURI: string
	admins: string[]
	minters: string[]
	maxSupply: string
	isMaxSupplyLocked: boolean
	mintPermissions: IMeemPermission[]
	splits: IMeemSplit[]
	isTransferLocked: boolean
}

export interface IMeem {
	tokenId: string
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
	/** Will be a non-zero address if locked */
	uriLockedBy: string
	uriSource: UriSource
	meemType: MeemType
	mintedBy: string
	reactionTypes: string[]
}

export interface IReaction {
	/** Address that reacted */
	address: string

	/** Type of reaction */
	reaction: string

	/** Unix timestamp of when the reaction occurred */
	reactedAt: number

	/** The associated MeemIdentification if the user has a MeemID */
	MeemIdentificationId: string | null
}

export interface IMetadataMeem extends IMeem {
	reactionCounts: { [reaction: string]: number }
	numCopies: number
	numRemixes: number
	addressReactions?: IReaction[]
	metadata: IMeemMetadataLike
	defaultTwitterUser?: {
		id: string
		username: string
		displayName: string
		profileImageUrl: string | null
	}
}

export interface IERC721Metadata {
	[key: string]: any
}

// TODO: Define metadata types for extensions (e.g. type: APP, LINK)
export interface IAgreementExtensionMetadata {
	externalUrl?: string
	[key: string]: any
}

// TODO: Define metadata types for extensions (e.g. type: APP, LINK)
export interface IAgreementRoleExtensionMetadata {
	[key: string]: any
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

	/** The default twitter id to use for this MeemId */
	defaultTwitter: string

	/** The default wallet to use for this MeemId */
	defaultWallet: string

	/** Whether the user has gone through the onboarding process */
	hasOnboarded: boolean

	meemPass: {
		twitter: {
			hasApplied: boolean
			isWhitelisted: boolean
			tweetsPerDayQuota: number
		}
		isAdmin: boolean
	}
}

export enum IntegrationVisibility {
	/** Anyone can view the integration */
	Anyone = 'anyone',

	/** Users that are members of the same agreement */
	MutualClubMembers = 'mutual-agreement-members',

	/** Private. Only the current user can view */
	JustMe = 'just-me'
}

export interface ITransfer {
	from: string
	to: string
	transactionHash: string
	timestamp: number
}

export interface ICollectorResult {
	owner: string
	edition: number
	tokenId: string
	twitter?: {
		id: string
		username: string
		displayName: string
		profileImageUrl: string | null
	}
}

export interface IClipping {
	/** The wallet address that clipped */
	address: string
	/** Whether the clipper has a MeemId */
	hasMeemId: boolean
	/** Timestamp of when the item was clipped */
	clippedAt: number
	/** The Meem tokenId that was clipped */
	tokenId: string
}

/** Includes full Meem metadata */
export interface IClippingExtended extends IClipping {
	meem?: IMetadataMeem
}

export enum SortOrder {
	Asc = 'asc',
	Desc = 'desc'
}

export const defaultReactionTypes: string[] = ['upvote', 'downvote']

export enum ContractType {
	Regular = 'regular',
	DiamondProxy = 'diamondProxy',
	DiamondFacet = 'diamondFacet'
}

export interface IMeemUser {
	id: string
	displayName: string
	profilePicUrl: string
	DefaultWalletId: string
	Wallets: {
		id: string
		address: string
		ens: string
	}[]
	DefaultWallet: {
		id: string
		address: string
		ens: string
	}
}
export interface IAgreementRole {
	id: string
	name: string
	isAdminRole: boolean
	AgreementId: string
	members: IMeemUser[]
}

export interface IGuild {
	id: number
	name: string
	guildPlatforms: {
		id: number
		platformId: number
		platformGuildId: string
		platformGuildData?: any
		platformGuildName?: string
		invite?: string
	}[]
}
export interface IDiscordServer {
	id: string
	name: string
	icon: string
	owner: boolean
	guildData: {
		connectedGuildId: number
		serverIcon: string
		serverName: string
		serverId: string
		categories: {
			id: string
			name: string
			channels: {
				id: string
				name: string
				roles: any[]
			}[]
		}[]
		roles: {
			guild: string
			icon: string | null
			unicodeEmoji: string | null
			id: string
			name: string
		}[]
		isAdmin: boolean
		membersWithoutRole: number
		channels: {
			id: string
			name: string
		}[]
	}
}

export enum TransactionStatus {
	Pending = 'pending',
	Success = 'success',
	Failure = 'failure'
}

export enum QueueEvent {
	CallContract = 'callContract',
	DeployContract = 'deployContract',
	DiamondCut = 'diamondCut',
	CreateTablelandTable = 'createTablelandTable'
}

export enum StorageDataType {
	Integer = 'INTEGER',
	Text = 'TEXT'
}

export enum StorageType {
	Tableland = 'tableland'
}

export interface IExtensionStorageDefinition {
	tableland?: {
		tables?: {
			[tableName: string]: {
				[columnName: string]: StorageDataType
			}
		}
	}
}

export interface IAgreementExtensionMetadata extends IMeemMetadataLike {
	tableland?: {
		/** The extension table name */
		[extensionTableName: string]: {
			/** The tableland table name */
			tablelandTableName: string

			/** The tableland table id */
			tableId: string
		}
	}
}

export namespace v1 {

export namespace GenerateTypes {
	export interface IPathParams {}

	export const path = () => '/api/1.0/generateTypes'

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		abi?: Record<string, any>[]
		bundleId?: string
		name?: string
	}

	export interface IResponseBody extends IApiResponseBody {
		abi: Record<string, any>[]
		types: string
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



/** Generate nonce for client to sign and verify a user's wallet address */
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




/** Log in a user. */
export namespace Login {
	export interface IPathParams {}

	export const path = () => `/api/1.0/login`

	export const method = HttpMethod.Post

	export interface IQueryParams {}
	export interface IRequestBody {
		/** Login w/ access token provided by Auth0 magic link */
		accessToken?: string

		/** Login w/ wallet. Both address and signature must be provided */
		address?: string

		/** Login w/ wallet. Both address and signature must be provided */
		signature?: string

		/** Whether to connect the login method with the currently authenticated user */
		shouldConnectUser?: boolean
	}

	export interface IResponseBody extends IApiResponseBody {
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




export namespace AuthenticateWithDiscord {
	export interface IPathParams {}

	export const path = (options: IPathParams) => `/api/1.0/discord/authenticate`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** The Discord authentication code */
		authCode: string
		/** The Discord authentication callback url */
		redirectUri: string
	}

	export interface IResponseBody extends IApiResponseBody {
		user: { [key: string]: any }
		accessToken: string
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}



export namespace GetDiscordServers {
	export interface IPathParams {}

	export const path = (options: IPathParams) => `/api/1.0/discord/servers`

	export const method = HttpMethod.Get

	export interface IQueryParams {
		accessToken: string
	}

	export interface IRequestBody {
		/** The Discord authentication code */
		authCode: string
		/** The Discord authentication callback url */
		redirectUri: string
	}

	export interface IResponseBody extends IApiResponseBody {
		discordServers: IDiscordServer[]
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}



export namespace CreateBundle {
	export interface IPathParams {}

	export const path = () => `/api/1.0/epm/bundles`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		name: string
		description: string
		// contractIds: string[]
		contracts: {
			id: string
			functionSelectors: string[]
		}[]
	}

	export interface IResponseBody extends IApiResponseBody {
		bundleId: string
		types: string
		abi: Record<string, any>[]
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}



export namespace CreateContract {
	export interface IPathParams {}

	export const path = () => `/api/1.0/epm/contracts`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		name: string
		description: string
		contractType: ContractType
		abi: any[]
		bytecode: string
	}

	export interface IResponseBody extends IApiResponseBody {
		status: 'success'
		contractId: string
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}



export namespace TrackContractInstance {
	export interface IPathParams {}

	export const path = () => `/api/1.0/epm/contractInstances`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		address: string
		chainId: number
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



export namespace UntrackContractInstance {
	export interface IPathParams {
		contractInstanceId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/epm/contractInstances/${options.contractInstanceId}`

	export const method = HttpMethod.Delete

	export interface IQueryParams {}

	export interface IRequestBody {}

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



export namespace UpdateBundle {
	export interface IPathParams {
		bundleId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/epm/bundles/${options.bundleId}`

	export const method = HttpMethod.Put

	export interface IQueryParams {}

	export interface IRequestBody {
		name: string
		description: string
		contracts: {
			id: string
			functionSelectors: string[]
		}[]
	}

	export interface IResponseBody extends IApiResponseBody {
		types: string
		abi: Record<string, any>[]
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}



export namespace UpdateWalletContractInstance {
	export interface IPathParams {
		contractInstanceId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/epm/walletContractInstances/${options.contractInstanceId}`

	export const method = HttpMethod.Patch

	export interface IQueryParams {}

	export interface IRequestBody {
		note: string
		name: string
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



/** Bulk mint agreement role tokens */
export namespace BulkMintAgreementRoleTokens {
	export interface IPathParams {
		/** The id of the agreement */
		agreementId: string
		/** The id of the agreement role */
		agreementRoleId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/roles/${options.agreementRoleId}/bulkMint`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		tokens: {
			/** Token metadata */
			metadata?: IMeemMetadataLike

			/** The address where the token will be minted to. */
			to: string
		}[]
	}

	export interface IResponseBody extends IApiResponseBody {
		/** The Transaction id */
		txId: string
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}




/** Bulk mint agreement tokens */
export namespace BulkMintAgreementTokens {
	export interface IPathParams {
		/** The id of the agreement */
		agreementId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/bulkMint`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		tokens: {
			/** The token metadata */
			metadata?: IMeemMetadataLike

			/** The address where the token will be minted */
			to: string
		}[]
	}

	export interface IResponseBody extends IApiResponseBody {
		/** The Transaction id */
		txId: string
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}




/** Create an agreement contract. */
export namespace CreateAgreement {
	export interface IPathParams {}

	export const path = () => `/api/1.0/agreements`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** The name of the contract */
		name: string

		/** Agreement contract metadata */
		metadata: IMeemMetadataLike

		/** The contract chain id */
		chainId: number

		/** The max number of tokens */
		maxSupply: string

		/** Whether the max number of tokens is locked */
		isMaxSupplyLocked?: boolean

		/** The contract symbol. If omitted, will use slug generated from name. */
		symbol?: string

		/** Contract admin addresses */
		admins?: string[]

		/** Special minter permissions */
		minters?: string[]

		/** Minting permissions */
		mintPermissions?: Omit<IMeemPermission, 'merkleRoot'>[]

		/** Splits for minting / transfers */
		splits?: IMeemSplit[]

		/** Whether tokens can be transferred */
		isTransferLocked?: boolean

		/** If true, will mint a token to the admin wallet addresses and any addresses in the members parameter  */
		shouldMintTokens?: boolean

		/** Additional non-admin member addresses that will receive tokens if shouldMintTokens is true */
		members?: string[]

		/** Token metadata to use if shouldMintTokens is true */
		tokenMetadata?: IMeemMetadataLike
	}

	export interface IResponseBody extends IApiResponseBody {
		/** The Transaction id for deploying the contract. Transaction #1 */
		deployContractTxId: string

		/** The Transaction id for initializing the contract. Transaction #2 */
		cutTxId: string

		/** The Transaction id for minting tokens. Transaction #3 */
		mintTxId?: string
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}




/** Create an agreement extension */
export namespace CreateAgreementExtension {
	export interface IPathParams {
		/** The id of the agreement */
		agreementId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/extensions`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** The extension to enable */
		extensionId: string

		/** Optional metadata associated with this extension */
		metadata?: IMeemMetadataLike

		/** Optional external link associated with this extension */
		externalLink?: {
			/** Url for the link */
			url: string
			/** The link label */
			label?: string
		}

		/** Optional widget data associated with this extension */
		widget?: {
			/** Whether widget should be enabled */
			isEnabled: boolean
			/** Metadata associated with the extension widget */
			metadata?: IMeemMetadataLike
		}
	}

	export interface IResponseBody extends IApiResponseBody {
		status: 'success'

		/** The Transaction ids that must be completed as part of creating the extension. May be empty if no transactions are required. */
		txIds: string[]
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}




/** Create an agreement role contract */
export namespace CreateAgreementRole {
	export interface IPathParams {
		/** The id of the agreement */
		agreementId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/roles`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** The name of the agreement role contract */
		name: string

		/** Agreement role contract metadata */
		metadata: IMeemMetadataLike

		/** The max number of tokens */
		maxSupply: string

		/** Whether the max supply is locked */
		isMaxSupplyLocked?: boolean

		/** The contract symbol. If omitted, will use slug generated from name */
		symbol?: string

		/** Splits for minting / transfers */
		splits?: IMeemSplit[]

		/** Whether tokens can be transferred */
		isTransferLocked?: boolean

		/** If true, will mint a token to the admin wallet addresses and any addresses in the members parameter  */
		shouldMintTokens?: boolean

		/** Additional non-admin member addresses that will receive tokens if shouldMintTokens is true */
		members?: string[]

		/** Token metadata to use if shouldMintTokens is true */
		tokenMetadata?: IMeemMetadataLike
	}

	export interface IResponseBody extends IApiResponseBody {
		/** The Transaction id for deploying the contract. Transaction #1 */
		deployContractTxId: string

		/** The Transaction id for initializing the contract. Transaction #2 */
		cutTxId: string

		/** The Transaction id for minting tokens. Transaction #3 */
		mintTxId?: string
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}




/** Create an agreement safe */
export namespace CreateAgreementSafe {
	export interface IPathParams {
		agreementId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/safe`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** Addresses of the safe owners */
		safeOwners: string[]

		/** Chain id of the safe */
		chainId?: number

		/** The number of signatures required */
		threshold?: number
	}

	export interface IResponseBody extends IApiResponseBody {
		/** The Transaction id */
		txId: string
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}




/** Delete an agreement role contract */
export namespace DeleteAgreementRole {
	export interface IPathParams {
		/** The id of the agreement */
		agreementId: string
		/** The id of the agreement role */
		agreementRoleId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/roles/${options.agreementRoleId}`

	export const method = HttpMethod.Delete

	export interface IQueryParams {}

	export interface IRequestBody {}

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




/** Get an agreement role */
export namespace GetAgreementRole {
	export interface IPathParams {
		/** The id of the agreement */
		agreementId: string
		/** The id of the agreement role */
		agreementRoleId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/roles/${options.agreementRoleId}`

	export const method = HttpMethod.Get

	export interface IQueryParams {}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {
		role: IAgreementRole
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}




export namespace GetAgreementRoles {
	export interface IPathParams {
		/** The Agreement id to fetch roles of */
		agreementId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/roles`

	export const method = HttpMethod.Get

	export interface IQueryParams {}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {
		roles: any[]
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}




/** Get agreement minting proof */
export namespace GetMintingProof {
	export interface IPathParams {
		/** The id of the agreement */
		agreementId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/proof`

	export const method = HttpMethod.Get

	export interface IQueryParams {}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {
		proof: string[]
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}




/** Check if agreement slug is available */
export namespace IsSlugAvailable {
	export interface IPathParams {}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/isSlugAvailable`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** New agreement slug to check */
		slug: string

		/** The chain id of new agreement */
		chainId: number
	}

	export interface IResponseBody extends IApiResponseBody {
		isSlugAvailable: boolean
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}




/** Reinitialize an agreement contract */
export namespace ReInitializeAgreement {
	export interface IPathParams {
		/** The id of the agreement */
		agreementId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/reinitialize`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** The name of the contract */
		name?: string

		/** The max number of tokens */
		maxSupply?: string

		/** Agreement contract metadata */
		metadata?: IMeemMetadataLike

		/** The contract symbol. If omitted, will use slug generated from name */
		symbol?: string

		/** Contract admin addresses */
		admins?: string[]

		/** Special minter permissions */
		minters?: string[]

		/** Minting permissions */
		mintPermissions?: Omit<IMeemPermission, 'merkleRoot'>[]

		/** Splits for minting / transfers */
		splits?: IMeemSplit[]

		/** Whether tokens can be transferred */
		isTransferLocked?: boolean
	}

	export interface IResponseBody extends IApiResponseBody {
		/** The Transaction id for updating the contract */
		txId: string
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}




/** Reinitialize an agreement contract */
export namespace ReInitializeAgreementRole {
	export interface IPathParams {
		/** The id of the agreement */
		agreementId: string
		/** The id of the agreement role */
		agreementRoleId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/roles/${options.agreementRoleId}/reinitialize`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** The name of the contract */
		name?: string

		/** The max number of tokens */
		maxSupply?: string

		/** Agreement role contract metadata */
		metadata?: IMeemMetadataLike

		/** The contract symbol. If omitted, will use slug generated from name */
		symbol?: string

		/** Splits for minting / transfers */
		splits?: IMeemSplit[]

		/** Whether tokens can be transferred */
		isTransferLocked?: boolean
	}

	export interface IResponseBody extends IApiResponseBody {
		/** The Transaction id for updating the contract */
		txId: string
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}




/** Set the agreement admin role */
export namespace SetAgreementAdminRole {
	export interface IPathParams {
		agreementId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/setAdminRole`

	export const method = HttpMethod.Patch

	export interface IQueryParams {}

	export interface IRequestBody {
		/** The id of the agreement role to set as admin role */
		adminAgreementRoleId: string
	}

	export interface IResponseBody extends IApiResponseBody {
		/** The Transaction id */
		txId: string
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}
}




/** Set the agreement safe address */
export namespace SetAgreementSafeAddress {
	export interface IPathParams {
		agreementId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/safe`

	export const method = HttpMethod.Patch

	export interface IQueryParams {}

	export interface IRequestBody {
		/** The safe address */
		address: string

		/** Chain id of the safe */
		chainId?: number
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




/** Update an agreement extension */
export namespace UpdateAgreementExtension {
	export interface IPathParams {
		/** The id of the agreement */
		agreementId: string

		/** The agreement extension id */
		agreementExtensionId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/extensions/${options.agreementExtensionId}`

	export const method = HttpMethod.Put

	export interface IQueryParams {}

	export interface IRequestBody {
		/** Optional metadata associated with this extension */
		metadata?: IMeemMetadataLike
		/** Optional external link associated with this extension */
		externalLink?: {
			/** Url for the link */
			url: string
			/** The link label */
			label?: string
		}
		/** Optional widget data associated with this extension */
		widget?: {
			/** Whether widget should be enabled */
			isEnabled: boolean
			/** Metadata associated with the extension widget */
			metadata?: IMeemMetadataLike
		}
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




/** Update an agreement role */
export namespace UpdateAgreementRole {
	export interface DiscordRoleIntegrationData {
		discordServerId: string
		discordGatedChannels: string[]
		discordAccessToken: string
	}
	export interface IPathParams {
		/** The id of the agreement */
		agreementId: string
		/** The id of the agreement role */
		agreementRoleId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/roles/${options.agreementRoleId}`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** Name of the role */
		name?: string
		/** Array of ids for permissions */
		permissions?: string[]
		/** Wallet addresses of members */
		members?: string[]
		/** If the role is token-based, is the token transferrable to other wallets */
		isTokenTransferrable?: boolean
		/** Role integration data */
		roleIntegrationsData?: (
			| DiscordRoleIntegrationData
			| { [key: string]: any }
		)[]
	}

	export interface IResponseBody extends IApiResponseBody {
		/** The Transaction id for updating the contract */
		txId: string
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}



/** Upgrade an agreement contract */
export namespace UpgradeAgreement {
	export interface IPathParams {
		agreementId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/upgrade`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** Specify the bundle id to upgrade to. Defaults to latest Agreements bundle */
		bundleId?: string
	}

	export interface IResponseBody extends IApiResponseBody {
		/** The Transaction id */
		txId: string
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}




/** Upgrade an agreement role contract */
export namespace UpgradeAgreementRole {
	export interface IPathParams {
		/** The id of the agreement */
		agreementId: string
		/** The id of the agreement role */
		agreementRoleId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/roles/${options.agreementRoleId}/upgrade`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** Specify the bundle id to upgrade to. Defaults to latest Agreements bundle */
		bundleId?: string
	}

	export interface IResponseBody extends IApiResponseBody {
		/** The Transaction id */
		txId: string
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}




export namespace GetJoinGuildMessage {
	export interface IPathParams {
		/** The Agreement id */
		agreementId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/getJoinGuildMessage`

	export const method = HttpMethod.Get

	export interface IQueryParams {}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {
		message: string
		params: {
			chainId?: string
			msg: string
			method: number
			addr: string
			nonce: string
			hash?: string
			ts: string
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



export namespace JoinGuild {
	export interface IPathParams {
		/** The Agreement id */
		agreementId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/joinGuild`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		message: string
		params: {
			chainId?: string
			msg: string
			method: number
			addr: string
			nonce: string
			hash?: string
			ts: string
		}
		sig: string
		mintToken?: boolean
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



/** Create or update the current user */
export namespace CreateOrUpdateUser {
	export interface IPathParams {}

	export const path = () => `/api/1.0/me`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** Profile picture base64 string */
		profilePicBase64?: string
		/** Url to profile picture */
		// profilePicUrl?: string
		/** Display name of identity */
		displayName?: string
	}

	export interface IResponseBody extends IApiResponseBody {
		user: IMeemUser
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}




/** Remove a user identity integration from the current user identity */
export namespace DetachUserIdentity {
	export interface IPathParams {
		integrationId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/me/integrations/${options.integrationId}`

	export const method = HttpMethod.Delete

	export interface IQueryParams {}

	export interface IRequestBody {}

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




export namespace GetApiKey {
	export interface IPathParams {}

	export const path = () => `/api/1.0/me/apiKey`

	export const method = HttpMethod.Get

	export interface IQueryParams {}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {
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



/** Get the current authenticated user */
export namespace GetMe {
	export interface IPathParams {}

	export const path = () => `/api/1.0/me`

	export const method = HttpMethod.Get

	export interface IQueryParams {}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {
		/** The authenticated user's wallet id */
		walletId: string

		/** The authenticated user's wallet address */
		address: string

		/** The authenticated user */
		user: IMeemUser
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}




/** Refresh the ENS name for the current user's wallet address */
export namespace RefreshENS {
	export interface IPathParams {}

	export const path = () => `/api/1.0/me/refreshENS`

	export const method = HttpMethod.Get

	export interface IQueryParams {}

	export interface IRequestBody {}

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




/** Update current user identity */
export namespace UpdateUserIdentity {
	export interface IPathParams {
		/** The user identity integration id to connect or update */
		integrationId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/me/integrations/${options.integrationId}`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** Set the visibility type of the user identity integration */
		visibility?: IntegrationVisibility
		/** Metadata associated with this user identity integration */
		metadata?: { [key: string]: unknown }
	}

	export interface IResponseBody extends IApiResponseBody {
		userIdentity: any
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