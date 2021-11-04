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

export interface IMeemSplit {
	toAddress: string
	amount: number
	lockedBy?: string
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
