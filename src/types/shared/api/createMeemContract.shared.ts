import { IError, HttpMethod, IApiResponseBody } from '../api.shared'
import {
	IMeemProperties,
	IMeemContractMetadata,
	IMeemContractBaseProperties,
	IMeemContractInitParams
} from '../meem.shared'

/** Create Meem Image */
export namespace CreateMeemContract {
	export interface IPathParams {}

	export const path = () => `/api/1.0/meemContracts`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** Contract metadata */
		metadata: IMeemContractMetadata

		/** Contract base properties */
		contractParams: IMeemContractInitParams

		/** If true, will mint a token to the admin wallet addresses  */
		shouldMintAdminTokens?: boolean

		/** The owner of the contract can upgrade */
		contractOwnerAddress?: string
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
