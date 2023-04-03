import { IError, HttpMethod, IApiResponseBody } from '../../api.shared'

/** Bulk mint agreement role tokens */
export namespace BulkBurnAgreementRoleTokens {
	export interface IPathParams {
		/** The id of the agreement */
		agreementId: string
		/** The id of the agreement role */
		agreementRoleId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/roles/${options.agreementRoleId}/bulkBurn`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		tokenIds: string[]
	}

	export interface IResponseBody extends IApiResponseBody {
		/** The Transaction id. Only if the agreement is on-chain */
		txId?: string
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
 * 	@api [post] /agreements/{agreementId}/roles/{agreementRoleId}/bulkBurn
 * 	security:
 * 		- jwtAuth: []
 * 	summary: "Bulk burn agreement role tokens"
 * 	parameters:
 * 		- (path) agreementId* {string} The id of the agreement
 * 		- (path) agreementRoleId* {string} The id of the agreement role
 * 	requestBody:
 * 		content:
 * 			application/json:
 * 				schema:
 * 					$ref: '#/components/schemas/BulkBurnAgreementRoleTokensRequestBody'
 * 	responses:
 * 		"200":
 * 			description: "Returns 'success' if bulk mint transaction is executed."
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
 *  @schema BulkBurnAgreementRoleTokensRequestBody
 * 	required:
 * 		- tokens
 *  properties:
 *  	tokens:
 *  		description: The token
 *  		type: array
 * 			items:
 * 				type: string
 */
