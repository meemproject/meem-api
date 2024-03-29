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
	meem_metadata_type?: string
	meem_metadata_version?: string
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
export interface IAgreementRoleExtensionMetadata {
	[key: string]: any
}

export enum AgreementExtensionVisibility {
	/** Anyone can view the integration */
	Anyone = 'anyone',

	/** Users that are token-holders of the same agreement */
	TokenHolders = 'token-holders'
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

export enum IUserIdentityVisibility {
	/** Anyone can view the integration */
	Anyone = 'anyone',

	/** Users that are token-holders of the same agreement */
	TokenHolders = 'token-holders',

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
	CreateTablelandTable = 'createTablelandTable',
	DeploySafe = 'deploySafe'
}

export enum StorageDataType {
	Integer = 'INTEGER',
	Text = 'TEXT'
}

export enum StorageType {
	Tableland = 'tableland'
}

export enum ExtensionCategory {
	Basics = 'basics',
	Communications = 'communications',
	Commerce = 'commerce',
	Finance = 'finance',
	Organization = 'organization',
	Publishing = 'publishing',
	RoleManagement = 'roleManagement',
	SocialMedia = 'socialMedia'
}

export enum ExtensionCapability {
	Link = 'link',
	DApp = 'dapp',
	Auth = 'auth',
	Widget = 'widget'
}

export interface IExtensionStorageDefinition {
	tableland?: {
		tables?: [
			{
				name: string
				schema: {
					[columnName: string]: StorageDataType
				}
				permissions: {
					adminRoleContract: string
					canInsert: boolean
					insertRoleContract: string
					canUpdate: boolean
					updateRoleContract: string
					canDelete: boolean
					deleteRoleContract: string
					updateableColumns: string[]
				}
			}
		]
	}
}

export interface IExtensionWidgetDefinition {
	widgets: {
		metadata: Record<string, any>
		visibility: AgreementExtensionVisibility
	}[]
}

export interface IAgreementExtensionMetadata {
	externalUrl?: string
	tableland?: {
		/** The extension table name */
		[extensionTableName: string]: {
			/** The tableland table name */
			tablelandTableName: string

			/** The tableland table id */
			tableId: string
		}
	}
	transactions?: {
		/** The Transaction id */
		TransactionId: string
		status: TransactionStatus
	}[]
	[key: string]: any
}
