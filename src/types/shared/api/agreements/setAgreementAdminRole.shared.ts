import { IError, HttpMethod, IApiResponseBody } from '../../api.shared'

/** Set the agreement admin role */
export namespace SetAgreementAdminRole {
	export interface IPathParams {
		agreementId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/adminRole`

	export const method = HttpMethod.Patch

	export interface IQueryParams {}

	export interface IRequestBody {
		/** The id of the agreement role to set as admin role */
		adminAgreementRoleId: string
	}

	export interface IResponseBody extends IApiResponseBody {
		/** The Transaction id */
		txId: string
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}
}

/** === OpenAPI Definition === */

/**
 * 	@api [patch] /agreements/{agreementId}/setAdminRole
 * 	security:
 * 		- jwtAuth: []
 * 	summary: "Set the agreement admin role"
 * 	parameters:
 * 	requestBody:
 * 		content:
 * 			application/json:
 * 				schema:
 * 					$ref: '#/components/schemas/SetAgreemetAdminRoleRequestBody'
 * 	responses:
 * 		"200":
 * 			description: "Returns 'success' if admin role was successfully set."
 * 			content:
 * 				application/json:
 * 					schema:
 * 						$ref: '#/components/schemas/DefaultStatusResponseBody'
 **/

/**
 *  @schema SetAgreemetAdminRoleRequestBody
 * 	required:
 * 		- address
 *  properties:

 * 		adminAgreementRoleId:
 * 			description: The id of the agreement role to set as admin role
 * 			type: string
 */
