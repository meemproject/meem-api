import * as meemContracts from '@meemproject/meem-contracts'
import {
	InitParamsStruct,
	MeemPropertiesStruct
} from '@meemproject/meem-contracts/dist/types/Meem'
import { BigNumberish } from 'ethers'
import { MeemAPI } from '../../meem.generated'
import { IError, HttpMethod, IApiResponseBody } from '../api.shared'

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
		metadata: MeemAPI.IMeemContractMetadata

		/** Symbol for the contract */
		symbol: string

		/** Contract base properties */
		baseProperties: InitParamsStruct

		/** Meem default properties */
		defaultProperties: MeemPropertiesStruct

		/** Meem default child properties */
		defaultChildProperties: MeemPropertiesStruct

		/** Token ID start */
		tokenCounterStart: BigNumberish

		childDepth: BigNumberish

		/** Required non-owner split amount */
		nonOwnerSplitAllocationAmount: BigNumberish
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
