import { IError, HttpMethod, IApiResponseBody } from '../api.shared'
import { IMeemMetadataLike } from '../meem.shared'

export namespace BulkMint {
	export interface IPathParams {
		/** The meem pass id to fetch */
		meemContractId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/meemContracts/${options.meemContractId}/bulkMint`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		tokens: {
			/** Metadata object to be used for the minted Meem */
			metadata?: IMeemMetadataLike

			/** The address where the Meem will be minted to. */
			to: string
		}[]
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