import { MeemAPI } from '../../../meem.generated'
import { IError, HttpMethod, IApiResponseBody } from '../../api.shared'

/** Update an agreement role */
export namespace UpdateAgreementRole {
	export interface DiscordRoleIntegrationData {
		discordServerId: string
		discordGatedChannels: string[]
		discordAccessToken: string
	}
	export interface IPathParams {
		/** The id of the agreement */
		agreementId: string
		/** The id of the agreement role */
		agreementRoleId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/roles/${options.agreementRoleId}`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** Name of the role */
		name?: string
		/** Array of ids for permissions */
		permissions?: string[]
		/** Wallet addresses of members */
		members?: string[]
		/** If the role is token-based, is the token transferrable to other wallets */
		isTokenTransferrable?: boolean
		/** Role integration data */
		roleIntegrationsData?: (
			| DiscordRoleIntegrationData
			| { [key: string]: any }
		)[]
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
