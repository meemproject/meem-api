import { IError, HttpMethod, IApiResponseBody } from '../../api.shared'
import {
	IAgreementExtensionVisibility,
	IMeemMetadataLike
} from '../../meem.shared'

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
		/** The id of the extension to enable */
		extensionId: string

		/** Whether the extension initialization is complete */
		isInitialized?: boolean

		/** Optional metadata associated with this extension */
		metadata?: IMeemMetadataLike

		/** Optional external link associated with this extension */
		externalLink?: {
			/** Url for the link */
			url: string
			/** The link label */
			label?: string
			/** Visibility of the link extension */
			visibility?: IAgreementExtensionVisibility
		}

		/** Optional widget data associated with this extension */
		widget?: {
			/** Metadata associated with the extension widget */
			metadata?: IMeemMetadataLike
			/** Visibility of the widget extension */
			visibility?: IAgreementExtensionVisibility
		}
	}

	export interface IResponseBody extends IApiResponseBody {
		status: 'success'

		/** The Transaction ids that must be completed as part of creating the extension. May be empty if no transactions are required. */
		txIds: string[]
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
 * 		- extensionId
 *  properties:
 *  	extensionId:
 *  		description: The id of the extension to enable
 *  		type: string
 *  	isInitialized:
 *  		description: Whether the extension initialization is complete
 *  		type: boolean
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
 * 				visibility:
 * 					description: Set the visibility type of the extension link
 * 					type: string
 * 					default: token-holders
 * 					enum:
 * 						- just-me
 * 						- token-holders
 * 						- anyone
 * 		widget:
 * 			description: Optional widget data associated with this extension
 * 			type: object
 * 			properties:
 * 				metadata:
 * 					description: Metadata associated with the extension widget
 * 					type: object
 * 				visibility:
 * 					description: Set the visibility type of the extension widget
 * 					type: string
 * 					default: token-holders
 * 					enum:
 * 						- just-me
 * 						- token-holders
 * 						- anyone
 */
