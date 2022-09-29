import { IError, HttpMethod, IApiResponseBody } from '../api.shared'

export namespace JoinGuild {
	export interface IPathParams {
		/** The MeemContract id */
		meemContractId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/meemContracts/${options.meemContractId}/joinGuild`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
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
		sig: string
		mintToken?: boolean
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
