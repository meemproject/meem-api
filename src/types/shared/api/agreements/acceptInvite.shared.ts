import { IError, HttpMethod, IApiResponseBody } from '../../api.shared'
import { IMeemMetadataLike } from '../../meem.shared'

export namespace AcceptAgreementInvite {
	export interface IPathParams {}

	export const path = () => `/api/1.0/acceptInvite`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		code: string
	}

	export interface IResponseBody extends IApiResponseBody {
		name: string
		agreementId: string
		slug: string
		agreementTokenId: string
		agreementRoleId?: string
		agreementRoleTokenId?: string
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}
