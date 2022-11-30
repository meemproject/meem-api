import { MeemAPI } from '../../../meem.generated'
import { IError, HttpMethod, IApiResponseBody } from '../../api.shared'

/** Delete an agreement role contract */
export namespace DeleteAgreementRole {
	export interface IPathParams {
		/** The id of the agreement */
		agreementId: string
		/** The id of the agreement role */
		agreementRoleId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/roles/${options.agreementRoleId}`

	export const method = HttpMethod.Delete

	export interface IQueryParams {}

	export interface IRequestBody {}

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

/** OpenAPI Definition */

/**
 * 	@api [delete] /agreements/{agreementId}/roles/{agreementRoleId}
 * 	security:
 * 		- jwtAuth: []
 * 	summary: "TODO: Delete an agreement role."
 * 	parameters:
 * 		- (path) agreementId* {string} The id of the agreement
 * 		- (path) agreementRoleId* {string} The id of the agreement role
 * 	responses:
 * 		"200":
 * 			description: "Returns 'success' if create agreement transaction is executed."
 * 			content:
 * 				application/json:
 * 					schema:
 * 						$ref: '#/components/schemas/DefaultStatusResponseBody'
 **/
