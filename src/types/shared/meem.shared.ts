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

export enum Chain {
	Ethereum,
	Polygon,
	Cardano,
	Solana
}

export enum PermissionType {
	Copy,
	Remix,
	Read
}

export enum Permission {
	Owner,
	Anyone,
	Addresses,
	Holders
}

export enum PropertyType {
	Meem,
	Child
}

export enum NetworkChainId {
	Mainnet = 1,
	Rinkeby = 4,
	Polygon = 137,
	Mumbai = 80001
}

export enum NetworkName {
	Mainnet = 'homestead',
	Rinkeby = 'rinkeby',
	Polygon = 'matic',
	Mumbai = 'mumbai'
}

export interface IMeemSplit {
	toAddress: string
	amount: number
	lockedBy?: string
}

export interface IMeemMetadata {
	name: string
	description: string
	external_url: string
	image: string
	image_original_url: string
	attributes: any[]
	meem_properties: {
		generation: number
		root_token_uri: string
		root_token_address: string
		root_token_id: string | null
		parent_token_address: string | null
		parent_token_id: string | null
		attributes: any[]
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
	owner: string
	chain: Chain
	parent: string
	uparentTokenId: number
	root: string
	urootTokenId: number
	properties: IMeemProperties
	childProperties: IMeemProperties
}

export interface IERC721Metadata {
	name?: string
	image: string
	description?: string
}
export interface MeemPermissions {
	copyPermissions: [
		{
			permission: number
			addresses: string[]
			numTokens: number
			lockedBy: string
		}
	]
	remixPermissions: [
		{
			permission: number
			addresses: string[]
			numTokens: number
			lockedBy: string
		}
	]
	readPermissions: [
		{
			permission: number
			addresses: string[]
			numTokens: number
			lockedBy: string
		}
	]
	copyPermissionsLockedBy: string
	remixPermissionsLockedBy: string
	readPermissionsLockedBy: string
	splits: IMeemSplit[]
	splitsLockedBy: string
	totalCopies: number
	totalCopiesLockedBy: string
}
