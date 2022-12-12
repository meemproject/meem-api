import { ethers } from 'ethers'
import { Response } from 'express'
import { IRequest, IResponse } from '../types/app'
import { MeemAPI } from '../types/meem.generated'
export default class AgreementController {
	public static async isSlugAvailable(
		req: IRequest<MeemAPI.v1.IsSlugAvailable.IDefinition>,
		res: IResponse<MeemAPI.v1.IsSlugAvailable.IResponseBody>
	): Promise<Response> {
		const { slug, chainId } = req.body
		if (!slug) {
			return res.json({
				isSlugAvailable: false
			})
		}

		const isSlugAvailable = await services.agreement.isSlugAvailable({
			slugToCheck: slug,
			chainId
		})

		return res.json({
			isSlugAvailable
		})
	}

	public static async createAgreement(
		req: IRequest<MeemAPI.v1.CreateAgreement.IDefinition>,
		res: IResponse<MeemAPI.v1.CreateAgreement.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		if (!req.body.name) {
			throw new Error('MISSING_PARAMETERS')
		}

		if (!req.body.metadata) {
			throw new Error('MISSING_PARAMETERS')
		}

		if (!req.body.metadata) {
			throw new Error('INVALID_METADATA')
		}

		await req.wallet.enforceTXLimit()

		const result = await services.agreement.createAgreement({
			...req.body,
			senderWalletAddress: req.wallet.address
		})

		return res.json(result)
	}

	public static async reInitialize(
		req: IRequest<MeemAPI.v1.ReInitializeAgreement.IDefinition>,
		res: IResponse<MeemAPI.v1.ReInitializeAgreement.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		await req.wallet.enforceTXLimit()

		const { agreementId } = req.params

		const result = await services.agreement.updateAgreement({
			...req.body,
			agreementId,
			senderWalletAddress: req.wallet.address
		})

		return res.json(result)
	}

	public static async setAgreementAdminRole(
		req: IRequest<MeemAPI.v1.SetAgreementAdminRole.IDefinition>,
		res: IResponse<MeemAPI.v1.SetAgreementAdminRole.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		await req.wallet.enforceTXLimit()

		const { agreementId } = req.params

		const result = await services.agreement.setAgreemetAdminRole({
			adminAgreementRoleId: req.body.adminAgreementRoleId,
			agreementId,
			senderWalletAddress: req.wallet.address
		})

		return res.json(result)
	}

	public static async createAgreementSafe(
		req: IRequest<MeemAPI.v1.CreateAgreementSafe.IDefinition>,
		res: IResponse<MeemAPI.v1.CreateAgreementSafe.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		await req.wallet.enforceTXLimit()

		const { agreementId } = req.params

		const result = await services.agreement.createAgreementSafe({
			...req.body,
			agreementId,
			senderWalletAddress: req.wallet.address
		})

		return res.json(result)
	}

	public static async setAgreementSafeAddress(
		req: IRequest<MeemAPI.v1.SetAgreementSafeAddress.IDefinition>,
		res: IResponse<MeemAPI.v1.SetAgreementSafeAddress.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		await req.wallet.enforceTXLimit()

		const { agreementId } = req.params

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

		agreement.gnosisSafeAddress = ethers.utils.getAddress(req.body.address)

		await agreement.save()

		return res.json({
			status: 'success'
		})
	}

	public static async upgradeAgreement(
		req: IRequest<MeemAPI.v1.UpgradeAgreement.IDefinition>,
		res: IResponse<MeemAPI.v1.UpgradeAgreement.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		await req.wallet.enforceTXLimit()

		const { agreementId } = req.params

		const result = await services.agreement.upgradeAgreement({
			...req.body,
			agreementId,
			senderWalletAddress: req.wallet.address
		})

		return res.json(result)
	}

	public static async getMintingProof(
		req: IRequest<MeemAPI.v1.GetMintingProof.IDefinition>,
		res: IResponse<MeemAPI.v1.GetMintingProof.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		const { agreementId } = req.params

		const agreement = await orm.models.Agreement.findOne({
			where: {
				id: agreementId
			}
		})

		if (!agreement) {
			throw new Error('AGREEMENT_NOT_FOUND')
		}

		const { proof } = await agreement.getMintingPermission(req.wallet.address)

		return res.json({
			proof
		})
	}

	public static async bulkMint(
		req: IRequest<MeemAPI.v1.BulkMintAgreementTokens.IDefinition>,
		res: IResponse<MeemAPI.v1.BulkMintAgreementTokens.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		await req.wallet.enforceTXLimit()

		const { agreementId } = req.params

		const agreement = await orm.models.Agreement.findOne({
			where: {
				id: agreementId
			}
		})

		if (!agreement) {
			throw new Error('AGREEMENT_NOT_FOUND')
		}

		const canMint = await agreement.canMint(req.wallet.address)
		if (!canMint) {
			throw new Error('NOT_AUTHORIZED')
		}

		const result = await services.agreement.bulkMint({
			...req.body,
			mintedBy: req.wallet.address,
			agreementId
		})

		return res.json(result)
	}
}
