import { IError, HttpMethod, IApiResponseBody } from '../api.shared'

export namespace GetJoinGuildMessage {
	export interface IPathParams {
		/** The MeemContract id */
		meemContractId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/meemContracts/${options.meemContractId}/getJoinGuildMessage`

	export const method = HttpMethod.Get

	export interface IQueryParams {}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {
		message: string
		params: {
			chainId?: string
			msg: string
			method: number
			addr: string
			nonce: string
			hash?: string
			ts: string
		}
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}