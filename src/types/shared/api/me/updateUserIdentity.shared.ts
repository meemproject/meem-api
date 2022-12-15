import { MeemAPI } from '../../../meem.generated'
import { IError, HttpMethod, IApiResponseBody } from '../../api.shared'
import { UserIdentityVisibility } from '../../meem.shared'

/** Update current user identity */
export namespace UpdateUserIdentity {
	export interface IPathParams {
		/** The user identities id to update */
		userIdentityId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/me/identity/${options.userIdentityId}`

	export const method = HttpMethod.Patch

	export interface IQueryParams {}

	export interface IRequestBody {
		/** Set the visibility type of the user identity */
		visibility?: UserIdentityVisibility
		/** Metadata associated with this user identity */
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

/** === OpenAPI Definition === */

/**
 * 	@api [patch] /me/identity/{userIdentityId}
 * 	security:
 * 		- jwtAuth: []
 * 	summary: "Update current user identity"
 * 	parameters:
 * 		- (path) userIdentityId* {string} The user identity id to update
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
 *  		description: Set the visibility type of the user identity
 *  		type: string
 * 			default: token-holders
 * 			enum:
 * 				- just-me
 * 				- token-holders
 * 				- anyone
 *  	metadata:
 * 			description: Metadata associated with this user identity
 *  		type: string
 **/
