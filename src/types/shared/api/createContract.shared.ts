import { IError, HttpMethod, IApiResponseBody } from '../api.shared'
import {
	Chain,
	IMeemPermission,
	IMeemSplit,
	IMeemProperties,
	ContractType
} from '../meem.shared'

export namespace CreateContract {
	export interface IPathParams {}

	export const path = () => `/api/1.0/contracts`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		name: string
		description: string
		contractType: ContractType
		functionSelectors: string[]
		abi: any[]
		bytecode: string
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
