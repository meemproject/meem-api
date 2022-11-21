import { MeemMetadataLike } from '@meemproject/metadata'
import { IError, HttpMethod, IApiResponseBody } from '../api.shared'

export namespace UpdateAgreementExtension {
	export interface IPathParams {
		/** The meem contract id to fetch */
		agreementId: string

		/** The extension slug */
		slug: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/extensions/${options.slug}`

	export const method = HttpMethod.Put

	export interface IQueryParams {}

	export interface IRequestBody {
		/** Metadata associated with this extension */
		metadata?: MeemMetadataLike
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
