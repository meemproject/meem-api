import { IError, HttpMethod, IApiResponseBody } from '../api.shared'
import {
	IMeemProperties,
	IAgreementBaseProperties,
	IMeemContractMetadataLike,
	ITokenMetadataLike,
	IAgreementInitParams,
	IMeemPermission,
	IMeemSplit
} from '../meem.shared'

/** Create Meem Image */
export namespace ReInitializeAgreement {
	export interface IPathParams {
		agreementId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}`

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
