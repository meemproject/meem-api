import { IError, HttpMethod, IApiResponseBody } from '../../api.shared'
import {
	Chain,
	IMeemPermission,
	IMeemSplit,
	IMeemProperties,
	ContractType
} from '../../meem.shared'

export namespace UpdateWalletContractInstance {
	export interface IPathParams {
		contractInstanceId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/epm/walletContractInstances/${options.contractInstanceId}`

	export const method = HttpMethod.Patch

	export interface IQueryParams {}

	export interface IRequestBody {
		note: string
		name: string
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
