import { IError, HttpMethod, IApiResponseBody } from '../../api.shared'
import { IMeemMetadataLike } from '../../meem.shared'

/** Bulk mint agreement tokens */
export namespace BulkMintAgreementTokens {
	export interface IPathParams {
		/** The id of the agreement */
		agreementId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/bulkMint`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		tokens: {
			/** The token metadata */
			metadata?: IMeemMetadataLike

			/** The address where the token will be minted */
			to: string
		}[]
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
 * 	@api [post] /agreements/{agreementId}/bulkMint
 * 	security:
 * 		- jwtAuth: []
 * 	summary: "Bulk mint agreement tokens"
 * 	parameters:
 * 		- (path) agreementId* {string} The id of the agreement
 * 	requestBody:
 * 		content:
 * 			application/json:
 * 				schema:
 * 					$ref: '#/components/schemas/BulkMintAgreementTokensRequestBody'
 * 	responses:
 * 		"200":
 * 			description: "Returns 'success' if bulk mint transaction is executed."
 * 			content:
 * 				application/json:
 * 					schema:
 * 						$ref: '#/components/schemas/DefaultStatusResponseBody'
 **/

/**
 *  @schema BulkMintAgreementTokensRequestBody
 * 	required:
 * 		- tokens
 *  properties:
 *  	tokens:
 *  		description: The token
 *  		type: array
 * 			items:
 * 				type: object
 * 				required:
 * 					- to
 * 				properties:
 * 					metadata:
 * 						description: The token metadata
 * 						type: object
 * 					to:
 * 						description: The address where the token will be minted
 * 						type: string
 */
