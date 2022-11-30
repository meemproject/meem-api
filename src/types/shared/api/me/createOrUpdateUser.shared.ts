import { IError, HttpMethod, IApiResponseBody } from '../../api.shared'
import { IMeemId } from '../../meem.shared'

/** Create or update the current user */
export namespace CreateOrUpdateUser {
	export interface IPathParams {}

	export const path = () => `/api/1.0/me`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** Profile picture base64 string */
		profilePicBase64?: string
		/** Url to profile picture */
		// profilePicUrl?: string
		/** Display name of identity */
		displayName?: string
	}

	export interface IResponseBody extends IApiResponseBody {
		user: any
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
 * 	@api [post] /me
 * 	security:
 * 		- jwtAuth: []
 * 	summary: "Create or update the current user"
 * 	requestBody:
 * 		content:
 * 			application/json:
 * 				schema:
 * 					$ref: '#/components/schemas/CreateOrUpdateUserRequestBody'
 * 	responses:
 * 		"200":
 * 			description: "Returns a generated message to sign"
 * 			content:
 * 				application/json:
 * 					schema:
 * 						type: object
 * 						properties:
 * 							user:
 * 								description: The new or updated user
 * 								type: object
 **/

/**
 *  @schema CreateOrUpdateUserRequestBody
 *  properties:
 *  	profilePicBase64:
 *  		description: Profile picture base64 string
 *  		type: string
 *  	displayName:
 * 			description: Display name of identity
 *  		type: string
 */
