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

export interface ITokenMetadataProperties {
	root_token_uri?: string | null
	root_token_address?: string | null
	root_token_id?: string | null
	root_token_metadata?: Record<string, any> | null
	parent_token_uri?: string | null
	parent_token_address?: string | null
	parent_token_id?: string | null
	parent_token_metadata?: Record<string, any> | null
}

export interface IAgreementAssociation {
	meem_contract_type: string
	address: string
	tokenIds?: string[]
}
export interface ITokenMetadata {
	name: string
	description: string
	external_url: string
	image: string
	image_original?: string
	meem_id?: string
	meem_properties?: ITokenMetadataProperties
	extension_properties?: Record<string, any>
	associations?: IAgreementAssociation[]
}

export interface ITokenMetadataLike {
	meem_metadata_version: string
	[key: string]: any
}
export interface IMeemContractMetadataLike {
	meem_contract_type: string
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
export interface ICreateMeemMetadata {
	/** Name of the item. */
	name: string

	/** A human readable description of the item. Markdown is supported. */
	description: string

	/** Background color of the item. Must be a six-character hexadecimal without a pre-pended #. */
	background_color?: string

	/** An external URL */
	external_url?: string

	/**
	 * A URL to a multi-media attachment for the item. The file extensions GLTF, GLB, WEBM, MP4, M4V, OGV, and OGG are supported, along with the audio-only extensions MP3, WAV, and OGA.
	 *
	 * Animation_url also supports HTML pages, allowing you to build rich experiences and interactive NFTs using JavaScript canvas, WebGL, and more. Scripts and relative paths within the HTML page are now supported. However, access to browser extensions is not supported. */
	animation_url?: string

	/** A URL to a YouTube video. */
	youtube_url?: string

	/** Opensea metadata standard attributes */
	attributes?: (
		| IOpenseaStringTrait
		| IOpenseaNumericTrait
		| IOpenseaDateTrait
	)[]

	properties?: IEnjinProperties

	generation?: number

	/** UUID to associate w/ this Meem */
	meem_id?: string

	/** Additional meem properties. For trusted minters only. */
	meem_properties?: ITokenMetadataProperties

	/** Extension properties. For trusted minters only. */
	extension_properties?: Record<string, any>
}

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
	metadata: ITokenMetadata
	defaultTwitterUser?: {
		id: string
		username: string
		displayName: string
		profileImageUrl: string | null
	}
}

export interface IERC721Metadata {
	name?: string
	image?: string
	description?: string
}

// TODO: Define metadata types for extensions (e.g. type: APP, LINK)
export interface IAgreementExtensionMetadata {
	externalUrl?: string
	[key: string]: unknown
}

// TODO: Define metadata types for extensions (e.g. type: APP, LINK)
export interface IAgreementRoleExtensionMetadata {
	[key: string]: unknown
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

export enum IMeemIdIntegrationVisibility {
	Anyone = 'anyone',
	MutualClubMembers = 'mutual-club-members',
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

export interface IMeemIdentity {
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
	guildRoleId?: number
	isAdminRole: boolean
	AgreementId: string
	AgreementGuildId?: string
	permissions: string[]
	guildRole: {
		id: number
		name: string
		description: string
		imageUrl: string | null
		members: string[]
		rolePlatforms: {
			guildPlatform: {
				platformGuildId: string
				invite?: string
				platform: {
					id: number
					name: 'DISCORD'
				}
			}
		}[]
	}
	memberMeemIds: IMeemIdentity[]
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


export interface TweetMeemExtensionProperties {
	meem_tweets_extension: {
		tweet: {
			text: string
			userId: string
			tweetId: string
			entities?: any
			username: string
			createdAt: string
			updatedAt: string
			userProfileImageUrl: string
		}
		prompt?: {
			body: string
			startAt: string
			tweetId: string
		}
	}
}

export namespace v1 {

export namespace AttachIdentity {
	export interface IPathParams {}

