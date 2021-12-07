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
		root_token_uri: string
		root_token_address: string
		root_token_id: number | null
		root_token_metadata: any
		parent_token_uri: any | null
		parent_token_address: string | null
		parent_token_id: number | null
		parent_token_metadata: any | null
	}
}

export interface IMeemPermission {
	permission: Permission
	addresses: string[]
	numTokens: number
	lockedBy: string
}

export interface IMeemProperties {
	totalChildren: number
	totalChildrenLockedBy: string
	childrenPerWallet: number
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
	parentTokenId: number
	generation: number
	rootChain: Chain
	root: string
	rootTokenId: number
	properties: IMeemProperties
	childProperties: IMeemProperties
	/** Unix timestamp of when the Meem was minted */
	mintedAt: number
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

export enum MeemIdAccountType {
	Twitter = 'twitter'
}

export interface IMeemIdAccount {
	type: MeemIdAccountType
	id: string
	username?: string
	name?: string
}

export interface IMeemId {
	accountAddress: string
	id: string
	verifiedAccounts: IMeemIdAccount[]
}
