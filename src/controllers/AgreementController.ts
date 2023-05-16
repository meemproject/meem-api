import { ethers } from 'ethers'
import { Response } from 'express'
import { Op } from 'sequelize'
import { v4 as uuidv4 } from 'uuid'
import { transactionalTemplate } from '../lib/emailTemplate'
import { IAuthenticatedRequest, IRequest, IResponse } from '../types/app'
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
		const { name, metadata, isOnChain, chainId, tokenMetadata } = req.body

		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		if (!name) {
			throw new Error('MISSING_PARAMETERS')
		}

		if (!metadata) {
			throw new Error('MISSING_PARAMETERS')
		}

		if (!metadata) {
			throw new Error('INVALID_METADATA')
		}

		await req.wallet.enforceTXLimit()

		let result:
			| {
					deployContractTxId: string
					cutTxId: string
					mintTxId: string | undefined
					adminRoleDeployContractTxId: string | undefined
					adminRoleCutTxId: string | undefined
					adminRoleMintTxId: string | undefined
					setAdminRoleTxId: string | undefined
			  }
			| {
					agreementId: string
					slug: string
					adminAgreementId?: string
			  }

		if (isOnChain) {
			if (!chainId) {
				throw new Error('MISSING_PARAMETERS')
			}
			result = await services.agreement.createAgreement({
				...req.body,
				chainId,
				senderWalletAddress: req.wallet.address
			})
		} else {
			const { agreement, adminAgreement } =
				await services.agreement.createAgreementWithoutContract({
					body: req.body,
					owner: req.wallet
				})

			await Promise.all([
				services.agreement.bulkMint({
					agreementId: agreement.id,
					mintedBy: req.wallet.address,
					tokens: [
						{
							to: req.wallet.address,
							metadata: tokenMetadata
						}
					]
				}),
				adminAgreement
					? services.agreement.bulkMint({
							agreementId: agreement.id,
							agreementRoleId: adminAgreement.id,
							mintedBy: req.wallet.address,
							tokens: [
								{
									to: req.wallet.address,
									metadata: tokenMetadata
								}
							]
					  })
					: Promise.resolve(null)
			])
			result = {
				agreementId: agreement.id,
				slug: agreement.slug,
				adminAgreementId: adminAgreement?.id
			}
		}

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

		const result = await services.agreement.reinitializeAgreementOrRole({
			...req.body,
			agreementId,
			senderWalletAddress: req.wallet.address
		})

		return res.json(result)
	}

	public static async updateAgreement(
		req: IRequest<MeemAPI.v1.UpdateAgreement.IDefinition>,
		res: IResponse<MeemAPI.v1.UpdateAgreement.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		await req.wallet.enforceTXLimit()

		const { agreementId } = req.params

		await services.agreement.updateAgreement({
			agreementId,
			senderWalletAddress: req.wallet.address,
			updates: req.body
		})

		return res.json({
			status: 'success'
		})
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

	public static async bulkBurn(
		req: IAuthenticatedRequest<MeemAPI.v1.BulkBurnAgreementTokens.IDefinition>,
		res: IResponse<MeemAPI.v1.BulkBurnAgreementTokens.IResponseBody>
	): Promise<Response> {
		const { agreementId } = req.params

		const [agreement, agreementTokens] = await Promise.all([
			orm.models.Agreement.findOne({
				where: {
					id: agreementId
				}
			}),
			orm.models.AgreementToken.findAll({
				where: {
					AgreementId: agreementId,
					tokenId: {
						[Op.in]: req.body.tokenIds
					},
					OwnerId: req.wallet.id
				}
			})
		])

		if (!agreement) {
			throw new Error('AGREEMENT_NOT_FOUND')
		}

		const isAdmin = await agreement.isAdmin(req.wallet.address)
		if (!isAdmin) {
			agreementTokens.forEach(token => {
				if (token.OwnerId !== req.wallet?.id) {
					throw new Error('NOT_AUTHORIZED')
				}
			})
		}

		const result = await services.agreement.bulkBurn({
			...req.body,
			agreementId
		})

		return res.json(result)
	}

	public static async checkIsAgreementAdmin(
		req: IRequest<MeemAPI.v1.CheckIsAgreementAdmin.IDefinition>,
		res: IResponse<MeemAPI.v1.CheckIsAgreementAdmin.IResponseBody>
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

		const isAdmin = await agreement.isAdmin(req.wallet.address)

		return res.json({
			isAdmin
		})
	}

	public static async sendInvites(
		req: IAuthenticatedRequest<MeemAPI.v1.SendAgreementInvites.IDefinition>,
		res: IResponse<MeemAPI.v1.SendAgreementInvites.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		const { agreementId } = req.params
		const { to } = req.body

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

		const walletAddresses: string[] = []
		const emails: string[] = []

		to.forEach(t => {
			if (ethers.utils.isAddress(t)) {
				walletAddresses.push(ethers.utils.getAddress(t))
			} else {
				emails.push(t)
			}
		})

		const [agreementTokens, currentTokenId, wallets] = await Promise.all([
			orm.models.AgreementToken.findAll({
				where: {
					AgreementId: agreement.id
				},
				include: [
					{
						model: orm.models.Wallet,
						as: 'Owner',
						where: {
							address: {
								[Op.in]: walletAddresses
							}
						}
					}
				]
			}),
			orm.models.AgreementToken.count({
				where: {
					AgreementId: agreement.id
				}
			}),
			orm.models.Wallet.findAll({
				where: {
					address: {
						[Op.in]: walletAddresses
					}
				}
			})
		])

		const newAgreementTokens: Record<string, any>[] = []
		let tokenId = currentTokenId + 1
		for (let i = 0; i < walletAddresses.length; i++) {
			const walletAddress = walletAddresses[i]
			let wallet = wallets.find(w => w.address === walletAddress)
			if (!wallet) {
				wallet = await orm.models.Wallet.create({
					address: walletAddress
				})
			}
			const agreementToken = agreementTokens.find(t => t.OwnerId === wallet?.id)

			if (!agreementToken) {
				newAgreementTokens.push({
					id: uuidv4(),
					tokenId,
					AgreementId: agreement.id,
					OwnerId: wallet.id
				})

				tokenId++
			}
		}

		await orm.models.AgreementToken.bulkCreate(newAgreementTokens)
		const invitesData: Record<string, any>[] = []
		const subject = `You have been invited to join ${agreement.name}`

		for (let i = 0; i < emails.length; i++) {
			const email = emails[i]

			const code = uuidv4()

			invitesData.push({
				id: uuidv4(),
				code,
				AgreementId: agreement.id
			})

			await services.aws.sendEmail({
				to: [email],
				subject,
				body: transactionalTemplate({
					bodyText: `Click the button below to accept the invite and join ${agreement.name}`,
					ctaText: 'Accept Invite',
					ctaUrl: `${config.MEEM_DOMAIN}/invite?code=${code}`,
					subject,
					title: `Join ${agreement.name}`
				})
			})
		}

		await orm.models.Invite.bulkCreate(invitesData)

		return res.json({
			status: 'success'
		})
	}

	public static async acceptInvite(
		req: IAuthenticatedRequest<MeemAPI.v1.AcceptAgreementInvite.IDefinition>,
		res: IResponse<MeemAPI.v1.AcceptAgreementInvite.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		const { code } = req.body

		const { agreement, agreementToken } = await services.agreement.acceptInvite(
			{
				code,
				wallet: req.wallet
			}
		)

		return res.json({
			agreementId: agreement.id,
			agreementTokenId: agreementToken.id,
			name: agreement.name,
			slug: agreement.slug
		})
	}
}
