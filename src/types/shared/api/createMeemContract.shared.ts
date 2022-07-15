import * as meemContracts from '@meemproject/meem-contracts'
import { InitParamsStruct } from '@meemproject/meem-contracts/dist/types/Meem'
import { BigNumberish } from 'ethers'
import { IError, HttpMethod, IApiResponseBody } from '../api.shared'
import {
	IMeemProperties,
	IMeemContractMetadata,
	IMeemContractBaseProperties
} from '../meem.shared'

/** Create Meem Image */
export namespace CreateMeemContract {
	export interface IPathParams {}

	export const path = () => `/api/1.0/meemContracts`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** Name of the contract */
		name: string

		/** Contract admin wallet addresses */
		admins: string[]

		/** Contract metadata */
		metadata: IMeemContractMetadata

		/** Symbol for the contract */
		symbol: string

		/** Contract base properties */
		baseProperties: IMeemContractBaseProperties

		/** Meem default properties */
		// TODO: Make this a partial
		defaultProperties?: IMeemProperties

		/** Meem default child properties */
		// TODO: Make this a partial
		defaultChildProperties?: IMeemProperties

		/** Token ID start */
		tokenCounterStart: number

		childDepth: number

		/** Required non-owner split amount */
		nonOwnerSplitAllocationAmount: number

		/** If true, will mint a token to the admin wallet addresses  */
		mintAdminTokens?: boolean
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
