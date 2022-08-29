import { IError, HttpMethod, IApiResponseBody } from '../api.shared'
import {
	IMeemProperties,
	IMeemContractBaseProperties,
	IMeemContractMetadataLike,
	IMeemMetadataLike,
	IMeemContractInitParams,
	IMeemPermission,
	IMeemSplit
} from '../meem.shared'

/** Create Meem Image */
export namespace CreateMeemContract {
	export interface IPathParams {}

	export const path = () => `/api/1.0/meemContracts`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** Contract metadata */
		metadata: IMeemContractMetadataLike

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

		/** If true, will mint a token to the admin wallet addresses  */
		shouldMintAdminTokens?: boolean

		/** Admin token metadata */
		adminTokenMetadata?: IMeemMetadataLike
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
