import { MeemAPI } from '../../meem.generated'
import { IError, HttpMethod, IApiResponseBody } from '../api.shared'

/** Create Meem Image */
export namespace CreateMeemContract {
	export interface IPathParams {}

	export const path = () => `/meemContracts`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		name: string

		/** JSON (or stringified) metadata object to be used for the minted Meem */
		metadata: MeemAPI.IMeemContractMetadata

		admins: string[]
	}

	export interface IResponseBody extends IApiResponseBody {
		address: string
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}
