import { Response } from 'express'
import { IRequest, IResponse } from '../types/app'
import { MeemAPI } from '../types/meem.generated'
export default class AgreementRoleController {
	public static async createAgreementRole(
		_req: IRequest<MeemAPI.v1.CreateAgreementRole.IDefinition>,
		_res: IResponse<MeemAPI.v1.CreateAgreementRole.IResponseBody>
	): Promise<Response> {
		throw new Error('DEPRECATED')
		// if (!req.wallet) {
		// 	throw new Error('USER_NOT_LOGGED_IN')
		// }

		// if (!req.body.name) {
		// 	throw new Error('MISSING_PARAMETERS')
		// }

		// if (!req.body.metadata) {
		// 	throw new Error('MISSING_PARAMETERS')
		// }

		// await req.wallet.enforceTXLimit()

		// const agreement = await orm.models.Agreement.findOne({
		// 	where: {
		// 		id: req.params.agreementId
		// 	},
		// 	include: [
		// 		{
		// 			model: orm.models.Wallet,
		// 			as: 'Owner'
		// 		}
		// 	]
		// })

		// if (!agreement) {
		// 	throw new Error('AGREEMENT_NOT_FOUND')
		// }

		// const isAdmin = await agreement.isAdmin(req.wallet.address)

		// if (!isAdmin) {
		// 	throw new Error('NOT_AUTHORIZED')
		// }

		// const result = await services.agreement.createAgreement({
		// 	...req.body,
		// 	admins: agreement.Owner?.address ? [agreement.Owner?.address] : [],
		// 	chainId: agreement.chainId,
		// 	senderWalletAddress: req.wallet.address
		// })

		// return res.json(result)
	}

	public static async reinitialize(
		req: IRequest<MeemAPI.v1.ReInitializeAgreementRole.IDefinition>,
		res: IResponse<MeemAPI.v1.ReInitializeAgreementRole.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		await req.wallet.enforceTXLimit()

		const { agreementId, agreementRoleId } = req.params

		const result = await services.agreement.reinitializeAgreementOrRole({
			...req.body,
			agreementId,
			agreementRoleId,
			senderWalletAddress: req.wallet.address
		})

		return res.json(result)
	}

	public static async deleteAgreementRole(
		req: IRequest<MeemAPI.v1.DeleteAgreementRole.IDefinition>,
		res: IResponse<MeemAPI.v1.DeleteAgreementRole.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		const { agreementId, agreementRoleId } = req.params

		const agreement = await orm.models.Agreement.findOne({
			where: {
				id: agreementId
			}
		})

		if (!agreement) {
			throw new Error('AGREEMENT_NOT_FOUND')
		}

		const isAdmin = await agreement.isAdmin(req.wallet.address)

		if (!isAdmin) {
			throw new Error('NOT_AUTHORIZED')
		}

		const agreementRole = await orm.models.AgreementRole.findOne({
			where: {
				id: agreementRoleId
			}
		})

		if (!agreementRole) {
			throw new Error('MEEM_CONTRACT_ROLE_NOT_FOUND')
		}

		const promises: Promise<any>[] = []
		const t = await orm.sequelize.transaction()

		promises.push(
			orm.models.AgreementRole.destroy({
				where: {
					id: agreementRole.id
				},
				transaction: t
			})
		)

		await Promise.all(promises)
		await t.commit()

		return res.json({
			status: 'success'
		})
	}

	public static async bulkMint(
		req: IRequest<MeemAPI.v1.BulkMintAgreementRoleTokens.IDefinition>,
		res: IResponse<MeemAPI.v1.BulkMintAgreementRoleTokens.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		await req.wallet.enforceTXLimit()

		const { agreementId, agreementRoleId } = req.params

		const agreementRole = await orm.models.AgreementRole.findOne({
			where: {
				id: agreementRoleId
			}
		})

		if (!agreementRole) {
			throw new Error('AGREEMENT_NOT_FOUND')
		}

		const canMint = await agreementRole.canMint(req.wallet.address)
		if (!canMint) {
			throw new Error('NOT_AUTHORIZED')
		}

		const { txId } = await services.agreement.bulkMint({
			...req.body,
			mintedBy: req.wallet.address,
			agreementId,
			agreementRoleId
		})

		return res.json({
			txId
		})
	}

	public static async bulkBurn(
		req: IRequest<MeemAPI.v1.BulkBurnAgreementRoleTokens.IDefinition>,
		res: IResponse<MeemAPI.v1.BulkBurnAgreementRoleTokens.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		await req.wallet.enforceTXLimit()

		const { agreementId, agreementRoleId } = req.params

		const agreementRole = await orm.models.AgreementRole.findOne({
			where: {
				id: agreementRoleId
			}
		})

		if (!agreementRole) {
			throw new Error('AGREEMENT_NOT_FOUND')
		}

		const canMint = await agreementRole.canMint(req.wallet.address)
		if (!canMint) {
			throw new Error('NOT_AUTHORIZED')
		}

		const { txId } = await services.agreement.bulkBurn({
			...req.body,
			agreementId,
			agreementRoleId
		})

		return res.json({
			txId
		})
	}

	public static async getAgreementRoles(
		req: IRequest<MeemAPI.v1.GetAgreementRoles.IDefinition>,
		res: IResponse<MeemAPI.v1.GetAgreementRoles.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		const roles = await services.agreement.getAgreementRoles({
			agreementId: req.params.agreementId
		})
		return res.json({
			roles
		})
	}

	public static async getAgreementRole(
		req: IRequest<MeemAPI.v1.GetAgreementRole.IDefinition>,
		res: IResponse<MeemAPI.v1.GetAgreementRole.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		const roles = await services.agreement.getAgreementRoles({
			agreementId: req.params.agreementId,
			agreementRoleId: req.params.agreementRoleId
		})
		return res.json({
			role: roles[0]
		})
	}
}
