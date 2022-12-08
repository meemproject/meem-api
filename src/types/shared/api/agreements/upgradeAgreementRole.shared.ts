import { IError, HttpMethod, IApiResponseBody } from '../../api.shared'

/** Upgrade an agreement role contract */
export namespace UpgradeAgreementRole {
	export interface IPathParams {
		/** The id of the agreement */
		agreementId: string
		/** The id of the agreement role */
		agreementRoleId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/roles/${options.agreementRoleId}/upgrade`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** Specify the bundle id to upgrade to. Defaults to latest Agreements bundle */
		bundleId?: string
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

	export type Response = IResponseBody | IError
}

/** === OpenAPI Definition === */

/**
 * 	@api [post] /agreements/{agreementId}/upgrade
 * 	security:
 * 		- jwtAuth: []
 * 	summary: "Upgrade an agreement contract."
 * 	parameters:
 * 		- (path) agreementId* {string} The id of the agreement
 * 		- (path) agreementRoleId* {string} The id of the agreement role
 * 	requestBody:
 * 		content:
 * 			application/json:
 * 				schema:
 * 					$ref: '#/components/schemas/UpgradeAgreementRoleRequestBody'
 * 	responses:
 * 		"200":
 * 			description: "Returns 'success' if upgrade agreement transaction is executed."
 * 			content:
 * 				application/json:
 * 					schema:
 * 						type: object
 * 						properties:
 * 							txId:
 * 								type: string
 * 								description: The transaction id
 **/

/**
 *  @schema UpgradeAgreementRoleRequestBody
 *  properties:
 *  	bundleId:
 *  		description: Specify the bundle id to upgrade to. Defaults to latest Agreements bundle
 *  		type: string
 */
