import { IError, HttpMethod, IApiResponseBody } from '../../api.shared'

/** Check if agreement slug is available */
export namespace IsSlugAvailable {
	export interface IPathParams {}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/isSlugAvailable`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** New agreement slug to check */
		slug: string

		/** The chain id of new agreement */
		chainId: number
	}

	export interface IResponseBody extends IApiResponseBody {
		isSlugAvailable: boolean
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
 * 	@api [post] /agreements/isSlugAvailable
 * 	summary: Check if agreement slug is available
 * 	description: When creating a new agreement contract, you can specify the slug that is stored in the Meem indexer database. This endpoint will allow you to see if a slug is avilable before creating the agreement contract.
 * 	requestBody:
 * 		content:
 * 			application/json:
 * 				schema:
 * 					$ref: '#/components/schemas/IsAgreementSlugAvailableRequestBody'
 * 	responses:
 * 		"200":
 * 			description: "Returns the agreement minting proof"
 * 			content:
 * 				application/json:
 * 					schema:
 * 						type: object
 * 						properties:
 * 							isSlugAvailable:
 * 								description: Whether this slug is available
 * 								type: boolean
 **/

/**
 *  @schema IsAgreementSlugAvailableRequestBody
 * 	required:
 * 		- slug
 * 		- chainId
 *  properties:
 *  	slug:
 *  		description: New agreement slug to check
 *  		type: string
 * 			example: "my-agreement"
 *  	chainId:
 *  		description: The chain id of new agreement. Agreement slugs are unique to the chain of the agreement contract.
 *  		type: integer
 * 			example: 421613
 */
