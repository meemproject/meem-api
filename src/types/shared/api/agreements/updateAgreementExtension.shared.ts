import { IError, HttpMethod, IApiResponseBody } from '../../api.shared'
import { IMeemMetadataLike } from '../../meem.shared'

/** Update an agreement extension */
export namespace UpdateAgreementExtension {
	export interface IPathParams {
		/** The id of the agreement */
		agreementId: string

		/** The extension slug */
		slug: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/extensions/${options.slug}`

	export const method = HttpMethod.Put

	export interface IQueryParams {}

	export interface IRequestBody {
		/** Metadata to store for this extension */
		metadata?: IMeemMetadataLike
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

/** OpenAPI Definition */

/**
 * 	@api [put] /agreements/{agreementId}/extensions/{slug}
 * 	security:
 * 		- jwtAuth: []
 * 	summary: "Update an agreement extension"
 * 	parameters:
 * 		- (path) agreementId* {string} The id of the agreement
 * 		- (path) slug* {string} The extension slug
 * 	requestBody:
 * 		content:
 * 			application/json:
 * 				schema:
 * 					$ref: '#/components/schemas/UpdateAgreementExtensionRequestBody'
 * 	responses:
 * 		"200":
 * 			description: "Returns 'success' if bulk mint transaction is executed."
 * 			content:
 * 				application/json:
 * 					schema:
 * 						$ref: '#/components/schemas/DefaultStatusResponseBody'
 **/

/**
 *  @schema UpdateAgreementExtensionRequestBody
 * 	required:
 * 		- metadata
 *  properties:
 * 		metadata:
 * 			description: Metadata to store for this extension
 * 			type: object
 */
