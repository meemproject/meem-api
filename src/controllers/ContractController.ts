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
		const functionSelectors = services.ethers.getSelectors(req.body.abi)

		await orm.models.Contract.create({
			name: req.body.name,
			description: req.body.description,
			contractType: req.body.contractType,
			functionSelectors,
			abi: req.body.abi,
			bytecode: req.body.bytecode.replace(/^0x/, '').trim(),
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

	public static async createBundle(
		req: IAuthenticatedRequest<MeemAPI.v1.CreateBundle.IDefinition>,
		res: IResponse<MeemAPI.v1.CreateBundle.IResponseBody>
	): Promise<Response> {
		const { name, description, contractIds } = req.body

		const t = await orm.sequelize.transaction()

		const bundles = await orm.models.Bundle.findAll({
			include: [
				{
					model: orm.models.BundleContract,
					where: {
						ContractId: {
							[Op.in]: contractIds
						}
					}
				}
			]
		})

		const existingBundle = bundles.find(
			b => b.BundleContracts?.length === contractIds.length
		)

		if (existingBundle) {
			throw new Error('BUNDLE_ALREADY_EXISTS')
		}

		const bundle = await orm.models.Bundle.create(
			{
				name,
				description,
				CreatorId: req.wallet.id
			},
			{ transaction: t }
		)

		const bundleContractsData = contractIds.map((contractId, i) => ({
			ContractId: contractId,
			BundleId: bundle.id,
			order: i
		}))

		await orm.models.BundleContract.bulkCreate(bundleContractsData, {
			transaction: t
		})

		await t.commit()

		return res.json({
			bundleId: bundle.id
		})
	}

	public static async updateBundle(
		req: IAuthenticatedRequest<MeemAPI.v1.UpdateBundle.IDefinition>,
		res: IResponse<MeemAPI.v1.UpdateBundle.IResponseBody>
	): Promise<Response> {
		const { bundleId } = req.params
		const { name, description, contractIds } = req.body

		const bundle = await orm.models.Bundle.findOne({
			where: {
				id: bundleId,
				CreatorId: req.wallet.id
			},
			include: [{ model: orm.models.BundleContract }]
		})

		if (!bundle) {
			throw new Error('BUNDLE_NOT_FOUND')
		}

		const newBundleContractsData: {
			BundleId: string
			ContractId: string
			order: number
		}[] = []

		const updateContractsData: {
			contractId: string
			order: number
		}[] = []

		const bundleContractIdsToDelete: string[] = []

		contractIds.forEach((contractId, i) => {
			const currentBundleContract = bundle?.BundleContracts?.find(
				bc => bc.ContractId?.toLowerCase() === contractId.toLowerCase()
			)
			if (currentBundleContract && currentBundleContract.order !== i) {
				updateContractsData.push({
					contractId,
					order: i
				})
			}

			if (!currentBundleContract) {
				newBundleContractsData.push({
					BundleId: bundle.id,
					ContractId: contractId,
					order: i
				})
			}
		})

		bundle.BundleContracts?.filter(bc => {
			const found = contractIds.find(cId => cId === bc.ContractId)
			if (!found) {
				bundleContractIdsToDelete.push(bc.id)
			}
		})

		const t = await orm.sequelize.transaction()

		const promises: Promise<any>[] = [
			orm.models.BundleContract.bulkCreate(newBundleContractsData, {
				transaction: t
			})
		]

		if (name !== bundle.name || description !== bundle.description) {
			bundle.name = name
			bundle.description = description
			promises.push(bundle.save({ transaction: t }))
		}

		if (bundleContractIdsToDelete.length > 0) {
			promises.push(
				orm.models.BundleContract.destroy({
					where: {
						id: bundleContractIdsToDelete
					},
					transaction: t
				})
			)
		}

		updateContractsData.forEach(uc => {
			promises.push(
				orm.models.BundleContract.update(
					{ order: uc.order },
					{
						where: {
							BundleId: bundle.id,
							ContractId: uc.contractId
						}
					}
				)
			)
		})

		await Promise.all(promises)

		await t.commit()

		return res.json({
			status: 'success'
		})
	}
}
