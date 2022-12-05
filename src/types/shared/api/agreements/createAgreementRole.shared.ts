import { IError, HttpMethod, IApiResponseBody } from '../../api.shared'
import {
	IMeemMetadataLike,
	IMeemPermission,
	IMeemSplit
} from '../../meem.shared'

/** Create an agreement role contract */
export namespace CreateAgreementRole {
	export interface IPathParams {
		agreementId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/roles`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** The name of the agreement role contract */
		name: string

		/** Agreement role contract metadata */
		metadata: IMeemMetadataLike

		/** The max number of tokens */
		maxSupply: string

		/** Whether the max supply is locked */
		isMaxSupplyLocked?: boolean

		/** The contract symbol. If omitted, will use slug generated from name */
		symbol?: string

		/** Contract admin addresses. */
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
		/** The Transaction id for deploying the contract. Transaction #1 */
		deployContractTxId: string

		/** The Transaction id for initializing the contract. Transaction #2 */
		cutTxId: string

		/** The Transaction id for minting tokens. Transaction #3 */
		mintTxId?: string
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
 * 	@api [post] /agreements/{agreementId}/roles
 * 	security:
 * 		- jwtAuth: []
 * 	summary: "Create an agreement role contract"
 * 	parameters:
 * 		- (path) agreementId* {string} The id of the agreement to create a role for
 * 	requestBody:
 * 		content:
 * 			application/json:
 * 				schema:
 * 					$ref: '#/components/schemas/CreateAgreementRoleRequestBody'
 * 	responses:
 * 		"200":
 * 			description: "Returns 'success' if create agreement transaction is executed."
 * 			content:
 * 				application/json:
 * 					schema:
 * 						$ref: '#/components/schemas/DefaultStatusResponseBody'
 **/

/**
 *  @schema CreateAgreementRoleRequestBody
 * 	required:
 * 		- name
 * 		- metadata
 * 		- maxSupply
 *  properties:
 *  	name:
 *  		description: The name of the contract
 *  		type: string
 * 			example: "My Agreement Role"
 *  	metadata:
 * 			description: The contract metadata `IMeemMetadataLike`
 *  		type: object
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
 * 		shouldMintTokens:
 * 			description: If true, will mint a token to the admin wallet addresses and any addresses in the members parameter.
 * 			type: boolean
 *  	members:
 * 			description: Additional non-admin member addresses that will receive tokens if shouldMintTokens is true
 *  		type: array
 * 			items:
 * 				type: string
 *  	tokenMetadata:
 * 			description: Token metadata to use if shouldMintTokens is true
 *  		type: object
 */
