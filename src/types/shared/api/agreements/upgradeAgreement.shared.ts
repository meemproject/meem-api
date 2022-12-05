import { IError, HttpMethod, IApiResponseBody } from '../../api.shared'

/** Upgrade an agreement contract */
export namespace UpgradeAgreement {
	export interface IPathParams {
		agreementId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/upgrade`

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
 * 		- (path) agreementId* {string} The ID of the agreement to upgrade
 * 	requestBody:
 * 		content:
 * 			application/json:
 * 				schema:
 * 					$ref: '#/components/schemas/UpgradeAgreementRequestBody'
 * 	responses:
 * 		"200":
 * 			description: "Returns 'success' if upgrade agreement transaction is executed."
 * 			content:
 * 				application/json:
 * 					schema:
 * 						$ref: '#/components/schemas/DefaultStatusResponseBody'
 **/

/**
 *  @schema UpgradeAgreementRequestBody
 *  properties:
 *  	bundleId:
 *  		description: Specify the bundle id to upgrade to. Defaults to latest Agreements bundle
 *  		type: string
 */
