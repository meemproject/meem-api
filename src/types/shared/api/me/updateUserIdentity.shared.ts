import { MeemAPI } from '../../../meem.generated'
import { IError, HttpMethod, IApiResponseBody } from '../../api.shared'
import { IntegrationVisibility } from '../../meem.shared'

/** Update current user identity */
export namespace UpdateUserIdentity {
	export interface IPathParams {
		/** The user identity integration id to connect or update */
		integrationId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/me/integrations/${options.integrationId}`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** Set the visibility type of the user identity integration */
		visibility?: IntegrationVisibility
		/** Metadata associated with this user identity integration */
		metadata?: { [key: string]: unknown }
	}

	export interface IResponseBody extends IApiResponseBody {
		userIdentity: any
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
 * 	@api [post] /me/integrations/{integrationId}
 * 	security:
 * 		- jwtAuth: []
 * 	summary: "Update current user identity"
 * 	parameters:
 * 		- (path) integrationId* {string} The user identity integration id to connect or update
 * 	requestBody:
 * 		content:
 * 			application/json:
 * 				schema:
 * 					$ref: '#/components/schemas/UpdateUserIdentityRequestBody'
 * 	responses:
 * 		"200":
 * 			description: "Returns a generated message to sign"
 * 			content:
 * 				application/json:
 * 					schema:
 * 						type: object
 * 						properties:
 * 							userIdentity:
 * 								description: The new or updated user identity
 * 								type: object
 **/

/**
 *  @schema UpdateUserIdentityRequestBody
 *  properties:
 *  	visibility:
 *  		description: Set the visibility type of the user identity integration
 *  		type: string
 * 			default: mutual-agreement-members
 * 			enum:
 * 				- just-me
 * 				- mutual-agreement-members
 * 				- anyone
 *  	metadata:
 * 			description: Metadata associated with this user identity integration
 *  		type: string
 **/
