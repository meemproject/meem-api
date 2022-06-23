import { Response } from 'express'
import { Op } from 'sequelize'
import ContractInstance from '../models/ContractInstance'
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
			functionSelectors,
			abi,
			bytecode
		} = req.body

		await orm.models.Contract.create({
			name,
			description,
			contractType,
			functionSelectors,
			abi,
			bytecode: bytecode.replace(/^0x/, '').trim(),
			CreatorId: req.wallet.id
		})

		return res.json({
			status: 'success'
		})
	}

	public static async addContractInstance(
		req: IAuthenticatedRequest<MeemAPI.v1.TrackContractInstance.IDefinition>,
		res: IResponse<MeemAPI.v1.TrackContractInstance.IResponseBody>
	): Promise<Response> {
		const { address, chainId } = req.body

		// Check if this contract already exists in the db
		// eslint-disable-next-line prefer-const
		let [contractInstance, provider] = await Promise.all([
			orm.models.ContractInstance.findByAddress<ContractInstance>(address),
			services.ethers.getProvider({ chainId })
		])

		// Fetch bytecode and compare against db
		// const provider = await services.ethers.getProvider()
		const bytecode = await provider.getCode(address)

		const [contract, walletContractInstance] = await Promise.all([
			orm.models.Contract.findOne({
				where: {
					bytecode: {
						[Op.iLike]: `%${bytecode.replace(/^0x/, '').trim()}%`
					}
				}
			}),
			contractInstance
				? orm.models.WalletContractInstance.findOne({
						where: {
							WalletId: req.wallet.id,
							ContractInstanceId: contractInstance.id
						}
				  })
				: Promise.resolve(null)
		])

		if (!contractInstance) {
			contractInstance = orm.models.ContractInstance.build()
		}

		contractInstance.address = address
		contractInstance.chainId = chainId
		contractInstance.ContractId = contract?.id ?? null

		await contractInstance.save()

		if (!walletContractInstance) {
			await orm.models.WalletContractInstance.create({
				WalletId: req.wallet.id,
				ContractInstanceId: contractInstance.id
			})
		}

		return res.json({
			status: 'success'
		})
	}

	public static async updateWalletContractInstance(
		req: IAuthenticatedRequest<MeemAPI.v1.UpdateWalletContractInstance.IDefinition>,
		res: IResponse<MeemAPI.v1.UpdateWalletContractInstance.IResponseBody>
	): Promise<Response> {
		const { note, name } = req.body

		await orm.models.WalletContractInstance.update(
			{
				note,
				name
			},
			{
				where: {
					ContractInstanceId: req.params.contractInstanceId,
					WalletId: req.wallet.id
				}
			}
		)

		return res.json({
			status: 'success'
		})
	}
}
