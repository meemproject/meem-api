import { IError, HttpMethod, IApiResponseBody } from '../../api.shared'
import {
	IMeemMetadataLike,
	IMeemPermission,
	IMeemSplit
} from '../../meem.shared'

/** Reinitialize an agreement contract */
export namespace ReInitializeAgreement {
	export interface IPathParams {
		/** The id of the agreement */
		agreementId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/reinitialize`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** The name of the contract */
		name?: string

		/** The max number of tokens */
		maxSupply?: string

		/** Agreement contract metadata */
		metadata?: IMeemMetadataLike

		/** The contract symbol. If omitted, will use slug generated from name */
		symbol?: string

		/** Contract admin addresses */
		admins?: string[]

		/** Special minter permissions */
		minters?: string[]

		/** Minting permissions */
		mintPermissions?: Omit<IMeemPermission, 'merkleRoot'>[]

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
 * 	@api [post] /agreements/{agreementId}/reinitialize
 * 	security:
 * 		- jwtAuth: []
 * 	summary: "Reinitialize an agreement contract."
 * 	parameters:
 * 		- (path) agreementId* {string} The id of the agreement to reinitialize
 * 	requestBody:
 * 		content:
 * 			application/json:
 * 				schema:
 * 					$ref: '#/components/schemas/ReinitializeAgreementRequestBody'
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
 *  @schema ReinitializeAgreementRequestBody
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
 *  	admins:
 * 			description: Contract admin addresses
 *  		type: array
 * 			items:
 * 				type: string
 *  	minters:
 * 			description: Special minter permissions
 *  		type: array
 * 			items:
 * 				type: string
 *  	mintPermissions:
 * 			description: Minting permissions
 *  		type: array
 * 			items:
 * 				type: object
 *  	splits:
 * 			description: Splits for minting / transfers
 *  		type: array
 * 			items:
 * 				type: object
 * 		isTransferLocked:
 * 			description: Whether tokens can be transferred
 * 			type: boolean
 */
