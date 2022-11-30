import { IError, HttpMethod, IApiResponseBody } from '../../api.shared'

/** Get agreement minting proof */
export namespace GetMintingProof {
	export interface IPathParams {
		/** The id of the agreement */
		agreementId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/proof`

	export const method = HttpMethod.Get

	export interface IQueryParams {}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {
		proof: string[]
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
 * 	@api [get] /agreements/{agreementId}
 * 	security:
 * 		- jwtAuth: []
 * 	summary: "Get agreement minting proof"
 * 	parameters:
 * 		- (path) agreementId* {string} The id of the agreement
 * 	responses:
 * 		"200":
 * 			description: "Returns the agreement minting proof"
 * 			content:
 * 				application/json:
 * 					schema:
 * 						type: object
 * 						properties:
 * 							proof:
 * 								description: Agreement minting proof as array of hex strings
 * 								type: array
 * 								items:
 * 									type: string
 **/
