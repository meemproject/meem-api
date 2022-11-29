import { IError, HttpMethod, IApiResponseBody } from '../../api.shared'
import {
	IMeemMetadataLike,
	IMeemPermission,
	IMeemSplit
} from '../../meem.shared'

/** Create an agreement contract. */
export namespace CreateAgreement {
	export interface IPathParams {}

	export const path = () => `/api/1.0/agreements`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** The name of the contract */
		name: string

		/** Agreement contract metadata */
		metadata: IMeemMetadataLike

		/** The contract chain id */
		chainId: number

		/** The max number of tokens */
		maxSupply: string

		/** Whether the max number of tokens is locked */
		isMaxSupplyLocked?: boolean

		/** The contract symbol. If omitted, will use slug generated from name. */
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

		/** If true, will mint a token to the admin wallet addresses and any addresses in the members parameter  */
		shouldMintTokens?: boolean

		/** Additional non-admin member addresses that will receive tokens if shouldMintTokens is true */
		members?: string[]

		/** Token metadata to use if shouldMintTokens is true */
		tokenMetadata?: IMeemMetadataLike
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

/** OpenAPI Spec */

/**
 * 	@api [post] /agreements
 * 	security:
 * 		- jwtAuth: []
 * 	description: "Create an agreement contract."
 * 	requestBody:
 * 		content:
 * 			application/json:
 * 				schema:
 * 					$ref: '#/components/schemas/CreateAgreementRequestBody'
 * 	responses:
 * 		"200":
 * 			description: "Returns 'success' if create agreement transaction is executed."
 * 			content:
 * 				application/json:
 * 					schema:
 * 						$ref: '#/components/schemas/DefaultStatusResponseBody'
 **/

/**
 *  @schema CreateAgreementRequestBody
 * 	required:
 * 		- name
 * 		- metadata
 * 		- chainId
 * 		- maxSupply
 *  properties:
 *  	name:
 *  		description: The name of the contract
 *  		type: string
 * 			example: "My Agreement"
 *  	metadata:
 * 			description: The contract metadata `IMeemMetadataLike`
 *  		type: object
 *  	chainId:
 * 			description: The contract chain id
 *  		type: integer
 * 			example: 421613
 *  	maxSupply:
 * 			description: The max number of tokens
 *  		type: string
 * 		isMaxSupplyLocked:
 * 			description: Is the max number of tokens locked
 * 			type: boolean
 *  	symbol:
 * 			description: The contract symbol. If omitted, will use slug generated from name.
 *  		type: string
 *  	admins:
 * 			description: Contract admin addresses
 *  		type: array
 * 			items:
 * 				type: string
 */