	export const path = () => `/api/1.0/attachIdentity`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** Login w/ access token provided by Auth0 magic link */
		accessToken?: string
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



export namespace BulkMintAgreementRoleTokens {
	export interface IPathParams {
		/** The id of the agreement to fetch */
		agreementId: string
		/** The id of the agreement role to fetch */
		agreementRoleId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/roles/${options.agreementRoleId}/bulkMint`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		tokens: {
			/** Metadata object to be used for the minted Meem */
			metadata?: ITokenMetadataLike

			/** The address where the Meem will be minted to. */
			to: string
		}[]
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



export namespace BulkMintAgreementTokens {
	export interface IPathParams {
		/** The meem pass id to fetch */
		agreementId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/bulkMint`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		tokens: {
			/** Metadata object to be used for the minted Meem */
			metadata?: ITokenMetadataLike

			/** The address where the Meem will be minted to. */
			to: string
		}[]
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



export namespace CheckClippingStatus {
	export interface IPathParams {}

	export const path = () => `/api/1.0/clippings/status`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** Filter by address that clipped */
		address: string
		/** The tokenIds to check. Maximum 200 */
		tokenIds: string[]
	}

	export interface IResponseBody extends IApiResponseBody {
		/** Whether the token has been clipped */
		status: {
			[tokenId: string]: boolean
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



/** Claim an existing Meem */
export namespace ClaimMeem {
	export interface IPathParams {
		/** The meem pass id to fetch */
		tokenId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/meems/claim/${options.tokenId}`

	export const method = HttpMethod.Post

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



/** Create Meem Image */
export namespace CreateAgreement {
	export interface IPathParams {}

	export const path = () => `/api/1.0/agreements`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** Contract metadata */
		metadata: IMeemContractMetadataLike

		/** The chain id */
		chainId: number

		/** The symbol for the token. If omitted, will use a slug of the name */
		symbol?: string

		/** The name of the token */
		name: string

		/** Contract admins */
		admins?: string[]

		/** Special minter permissions */
		minters?: string[]

		/** The max number of tokens */
		maxSupply: string

		/** Whether the max supply is locked */
		isMaxSupplyLocked?: boolean

		/** Minting permissions */
		mintPermissions?: Omit<IMeemPermission, 'merkleRoot'>[]

		/** Splits for minting / transfers */
		splits?: IMeemSplit[]

		/** Whether tokens can be transferred */
		isTransferLocked?: boolean

		/** If true, will mint a token to the admin wallet addresses and any addresses in the members parameter  */
		shouldMintTokens?: boolean

		/** Members to mint tokens to */
		members?: string[]

		/** Token metadata */
		tokenMetadata?: ITokenMetadataLike
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



/** Create Meem Image */
export namespace CreateAgreementRole {
	export interface IPathParams {
		agreementId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/roles`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** Contract metadata */
		metadata: IMeemContractMetadataLike

		/** The chain id */
		chainId: number

		/** The symbol for the token. If omitted, will use a slug of the name */
		symbol?: string

		/** The name of the role */
		name: string

		/** Contract admins */
		admins?: string[]

		/** Special minter permissions */
		minters?: string[]

		/** The max number of tokens */
		maxSupply: string

		/** Whether the max supply is locked */
		isMaxSupplyLocked?: boolean

		/** Minting permissions */
		mintPermissions?: Omit<IMeemPermission, 'merkleRoot'>[]

		/** Splits for minting / transfers */
		splits?: IMeemSplit[]

		/** Whether tokens can be transferred */
		isTransferLocked?: boolean

		/** If true, will mint a token to the admin wallet addresses and any addresses in the members parameter  */
		shouldMintTokens?: boolean

		/** Members to mint tokens to */
		members?: string[]

		/** Token metadata */
		tokenMetadata?: ITokenMetadataLike
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



export namespace CreateBundle {
	export interface IPathParams {}

	export const path = () => `/api/1.0/bundles`

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



/** Create Meem Image */
export namespace CreateClubSafe {
	export interface IPathParams {
		agreementId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/safe`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** The owners of the safe */
		safeOwners: string[]

		chainId: number

		/** The number of signatures required */
		threshold?: number
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



export namespace CreateContract {
	export interface IPathParams {}

	export const path = () => `/api/1.0/contracts`

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



export namespace CreateOrUpdateAgreementExtension {
	export interface IPathParams {
		/** The meem contract id to fetch */
		agreementId: string
		/** The integration id to connect or update */
		integrationId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/integrations/${options.integrationId}`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** Is the integration enabled? */
		isEnabled?: boolean
		/** Is the integration publicly displayed on club */
		isPublic?: boolean
		/** Metadata associated with this integration */
		metadata?: MeemAPI.IAgreementExtensionMetadata
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



export namespace DeleteAgreementRole {
	export interface IPathParams {
		/** The meem contract id to fetch */
		agreementId: string
		/** The AgreementRole id to update */
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



export namespace GetAgreementGuild {
	export interface IPathParams {
		/** The Agreement id of the guild to fetch */
		agreementId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/guild`

	export const method = HttpMethod.Get

	export interface IQueryParams {}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {
		guild: IGuild | null
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}



export namespace GetAgreementRole {
	export interface IPathParams {
		/** The Agreement id to fetch roles of */
		agreementId: string
		/** The Agreement Role id to fetch roles of */
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



export namespace GetChildMeems {
	export interface IPathParams {
		/** The token id to fetch children of */
		tokenId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/meems/${options.tokenId}/children`

	export const method = HttpMethod.Get

	export interface IQueryParams extends IRequestPaginated {
		/** Filter by owner address */
		owner?: string

		/** Filter by MeemType */
		meemTypes?: MeemType[]

		/** Filter by minter */
		mintedBy?: string
	}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiPaginatedResponseBody {
		meems: IMetadataMeem[]
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}



/** Get Collectors */
export namespace GetCollectors {
	export interface IPathParams {
		/** The token id to fetch */
		tokenId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/meems/${options.tokenId}/collectors`

	export const method = HttpMethod.Get

	export interface IQueryParams extends IRequestPaginated {
		csv: boolean
	}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiPaginatedResponseBody {
		collectors: ICollectorResult[]
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



export namespace GetMe {
	export interface IPathParams {}

	export const path = () => `/api/1.0/me`

	export const method = HttpMethod.Get

	export interface IQueryParams {}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {
		walletId: string
		address: string
		meemIdentity: any
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
		meem: IMetadataMeem
		transfers: ITransfer[]
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}



export namespace GetMeemClippings {
	export interface IPathParams {}

	export const path = () => `/api/1.0/clippings`

	export const method = HttpMethod.Get

	export interface IQueryParams extends IRequestPaginated {
		/** Filter by address that clipped */
		address?: string
		/** Filter by tokenId */
		tokenId?: string

		/** Whether to include Meem metadata in the response */
		shouldIncludeMetadata?: 'true' | 'false'
	}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {
		clippings: IClippingExtended[]

		totalItems: number
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
	interface IMeemIdData extends IMeemId {
		defaultTwitterUser?: {
			id: string
			username: string
			displayName: string
			profileImageUrl: string | null
		}
	}

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
		meemId: IMeemIdData
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}



/** Get MeemPasses */
export namespace GetMeemPasses {
	export interface IPathParams {}

	export const path = () => `/api/1.0/meemPasses`

	export const method = HttpMethod.Get

	export interface IQueryParams extends IRequestPaginated {
		hideWhitelisted?: boolean
	}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiPaginatedResponseBody {
		meemPasses: any[]
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

	export const path = (options?: IPathParams) => `/api/1.0/meems`

	export const method = HttpMethod.Get

	export enum SortBy {
		MintedAt = 'mintedAt',
		TokenId = 'tokenId',
		Name = 'name',
		Meemtype = 'meemType',
		Owner = 'owner',
		Generation = 'generation',
		Parent = 'parent',
		Root = 'root',
		MintedBy = 'mintedBy',
		VerifiedBy = 'verifiedBy',
		Reaction = 'reaction'
	}

	export interface IQueryParams extends IRequestPaginated {
		/** Filter by owner address */
		owner?: string

		/** Filter by MeemType */
		meemTypes?: MeemType[]

		/** Filter by Root Token ID */
		rootTokenIds?: string[]

		/** Filter by Parent Token ID */
		parentTokenIds?: string[]

		/** Filter by minter */
		mintedBy?: string

		/** Search metadata by query string */
		q?: string

		sortBy?: SortBy

		sortOrder?: SortOrder

		/** The name of the reaction to sort by. Used when sortOrder === SortBy.Reaction */
		sortReaction?: string

		/** Include individual reactions from these wallets */
		withAddressReactions?: string[]
	}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiPaginatedResponseBody {
		meems: IMetadataMeem[]
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}



export namespace GetMintingProof {
	export interface IPathParams {
		/** The meem pass id to fetch */
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



export namespace GetUrlScreenshot {
	export interface IPathParams {}

	export const path = () => `/api/1.0/screenshotUrl`

	export const method = HttpMethod.Get

	export interface IQueryParams {
		url: string
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



export namespace GetUserAgreementRolesAccess {
	export interface IPathParams {
		/** The Agreement id */
		agreementId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/roles/access`

	export const method = HttpMethod.Get

	export interface IQueryParams {}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {
		hasRolesAccess: boolean
		roles: IAgreementRole[]
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



export namespace IsSlugAvailable {
	export interface IPathParams {}

	export const path = (options: IPathParams) => `/api/1.0/isSlugAvailable`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** New slug */
		slug: string

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



/** Mint a new (wrapped) Meem */
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



/** Mint a new (wrapped) Meem */
export namespace MintOriginalMeem {
	export interface IPathParams {}

	export const path = () => `/api/1.0/meems/mintOriginal`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** The address of the Meem contract to mint token */
		agreementAddress: string

		/** The chain id */
		chainId: number

		/** Metadata object to be used for the minted Meem */
		metadata?: ITokenMetadataLike

		/** The address where the Meem will be minted to. */
		to: string
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



/** Create Meem Image */
export namespace ReInitializeAgreement {
	export interface IPathParams {
		agreementId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/reinitialize`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** Contract metadata */
		metadata?: IMeemContractMetadataLike

		/** The symbol for the token. If omitted, will use a slug of the name */
		symbol?: string

		/** The name of the token */
		name?: string

		/** Contract admins */
		admins?: string[]

		/** Special minter permissions */
		minters?: string[]

		/** The max number of tokens */
		maxSupply?: string

		/** Minting permissions */
		mintPermissions?: IMeemPermission[]

		/** Splits for minting / transfers */
		splits?: IMeemSplit[]

		/** Whether tokens can be transferred */
		isTransferLocked?: boolean

		/** If true, will mint a token to the admin wallet addresses  */
		shouldMintTokens?: boolean

		/** Admin token metadata */
		tokenMetadata?: ITokenMetadataLike
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



export namespace SaveMetadata {
	export interface IPathParams {}

	export const path = () => `/images/1.0/metadata`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** JSON.stringify object of metadata conforming to ICreateMeemMetadata */
		metadata: string
	}

	export interface IResponseBody extends IApiResponseBody {
		metadata: ITokenMetadata
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



export namespace TrackContractInstance {
	export interface IPathParams {}

	export const path = () => `/api/1.0/contractInstances`

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
		`/api/1.0/contractInstances/${options.contractInstanceId}`

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



export namespace UpdateAgreementRole {
	export interface DiscordRoleIntegrationData {
		discordServerId: string
		discordGatedChannels: string[]
		discordAccessToken: string
	}
	export interface IPathParams {
		/** The meem contract id to fetch */
		agreementId: string
		/** The AgreementRole id to update */
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
		`/api/1.0/bundles/${options.bundleId}`

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
		`/api/1.0/walletContractInstances/${options.contractInstanceId}`

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



export namespace UpdateMeemId {
	export interface IPathParams {}

	export const path = () => `/api/1.0/meemId`

	export const method = HttpMethod.Patch

	export interface IQueryParams {}

	export interface IRequestBody {
		/** Wallet address to remove */
		addressToRemove?: string

		/** Twitter id to remove */
		twitterIdToRemove?: string
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



/** Update user MeemPass */
export namespace UpdateMeemPassById {
	export interface IPathParams {
		/** The meem pass id to fetch */
		meemPassId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/meemPass/${options.meemPassId}`

	export const method = HttpMethod.Patch

	export interface IQueryParams {}

	export interface IRequestBody {
		isWhitelisted: boolean
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



/** Create Meem Image */
export namespace UpgradeClub {
	export interface IPathParams {
		agreementId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/upgrade`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** Specify the bundle id to upgrade to. Defaults to latest Clubs bundle */
		bundleId?: string
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