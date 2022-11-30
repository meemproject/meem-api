import { IError, HttpMethod, IApiResponseBody } from '../../api.shared'

export namespace GetAgreementRoles {
	export interface IPathParams {
		/** The Agreement id to fetch roles of */
		agreementId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/roles`

	export const method = HttpMethod.Get

	export interface IQueryParams {}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {
		roles: any[]
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}

/** OpenAPI Definition */

/**
 * 	@api [get] /agreements/{agreementId}/roles
 * 	security:
 * 		- jwtAuth: []
 * 	summary: "TODO: Get all roles for an agreement"
 * 	description: "TODO: define the IAgreemeentRole role schema"
 * 	parameters:
 * 		- (path) agreementId* {string} The id of the agreement
 * 	responses:
 * 		"200":
 * 			description: "Returns the agreement role"
 * 			content:
 * 				application/json:
 * 					schema:
 * 						description: IAgreemeentRole[]
 * 						type: array
 * 						items:
 * 							description: IAgreemeentRole
 * 							type: object
 **/
