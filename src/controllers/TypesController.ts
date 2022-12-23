import { Response } from 'express'
import { IRequest, IResponse } from '../types/app'
import { MeemAPI } from '../types/meem.generated'
import openAPIDefinition from '../types/shared/api/meem-api.json'
export default class TypesController {
	public static async generateTypes(
		req: IRequest<MeemAPI.v1.GenerateTypes.IDefinition>,
		res: IResponse<MeemAPI.v1.GenerateTypes.IResponseBody>
	): Promise<Response> {
		const { types, abi } = await services.types.generateContractTypes(req.body)

		return res.json({
			types,
			abi
		})
	}

	public static async getOpenAPIFile(
		req: IRequest<any>,
		res: IResponse<any>
	): Promise<Response> {
		return res.json(openAPIDefinition)
	}
}
