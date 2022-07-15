import { IError, HttpMethod, IApiResponseBody } from '../api.shared'

export namespace UpdateMeemContract {
	export interface IPathParams {
		/** The meem pass id to fetch */
		meemContractId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/meemContracts/${options.meemContractId}`

	export const method = HttpMethod.Patch

	export interface IQueryParams {}

	export interface IRequestBody {
		/** New slug */
		slug: string
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