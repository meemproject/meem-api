import { IError, HttpMethod, IApiResponseBody } from '../../api.shared'
import { IMeemMetadataLike } from '../../meem.shared'

/** Bulk mint agreement role tokens */
export namespace BulkMintAgreementRoleTokens {
	export interface IPathParams {
		/** The id of the agreement */
		agreementId: string
		/** The id of the agreement role */
		agreementRoleId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/roles/${options.agreementRoleId}/bulkMint`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		tokens: {
			/** Token metadata */
			metadata?: IMeemMetadataLike

			/** The address where the token will be minted to. */
			to: string
		}[]
	}

	export interface IResponseBody extends IApiResponseBody {
		/** The Transaction id */
		txId: string
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
 * 	@api [post] /agreements/{agreementId}/roles/{agreementRoleId}/bulkMint
 * 	security:
 * 		- jwtAuth: []
 * 	summary: "Bulk mint agreement role tokens"
 * 	parameters:
 * 		- (path) agreementId* {string} The id of the agreement
 * 		- (path) agreementRoleId* {string} The id of the agreement role
 * 	requestBody:
 * 		content:
 * 			application/json:
 * 				schema:
 * 					$ref: '#/components/schemas/BulkMintAgreementRoleTokensRequestBody'
 * 	responses:
 * 		"200":
 * 			description: "Returns 'success' if bulk mint transaction is executed."
 * 			content:
 * 				application/json:
 * 					schema:
 * 						$ref: '#/components/schemas/DefaultStatusResponseBody'
 **/

/**
 *  @schema BulkMintAgreementRoleTokensRequestBody
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
