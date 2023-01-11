import { IError, HttpMethod, IApiResponseBody } from '../../api.shared'

/** Update off-chain agreement data */
export namespace UpdateAgreement {
	export interface IPathParams {
		/** The id of the agreement */
		agreementId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}`

	export const method = HttpMethod.Patch

	export interface IQueryParams {}

	export interface IRequestBody {
		/** Whether the agreement is launched and visible to members */
		isLaunched: boolean
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
 * 	@api [patch] /agreements/{agreementId}
 * 	security:
 * 		- jwtAuth: []
 * 	summary: "Update off-chain agreement data"
 * 	parameters:
 * 		- (path) agreementId* {string} The id of the agreement
 * 	requestBody:
 * 		content:
 * 			application/json:
 * 				schema:
 * 					$ref: '#/components/schemas/UpdateAgreementRequestBody'
 * 	responses:
 * 		"200":
 * 			description: "Returns 'success' if update succeeds."
 * 			content:
 * 				application/json:
 * 					schema:
 * 						$ref: '#/components/schemas/DefaultStatusResponseBody'
 **/

/**
 *  @schema UpdateAgreementRequestBody
 *  properties:
 *  	isLaunched:
 *  		description: Whether the agreement is launched and visible to members
 *  		type: boolean
 */
