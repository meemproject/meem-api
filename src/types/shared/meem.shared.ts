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
