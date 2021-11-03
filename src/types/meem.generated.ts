/* eslint-disable no-new */
/* eslint-disable import/export */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable no-unused-vars */
/* eslint-disable no-redeclare */
/* eslint-disable @typescript-eslint/no-unused-vars */
export namespace MeemAPI {
	export interface IError {
		status: string
		code: string
		reason: string
		friendlyReason: string
	}

	export enum HttpMethod {
		Get = 'GET',
		Post = 'POST',
		Patch = 'PATCH',
		Put = 'PUT',
		Options = 'OPTIONS',
		Delete = 'DELETE'
	}

	export interface IApiResponseBody {
		apiVersion: string
	}

	export enum License {
		Cc0 = 'cc0',
		Unknown = 'unknown'
	}

	export interface IWhitelist {
		[contractAddress: string]: IWhitelistItem
	}

	export interface IWhitelistItem {
		/** The NFT name */
		name: string

		/** The name of the original NFT creator */
		creator: string

		/** The license */
		license: License

		/** Link to the terms and conditions */
		terms: string

		/** Link to the NFT website */
		website: string
	}

	export namespace v1 {
		/** Get Config */
		export namespace GetConfig {
			export interface IPathParams {}

			export const path = () => '/api/1.0/config'

			export const method = HttpMethod.Get

			export interface IQueryParams {}

			export interface IRequestBody {}

			export interface IResponseBody extends IApiResponseBody {}

			export interface IDefinition {
				pathParams: IPathParams
				queryParams: IQueryParams
				requestBody: IRequestBody
				responseBody: IResponseBody
			}

			export type Response = IResponseBody | IError
		}

		/** Get Meem */
		export namespace GetMeem {
			export interface IPathParams {
				/** The token id to fetch */
				tokenId: string
			}

			export const path = (options: IPathParams) =>
				`/api/1.0/meems/${options.tokenId}`

			export const method = HttpMethod.Get

			export interface IQueryParams {}

			export interface IRequestBody {}

			export interface IResponseBody extends IApiResponseBody {
				meem: {
					chain: number
				}
			}

			export interface IDefinition {
				pathParams: IPathParams
				queryParams: IQueryParams
				requestBody: IRequestBody
				responseBody: IResponseBody
			}

			export type Response = IResponseBody | IError
		}

		/** Get whitelisted NFT contracts */
		export namespace GetWhitelist {
			export interface IPathParams {}

			export const path = () => `/api/1.0/whitelist`

			export const method = HttpMethod.Get

			export interface IQueryParams {}

			export interface IRequestBody {}

			export interface IResponseBody extends IApiResponseBody {
				whitelist: {
					[contractAddress: string]: IWhitelistItem
				}
			}

			export interface IDefinition {
				pathParams: IPathParams
				queryParams: IQueryParams
				requestBody: IRequestBody
				responseBody: IResponseBody
			}

			export type Response = IResponseBody | IError
		}
	}
}
