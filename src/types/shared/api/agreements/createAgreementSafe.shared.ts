import { IError, HttpMethod, IApiResponseBody } from '../../api.shared'

/** Create an agreement safe */
export namespace CreateAgreementSafe {
	export interface IPathParams {
		agreementId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/safe`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** Addresses of the safe owners */
		safeOwners: string[]

		/** Chain id of the safe */
		chainId?: number

		/** The number of signatures required */
		threshold?: number
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
 * 	@api [post] /agreements/{agreementId}/safe
 * 	security:
 * 		- jwtAuth: []
 * 	summary: "Create an agreement safe"
 * 	parameters:
 * 		- (path) agreementId* {string} The id of the agreement
 * 	requestBody:
 * 		content:
 * 			application/json:
 * 				schema:
 * 					$ref: '#/components/schemas/CreateAgreementSafeRequestBody'
 * 	responses:
 * 		"200":
 * 			description: "Returns 'success' if safe is successfully created."
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
 *  @schema CreateAgreementSafeRequestBody
 * 	required:
 * 		- safeOwners
 * 		- chainId
 *  properties:
 *  	safeOwners:
 * 			description: Addresses of the safe owners
 *  		type: array
 * 			items:
 * 				type: string
 *  	chainId:
 * 			description: Chain id of the safe
 *  		type: integer
 * 			example: 421613
 * 		threshold:
 * 			description: The number of signatures required
 * 			type: integer
 * 			example: 2
 */
