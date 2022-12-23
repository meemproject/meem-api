import { IError, HttpMethod, IApiResponseBody } from '../../api.shared'

/** Set the agreement safe address */
export namespace SetAgreementSafeAddress {
	export interface IPathParams {
		agreementId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/safe`

	export const method = HttpMethod.Patch

	export interface IQueryParams {}

	export interface IRequestBody {
		/** The safe address */
		address: string

		/** Chain id of the safe */
		chainId?: number
	}

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
 * 	@api [patch] /agreements/{agreementId}/safe
 * 	security:
 * 		- jwtAuth: []
 * 	summary: "Create an agreement safe"
 * 	parameters:
 * 		- (path) agreementId* {string} The id of the agreement
 * 	requestBody:
 * 		content:
 * 			application/json:
 * 				schema:
 * 					$ref: '#/components/schemas/SetAgreementSafeAddressRequestBody'
 * 	responses:
 * 		"200":
 * 			description: "Returns 'success' if safe is successfully created."
 * 			content:
 * 				application/json:
 * 					schema:
 * 						$ref: '#/components/schemas/DefaultStatusResponseBody'
 **/

/**
 *  @schema SetAgreementSafeAddressRequestBody
 * 	required:
 * 		- address
 *  properties:

 * 		address:
 * 			description: The number of signatures required
 * 			type: string
 * 			example: 0x0000000000000000000000000000000000000000
 *  	chainId:
 * 			description: Chain id of the safe
 *  		type: integer
 * 			example: 421613
 */
