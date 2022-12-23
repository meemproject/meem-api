import { IError, HttpMethod, IApiResponseBody } from '../../api.shared'
import { IAgreementRole } from '../../meem.shared'

/** Get an agreement role */
export namespace GetAgreementRole {
	export interface IPathParams {
		/** The id of the agreement */
		agreementId: string
		/** The id of the agreement role */
		agreementRoleId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/roles/${options.agreementRoleId}`

	export const method = HttpMethod.Get

	export interface IQueryParams {}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {
		role: IAgreementRole
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
 * 	@api [get] /agreements/{agreementId}/roles/{agreementRoleId}
 * 	security:
 * 		- jwtAuth: []
 * 	summary: "TODO: Get an agreement role"
 * 	description: "TODO: define the IAgreemeentRole role schema"
 * 	parameters:
 * 		- (path) agreementId* {string} The id of the agreement
 * 		- (path) agreementRoleId* {string} The id of the agreement role
 * 	responses:
 * 		"200":
 * 			description: "Returns the agreement role"
 * 			content:
 * 				application/json:
 * 					schema:
 * 						description: IAgreemeentRole
 * 						type: object
 **/
