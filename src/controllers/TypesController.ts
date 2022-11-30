import path from 'path'
import { Response } from 'express'
import fs from 'fs-extra'
import { IRequest, IResponse } from '../types/app'
import { MeemAPI } from '../types/meem.generated'
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
	): Promise<void> {
		const options = {
			root: process.cwd()
		}

		return res.sendFile('src/types/shared/api/meem-api.yaml', options)
	}
}
