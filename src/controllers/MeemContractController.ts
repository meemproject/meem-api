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
		// TODO: 🚨 refactor this to work with any contract type
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

		if (!req.body.name) {
			throw new Error('MISSING_PARAMETERS')
		}

		if (!req.body.admins) {
			throw new Error('MISSING_PARAMETERS')
		}

		if (!req.body.metadata) {
			throw new Error('MISSING_PARAMETERS')
		}

		try {
			const contractAddress = await services.meemContract.createMeemContract({
				name: req.body.name,
				admins: req.body.admins,
				metadata: req.body.metadata
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

		const integrationMetadata = req.body.metadata ?? {}
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

		const integration = await orm.models.Integration.findOne({
			where: {
				id: req.params.integrationId
			}
		})

		if (!integration) {
			throw new Error('INTEGRATION_NOT_FOUND')
		}

		const existingMeemContractIntegration =
			await orm.models.MeemContractIntegration.findOne({
				where: {
					MeemContractId: meemContract.id,
					IntegrationId: integration.id
				}
			})

		// Integration Verification
		// Can allow for third-party endpoint requests to verify information and return custom metadata
		switch (integration.id) {
			case config.TWITTER_INTEGRATION_ID: {
				let twitterUsername = req.body.metadata?.twitterUsername
					? (req.body.metadata?.twitterUsername as string)
					: null
				twitterUsername = twitterUsername?.replace(/^@/g, '').trim() ?? null
				const integrationError = new Error('INTEGRATION_FAILED')
				integrationError.message = 'Twitter verification failed.'

				if (
					existingMeemContractIntegration &&
					existingMeemContractIntegration.metadata?.isVerified &&
					(!twitterUsername ||
						twitterUsername ===
							existingMeemContractIntegration.metadata?.twitterUsername)
				) {
					break
				}

				if (!twitterUsername) {
					throw integrationError
				}

				integrationMetadata.isVerified = false

				const verifiedTwitter =
					await services.twitter.verifyMeemContractTwitter({
						twitterUsername,
						meemContract
					})

				if (!verifiedTwitter) {
					throw integrationError
				}

				integrationMetadata.isVerified = true
				integrationMetadata.twitterUsername = verifiedTwitter.username
				integrationMetadata.twitterUserId = verifiedTwitter.id
				integrationMetadata.externalUrl = `https://twitter.com/${verifiedTwitter.username}`

				break
			}
			default:
				break
		}

		if (!existingMeemContractIntegration) {
			await orm.models.MeemContractIntegration.create({
				MeemContractId: meemContract.id,
				IntegrationId: integration.id,
				isEnabled: req.body.isEnabled ?? true,
				isPublic: req.body.isPublic ?? true,
				metadata: integrationMetadata
			})
		} else {
			if (!_.isUndefined(req.body.isEnabled)) {
				existingMeemContractIntegration.isEnabled = req.body.isEnabled
			}

			if (!_.isUndefined(req.body.isPublic)) {
				existingMeemContractIntegration.isPublic = req.body.isPublic
			}

			if (integrationMetadata) {
				// TODO: Typecheck metadata
				existingMeemContractIntegration.metadata = integrationMetadata
			}

			await existingMeemContractIntegration.save()
		}

		return res.json({
			status: 'success'
		})
	}
}
