import { IError, HttpMethod, IApiResponseBody } from '../../api.shared'
import {
	IMeemMetadataLike,
	IMeemPermission,
	IMeemSplit
} from '../../meem.shared'

/** Create Meem Image */
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

		/** Whether the max supply is locked */
		isMaxSupplyLocked?: boolean

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

		/** If true, will mint a token to the admin wallet addresses and any addresses in the members parameter  */
		shouldMintTokens?: boolean

		/** Additional non-admin member addresses that will receive tokens if shouldMintTokens is true */
		members?: string[]

		/** Token metadata to use if shouldMintTokens is true */
		tokenMetadata?: IMeemMetadataLike
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
