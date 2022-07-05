import { IError, HttpMethod, IApiResponseBody } from '../api.shared'

export namespace VerifyMeemContractTwitter {
	export interface IPathParams {}

	export const path = () =>
		`/api/1.0/integrations/twitter/verifyMeemContractTwitter`

	export const method = HttpMethod.Patch

	export interface IQueryParams {}

	export interface IRequestBody {
		/** Twitter username to verify and associate with MeemContracts */
		twitterUsername: string

		/** MeemContract ID */
		meemContractId: string
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
