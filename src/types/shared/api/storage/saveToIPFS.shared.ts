import { IError, HttpMethod, IApiResponseBody } from '../../api.shared'

/** Save some data to IPFS */
export namespace SaveToIPFS {
	export interface IPathParams {}

	export const path = () => `/api/1.0/ipfs`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** The data to save. Only one of "data" or "json" should be sent */
		data?: string

		/** The JSON to save. Only one of "data" or "json" should be sent */
		json?: Record<string, any>
	}

	export interface IResponseBody extends IApiResponseBody {
		/** The IPFS hash for the saved data */
		ipfsHash: string
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}

// TODO: How to specify json in OpenAPI definition

/** === OpenAPI Definition === */

/**
 * 	@api [post] /ipfs
 * 	summary: Save data to IPFS
 * 	description: Save data to IPFS
 * 	requestBody:
 * 		content:
 * 			application/json:
 * 				schema:
 * 					$ref: '#/components/schemas/SaveToIPFSRequestBody'
 * 	responses:
 * 		"200":
 * 			description: "Returns the IPFS hash"
 * 			content:
 * 				application/json:
 * 					schema:
 * 						type: object
 * 						properties:
 * 							ipfsHash:
 * 								description: The IPFS hash
 * 								type: string
 **/

/**
 *  @schema SaveToIPFSRequestBody
 *  properties:
 *  	data:
 *  		description: The data to save to IPFS
 *  		type: string
 */
