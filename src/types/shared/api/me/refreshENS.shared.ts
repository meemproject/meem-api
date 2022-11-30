import { IError, HttpMethod, IApiResponseBody } from '../../api.shared'
import { IMeemId } from '../../meem.shared'

/** Refresh the ENS name for the current user's wallet address */
export namespace RefreshENS {
	export interface IPathParams {}

	export const path = () => `/api/1.0/me/refreshENS`

	export const method = HttpMethod.Get

	export interface IQueryParams {}

	export interface IRequestBody {}

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

/**
 * 	@api [get] /me/refreshENS
 * 	security:
 * 		- jwtAuth: []
 * 	summary: "Refresh the ENS name for the current user's wallet address"
 * 	responses:
 * 		"200":
 * 			description: "Returns 'success' if ENS was updated"
 * 			content:
 * 				application/json:
 * 					schema:
 * 						$ref: '#/components/schemas/DefaultStatusResponseBody'
 **/
