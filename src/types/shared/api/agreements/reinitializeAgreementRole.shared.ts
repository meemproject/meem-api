import { IError, HttpMethod, IApiResponseBody } from '../../api.shared'
import {
	IMeemMetadataLike,
	IMeemPermission,
	IMeemSplit
} from '../../meem.shared'

/** Reinitialize an agreement contract */
export namespace ReInitializeAgreementRole {
	export interface IPathParams {
		/** The id of the agreement */
		agreementId: string
		/** The id of the agreement role */
		agreementRoleId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/roles/${options.agreementRoleId}/reinitialize`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** The name of the contract */
		name?: string

		/** The max number of tokens */
		maxSupply?: string

		/** Agreement role contract metadata */
		metadata?: IMeemMetadataLike

		/** The contract symbol. If omitted, will use slug generated from name */
		symbol?: string

		/** Splits for minting / transfers */
		splits?: IMeemSplit[]

		/** Whether tokens can be transferred */
		isTransferLocked?: boolean
	}

	export interface IResponseBody extends IApiResponseBody {
		/** The Transaction id for updating the contract */
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
 * 	@api [post] /agreements/{agreementId}/roles/{agreementRoleId}/reinitialize
 * 	security:
 * 		- jwtAuth: []
 * 	summary: "Reinitialize an agreement role contract."
 * 	parameters:
 * 		- (path) agreementId* {string} The id of the agreement
 * 		- (path) agreementRoleId* {string} The id of the agreement role to reinitialize
 * 	requestBody:
 * 		content:
 * 			application/json:
 * 				schema:
 * 					$ref: '#/components/schemas/ReinitializeAgreementRoleRequestBody'
 * 	responses:
 * 		"200":
 * 			description: "Returns 'success' if reinitialize agreement transaction is executed."
 * 			content:
 * 				application/json:
 * 					schema:
 * 						type: object
 * 						properties:
 * 							txId:
 * 								type: string
 * 								description: The transaction id
 **/

/**
 *  @schema ReinitializeAgreementRoleRequestBody
 *  properties:
 *  	name:
 *  		description: The name of the contract
 *  		type: string
 * 			example: "My Agreement"
 *  	metadata:
 * 			description: The contract metadata `IMeemMetadataLike`
 *  		type: object
 *  	maxSupply:
 * 			description: The max number of tokens
 *  		type: string
 *  	symbol:
 * 			description: The contract symbol. If omitted, will use slug generated from name.
 *  		type: string
 *  	splits:
 * 			description: Splits for minting / transfers
 *  		type: array
 * 			items:
 * 				type: object
 * 		isTransferLocked:
 * 			description: Whether tokens can be transferred
 * 			type: boolean
 */
