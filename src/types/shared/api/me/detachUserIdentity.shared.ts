import { IError, HttpMethod, IApiResponseBody } from '../../api.shared'

/** Remove a user identity from the current user */
export namespace DetachUserIdentity {
	export interface IPathParams {
		userIdentityId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/me/identity/${options.userIdentityId}`

	export const method = HttpMethod.Delete

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

/** === OpenAPI Definition === */

/**
 * 	@api [delete] /me/integrations/{userIdentityId}
 * 	security:
 * 		- jwtAuth: []
 * 	summary: "Remove a user identity from the current user"
 * 	parameters:
 * 		- (path) userIdentityId* {string} The user identity id to remove
 * 	responses:
 * 		"200":
 * 			description: "Returns 'success' if user identity was removed"
 * 			content:
 * 				application/json:
 * 					schema:
 * 						$ref: '#/components/schemas/DefaultStatusResponseBody'
 **/
