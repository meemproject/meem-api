import { IError, HttpMethod, IApiResponseBody } from '../../api.shared'
import { IMeemMetadataLike } from '../../meem.shared'

/** Create an agreement extension */
export namespace CreateAgreementExtension {
	export interface IPathParams {
		/** The id of the agreement */
		agreementId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/extensions`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** The slug of the extension to enable */
		slug: string
		/** Optional metadata associated with this extension */
		metadata?: IMeemMetadataLike
		/** Optional external link associated with this extension */
		externalLink?: {
			/** Url for the link */
			url: string
			/** The link label */
			label?: string
		}
		/** Optional widget data associated with this extension */
		widget?: {
			/** Whether widget should be enabled */
			isEnabled: boolean
			/** Metadata associated with the extension widget */
			metadata?: IMeemMetadataLike
		}
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
 * 	@api [post] /agreements/{agreementId}/extensions
 * 	security:
 * 		- jwtAuth: []
 * 	summary: "Create an agreement extension"
 * 	parameters:
 * 		- (path) agreementId* {string} The id of the agreement
 * 	requestBody:
 * 		content:
 * 			application/json:
 * 				schema:
 * 					$ref: '#/components/schemas/CreateAgreementExtensionRequestBody'
 * 	responses:
 * 		"200":
 * 			description: "Returns 'success' if bulk mint transaction is executed."
 * 			content:
 * 				application/json:
 * 					schema:
 * 						$ref: '#/components/schemas/DefaultStatusResponseBody'
 **/

/**
 *  @schema CreateAgreementExtensionRequestBody
 * 	required:
 * 		- slug
 *  properties:
 *  	slug:
 *  		description: The slug of the extension to enable
 *  		type: string
 * 		metadata:
 * 			description: Optional metadata associated with this extension
 * 			type: object
 * 		externalLink:
 * 			description: Optional external link associated with this extension
 * 			type: object
 * 			required:
 * 				- url
 * 			properties:
 * 				url:
 * 					description: The URL for the link
 * 					type: string
 * 				label:
 * 					description: The link label
 * 					type: string
 * 		widget:
 * 			description: Optional widget data associated with this extension
 * 			type: object
 * 			required:
 * 				- isEnabled
 * 			properties:
 * 				isEnabled:
 * 					description: Whether widget should be enabled
 * 					type: boolean
 * 				metadata:
 * 					description: Metadata associated with the extension widget
 * 					type: object
 */
