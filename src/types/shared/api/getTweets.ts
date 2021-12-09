import { TweetV2 } from 'twitter-api-v2'
import { IError, HttpMethod, IApiResponseBody } from '../api.shared'

/** Get Meem Tweets */
export namespace GetTweets {
	export interface IPathParams {}

	export const path = () => `/api/1.0/tweets`

	export const method = HttpMethod.Get

	export interface IQueryParams {}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {
		tweets: TweetV2[]
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}
