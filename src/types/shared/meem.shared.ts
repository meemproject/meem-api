export enum License {
	Cc0 = 'cc0',
	Unknown = 'unknown'
}

export interface IWhitelist {
	[contractAddress: string]: IWhitelistItem
}

export interface IWhitelistItem {
	/** The NFT name */
	name: string

	/** The name of the original NFT creator */
	creator: string

	/** The license */
	license: License

	/** Link to the terms and conditions */
	terms: string

	/** Link to the NFT website */
	website: string
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
	switch (chain) {
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
