import { IError, HttpMethod, IApiResponseBody } from '../../api.shared'

/** Remove a user identity integration from the current user identity */
export namespace DetachUserIdentity {
	export interface IPathParams {
		integrationId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/me/integrations/${options.integrationId}`

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
 * 	@api [delete] /me/integrations/{integrationId}
 * 	security:
 * 		- jwtAuth: []
 * 	summary: "Remove a user identity integration from the current user identity"
 * 	parameters:
 * 		- (path) integrationId* {string} The user identity integration id to remove
 * 	responses:
 * 		"200":
 * 			description: "Returns 'success' if user identity integration was removed"
 * 			content:
 * 				application/json:
 * 					schema:
 * 						$ref: '#/components/schemas/DefaultStatusResponseBody'
 **/
