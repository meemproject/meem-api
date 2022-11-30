import { IError, HttpMethod, IApiResponseBody } from '../api.shared'

/** Log in a user. */
export namespace Login {
	export interface IPathParams {}

	export const path = () => `/api/1.0/login`

	export const method = HttpMethod.Post

	export interface IQueryParams {}
	export interface IRequestBody {
		/** Login w/ access token provided by Auth0 magic link */
		accessToken?: string

		/** Login w/ wallet. Both address and signature must be provided */
		address?: string

		/** Login w/ wallet. Both address and signature must be provided */
		signature?: string

		/** Whether to connect the login method with the currently authenticated user */
		shouldConnectUser?: boolean
	}

	export interface IResponseBody extends IApiResponseBody {
		/** JWT that can be used for future authentication */
		jwt: string
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}

/**
 * 	@api [post] /login
 * 	summary: "Log in a user."
 * 	requestBody:
 * 		content:
 * 			application/json:
 * 				schema:
 * 					$ref: '#/components/schemas/LoginRequestBody'
 * 	responses:
 * 		"200":
 * 			description: "Returns a jwt token for the logged-in user."
 * 			content:
 * 				application/json:
 * 					schema:
 * 						type: object
 * 						properties:
 * 							jwt:
 * 								description: JWT that can be used for future authentication
 * 								type: string
 **/

/**
 *  @schema LoginRequestBody
 *  properties:
 *  	accessToken:
 *  		description: Login w/ access token provided by Auth0 magic link
 *  		type: string
 *  	address:
 * 			description: Login w/ wallet. Both address and signature must be provided
 *  		type: string
 *  	signature:
 * 			description: Login w/ wallet. Both address and signature must be provided
 *  		type: string
 *  	shouldConnectUser:
 * 			description: Whether to connect the login method with the currently authenticated user
 *  		type: boolean
 */
