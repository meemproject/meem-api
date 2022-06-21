import { Response } from 'express'
import { IAuthenticatedRequest, IResponse } from '../types/app'
import { MeemAPI } from '../types/meem.generated'

export default class ContractController {
	public static async createContract(
		req: IAuthenticatedRequest<MeemAPI.v1.CreateContract.IDefinition>,
		res: IResponse<MeemAPI.v1.CreateContract.IResponseBody>
	): Promise<Response> {
		const {
			name,
			description,
			contractType,
			address,
			functionSelectors,
			abi,
			bytecode,
			chainId
		} = req.body

		await orm.models.Contract.create({
			name,
			description,
			contractType,
			address: address.trim(),
			functionSelectors,
			abi,
			bytecode: bytecode.replace(/^0x/, '').trim(),
			chainId,
			CreatorId: req.wallet.id
		})

		return res.json({
			status: 'success'
		})
	}
}
