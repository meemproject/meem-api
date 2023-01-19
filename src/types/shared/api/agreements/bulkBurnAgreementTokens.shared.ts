import { IError, HttpMethod, IApiResponseBody } from '../../api.shared'

/** Bulk mint agreement tokens */
export namespace BulkBurnAgreementTokens {
	export interface IPathParams {
		/** The id of the agreement */
		agreementId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/bulkBurn`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		tokenIds: string[]
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
 * 	@api [post] /agreements/{agreementId}/bulkBurn
 * 	security:
 * 		- jwtAuth: []
 * 	summary: "Bulk burn agreement tokens"
 * 	parameters:
 * 		- (path) agreementId* {string} The id of the agreement
 * 	requestBody:
 * 		content:
 * 			application/json:
 * 				schema:
 * 					$ref: '#/components/schemas/BulkBurnAgreementTokensRequestBody'
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
 *  @schema BulkBurnAgreementTokensRequestBody
 * 	required:
 * 		- tokens
 *  properties:
 *  	tokens:
 *  		description: The token
 *  		type: array
 * 			items:
 * 				type: string
 */
