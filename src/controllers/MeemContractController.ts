// eslint-disable-next-line import/no-extraneous-dependencies
import { Response } from 'express'
import _ from 'lodash'
import { IRequest, IResponse } from '../types/app'
import { MeemAPI } from '../types/meem.generated'

export default class MeemContractController {
	public static async isSlugAvailable(
		req: IRequest<MeemAPI.v1.IsSlugAvailable.IDefinition>,
		res: IResponse<MeemAPI.v1.IsSlugAvailable.IResponseBody>
	): Promise<Response> {
		// if (!req.meemId) {
		// 	throw new Error('USER_NOT_LOGGED_IN')
		// }

		// if (!req.meemId.MeemPass) {
		// 	throw new Error('MEEMPASS_NOT_FOUND')
		// }

		if (!req.body.slug) {
			return res.json({
				isSlugAvailable: false
			})
		}

		const isSlugAvailable = await services.meemContract.isSlugAvailable(
			req.body.slug
		)

		return res.json({
			isSlugAvailable
		})
	}

	public static async updateMeemContract(
		req: IRequest<MeemAPI.v1.UpdateMeemContract.IDefinition>,
		res: IResponse<MeemAPI.v1.UpdateMeemContract.IResponseBody>
	): Promise<Response> {
		// TODO: Remove hard-coded wallet
		// const walletAddress = '0xa6567b5c1730faad90a62bf3dfc4e8fddd7f1ab1'
		// const wallet = await orm.models.Wallet.findOne({
		// 	where: {
		// 		address: walletAddress
		// 	}
		// })

		// if (!wallet) {
		// 	throw new Error('USER_NOT_LOGGED_IN')
		// }

		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		const genericMeemContract = await services.meem.getMeemContract()
		const adminRole = await genericMeemContract.ADMIN_ROLE()
		const meemContract = await orm.models.MeemContract.findOne({
			where: {
				id: req.params.meemContractId
			},
			include: [
				{
					model: orm.models.Wallet,
					where: {
						address: req.wallet.address
					},
					through: {
						where: {
							role: adminRole
						}
					}
				}
			]
		})

		if (!meemContract) {
			throw new Error('MEEM_CONTRACT_NOT_FOUND')
		}

		if (meemContract.Wallets.length < 1) {
			throw new Error('NOT_AUTHORIZED')
		}

		if (req.body.slug && req.body.slug !== meemContract.slug) {
			const isAvailable = await services.meemContract.isSlugAvailable(
				req.body.slug
			)
			if (!isAvailable) {
				throw new Error('SLUG_UNAVAILABLE')
			}

			const slug = await services.meemContract.generateSlug(req.body.slug)

			if (req.body.slug !== slug) {
				throw new Error('INVALID_SLUG')
			}

			meemContract.slug = slug
		}

		await meemContract.save()

		return res.json({
			status: 'success'
		})
	}

	public static async createMeemContract(
		req: IRequest<MeemAPI.v1.CreateMeemContract.IDefinition>,
		res: IResponse<MeemAPI.v1.CreateMeemContract.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		try {
			const contractAddress = await services.meemContract.createMeemContract({
				clubContractAddress: req.body.clubContractAddress,
				name: req.body.name,
				description: req.body.description,
				admins: req.body.admins
			})

			return res.json({
				address: contractAddress
			})
		} catch (e) {
			log.crit(e)
			throw new Error('SERVER_ERROR')
		}
	}

	public static async createOrUpdateMeemContractIntegration(
		req: IRequest<MeemAPI.v1.CreateOrUpdateMeemContractIntegration.IDefinition>,
		res: IResponse<MeemAPI.v1.CreateOrUpdateMeemContractIntegration.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		const genericMeemContract = await services.meem.getMeemContract()
		const adminRole = await genericMeemContract.ADMIN_ROLE()
		const meemContract = await orm.models.MeemContract.findOne({
			where: {
				id: req.params.meemContractId
			},
			include: [
				{
					model: orm.models.Wallet,
					where: {
						address: req.wallet.address
					},
					through: {
						where: {
							role: adminRole
						}
					}
				},
				{
					model: orm.models.Integration
				}
			]
		})

		if (!meemContract) {
			throw new Error('MEEM_CONTRACT_NOT_FOUND')
		}

		if (meemContract.Wallets.length < 1) {
			throw new Error('NOT_AUTHORIZED')
		}

		const existingIntegration = meemContract.Integrations.find(
			i => i.id === req.params.integrationId
		)

		if (!existingIntegration) {
			const integration = await orm.models.Integration.findOne({
				where: {
					id: req.params.integrationId
				}
			})

			if (!integration) {
				throw new Error('INTEGRATION_NOT_FOUND')
			}

			await orm.models.MeemContractIntegration.create({
				MeemContractId: meemContract.id,
				IntegrationId: integration.id,
				isEnabled: req.body.isEnabled ?? true,
				isPublic: req.body.isPublic ?? true,
				metadata: req.body.metadata ?? {}
			})
		} else {
			const existingMeemContractIntegration =
				await orm.models.MeemContractIntegration.findOne({
					where: {
						MeemContractId: meemContract.id,
						IntegrationId: existingIntegration.id
					}
				})

			if (!existingMeemContractIntegration) {
				throw new Error('INTEGRATION_NOT_FOUND')
			}

			if (!_.isUndefined(req.body.isEnabled)) {
				existingMeemContractIntegration.isEnabled = req.body.isEnabled
			}

			if (!_.isUndefined(req.body.isPublic)) {
				existingMeemContractIntegration.isPublic = req.body.isPublic
			}

			if (req.body.metadata) {
				// TODO: Typecheck metadata
				existingMeemContractIntegration.metadata = req.body.metadata
			}

			await existingMeemContractIntegration.save()
		}

		return res.json({
			status: 'success'
		})
	}
}
