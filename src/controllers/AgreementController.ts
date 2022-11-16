// import { randomBytes } from 'crypto'
// eslint-disable-next-line import/no-extraneous-dependencies
import AWS from 'aws-sdk'
// import { keccak256, toUtf8Bytes } from 'ethers/lib/utils'
import { Response } from 'express'
import _ from 'lodash'
// import request from 'superagent'
import { IRequest, IResponse } from '../types/app'
import { MeemAPI } from '../types/meem.generated'
export default class AgreementController {
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

		const isSlugAvailable = await services.agreement.isSlugAvailable({
			slugToCheck: req.body.slug,
			chainId: req.body.chainId
		})

		return res.json({
			isSlugAvailable
		})
	}

	// public static async updateAgreement(
	// 	req: IRequest<MeemAPI.v1.UpdateAgreement.IDefinition>,
	// 	res: IResponse<MeemAPI.v1.UpdateAgreement.IResponseBody>
	// ): Promise<Response> {
	// 	if (!req.wallet) {
	// 		throw new Error('USER_NOT_LOGGED_IN')
	// 	}

	// 	await req.wallet.enforceTXLimit()

	// 	const adminRole = config.ADMIN_ROLE
	// 	const agreement = await orm.models.Agreement.findOne({
	// 		where: {
	// 			id: req.params.agreementId
	// 		},
	// 		include: [
	// 			{
	// 				model: orm.models.Wallet,
	// 				where: {
	// 					address: req.wallet.address
	// 				},
	// 				through: {
	// 					where: {
	// 						role: adminRole
	// 					}
	// 				}
	// 			}
	// 		]
	// 	})

	// 	if (!agreement) {
	// 		throw new Error('MEEM_CONTRACT_NOT_FOUND')
	// 	}

	// 	if (agreement.Wallets && agreement.Wallets.length < 1) {
	// 		throw new Error('NOT_AUTHORIZED')
	// 	}

	// 	if (req.body.slug && req.body.slug !== agreement.slug) {
	// 		const isAvailable = await services.agreement.isSlugAvailable({
	// 			slugToCheck: req.body.slug,
	// 			chainId: agreement.chainId
	// 		})
	// 		if (!isAvailable) {
	// 			throw new Error('SLUG_UNAVAILABLE')
	// 		}

	// 		const slug = await services.agreement.generateSlug({
	// 			baseSlug: req.body.slug,
	// 			chainId: agreement.chainId
	// 		})

	// 		if (req.body.slug !== slug) {
	// 			throw new Error('INVALID_SLUG')
	// 		}

	// 		agreement.slug = slug
	// 	}

	// 	await agreement.save()

	// 	return res.json({
	// 		status: 'success'
	// 	})
	// }

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

		await req.wallet.enforceTXLimit()

		if (config.DISABLE_ASYNC_MINTING) {
			try {
				await services.agreement.createAgreement({
					...req.body,
					senderWalletAddress: req.wallet.address
				})
			} catch (e) {
				log.crit(e)
				sockets?.emitError(
					config.errors.CONTRACT_CREATION_FAILED,
					req.wallet.address
				)
			}
		} else {
			const lambda = new AWS.Lambda({
				accessKeyId: config.APP_AWS_ACCESS_KEY_ID,
				secretAccessKey: config.APP_AWS_SECRET_ACCESS_KEY,
				region: 'us-east-1'
			})

			await lambda
				.invoke({
					InvocationType: 'Event',
					FunctionName: config.LAMBDA_CREATE_CONTRACT_FUNCTION,
					Payload: JSON.stringify({
						...req.body,
						senderWalletAddress: req.wallet.address
					})
				})
				.promise()
		}

		return res.json({
			status: 'success'
		})
	}

	public static async createOrUpdateAgreementExtension(
		req: IRequest<MeemAPI.v1.CreateOrUpdateAgreementExtension.IDefinition>,
		res: IResponse<MeemAPI.v1.CreateOrUpdateAgreementExtension.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		const integrationMetadata = req.body.metadata ?? {}
		const adminRole = config.ADMIN_ROLE
		const agreement = await orm.models.Agreement.findOne({
			where: {
				id: req.params.agreementId
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
					model: orm.models.Extension
				}
			]
		})

		if (!agreement) {
			throw new Error('MEEM_CONTRACT_NOT_FOUND')
		}

		if (agreement.Wallets && agreement.Wallets.length < 1) {
			throw new Error('NOT_AUTHORIZED')
		}

		const integration = await orm.models.Extension.findOne({
			where: {
				id: req.params.integrationId
			}
		})

		if (!integration) {
			throw new Error('INTEGRATION_NOT_FOUND')
		}

		const existingAgreementExtension =
			await orm.models.AgreementExtension.findOne({
				where: {
					AgreementId: agreement.id,
					IntegrationId: integration.id
				}
			})

		// Integration Verification
		// Can allow for third-party endpoint requests to verify information and return custom metadata
		switch (integration.id) {
			case config.TWITTER_INTEGRATION_ID: {
				// let twitterUsername = req.body.metadata?.twitterUsername
				// 	? (req.body.metadata?.twitterUsername as string)
				// 	: null
				// twitterUsername = twitterUsername?.replace(/^@/g, '').trim() ?? null
				// const integrationError = new Error('INTEGRATION_FAILED')
				// integrationError.message = 'Twitter verification failed.'

				// if (
				// 	existingAgreementExtension &&
				// 	existingAgreementExtension.metadata?.isVerified &&
				// 	(!twitterUsername ||
				// 		twitterUsername ===
				// 			existingAgreementExtension.metadata?.twitterUsername)
				// ) {
				// 	break
				// }

				// if (!twitterUsername) {
				// 	throw integrationError
				// }

				// integrationMetadata.isVerified = false

				// const verifiedTwitter = await services.twitter.verifyAgreementTwitter({
				// 	twitterUsername,
				// 	agreement
				// })

				// if (!verifiedTwitter) {
				// 	throw integrationError
				// }

				// integrationMetadata.isVerified = true
				// integrationMetadata.twitterUsername = verifiedTwitter.username
				// integrationMetadata.twitterProfileImageUrl =
				// 	verifiedTwitter.profile_image_url
				// integrationMetadata.twitterDisplayName = verifiedTwitter.name
				// integrationMetadata.twitterUserId = verifiedTwitter.id
				// integrationMetadata.externalUrl = `https://twitter.com/${verifiedTwitter.username}`

				break
			}
			default:
				break
		}

		if (!existingAgreementExtension) {
			await orm.models.AgreementExtension.create({
				AgreementId: agreement.id,
				IntegrationId: integration.id,
				isEnabled: req.body.isEnabled ?? true,
				isPublic: req.body.isPublic ?? true,
				metadata: integrationMetadata
			})
		} else {
			if (!_.isUndefined(req.body.isEnabled)) {
				existingAgreementExtension.isEnabled = req.body.isEnabled
			}

			if (!_.isUndefined(req.body.isPublic)) {
				// existingAgreementExtension.isPublic = req.body.isPublic
			}

			if (integrationMetadata) {
				// TODO: Typecheck metadata
				// existingAgreementExtension.metadata = integrationMetadata
			}

			await existingAgreementExtension.save()
		}

		return res.json({
			status: 'success'
		})
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

		if (config.DISABLE_ASYNC_MINTING) {
			try {
				await services.agreement.updateAgreement({
					...req.body,
					agreementId,
					senderWalletAddress: req.wallet.address
				})
			} catch (e) {
				log.crit(e)
				sockets?.emitError(config.errors.MINT_FAILED, req.wallet.address)
			}
		} else {
			const lambda = new AWS.Lambda({
				accessKeyId: config.APP_AWS_ACCESS_KEY_ID,
				secretAccessKey: config.APP_AWS_SECRET_ACCESS_KEY,
				region: 'us-east-1'
			})
			await lambda
				.invoke({
					InvocationType: 'Event',
					FunctionName: config.LAMBDA_REINITIALIZE_FUNCTION_NAME,
					Payload: JSON.stringify({
						...req.body,
						agreementId,
						senderWalletAddress: req.wallet.address
					})
				})
				.promise()
		}

		return res.json({
			status: 'success'
		})
	}

	public static async createClubSafe(
		req: IRequest<MeemAPI.v1.CreateClubSafe.IDefinition>,
		res: IResponse<MeemAPI.v1.CreateClubSafe.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		await req.wallet.enforceTXLimit()

		const { agreementId } = req.params

		if (config.DISABLE_ASYNC_MINTING) {
			try {
				await services.agreement.createClubSafe({
					...req.body,
					agreementId,
					senderWalletAddress: req.wallet.address
				})
			} catch (e) {
				log.crit(e)
			}
		} else {
			const lambda = new AWS.Lambda({
				accessKeyId: config.APP_AWS_ACCESS_KEY_ID,
				secretAccessKey: config.APP_AWS_SECRET_ACCESS_KEY,
				region: 'us-east-1'
			})
			await lambda
				.invoke({
					InvocationType: 'Event',
					FunctionName: config.LAMBDA_CREATE_CLUB_SAFE_FUNCTION_NAME,
					Payload: JSON.stringify({
						...req.body,
						agreementId,
						senderWalletAddress: req.wallet.address
					})
				})
				.promise()
		}

		return res.json({
			status: 'success'
		})
	}

	public static async upgradeClub(
		req: IRequest<MeemAPI.v1.UpgradeClub.IDefinition>,
		res: IResponse<MeemAPI.v1.UpgradeClub.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		await req.wallet.enforceTXLimit()

		const { agreementId } = req.params

		if (config.DISABLE_ASYNC_MINTING) {
			try {
				await services.agreement.upgradeClub({
					...req.body,
					agreementId,
					senderWalletAddress: req.wallet.address
				})
			} catch (e) {
				log.crit(e)
			}
		} else {
			const lambda = new AWS.Lambda({
				accessKeyId: config.APP_AWS_ACCESS_KEY_ID,
				secretAccessKey: config.APP_AWS_SECRET_ACCESS_KEY,
				region: 'us-east-1'
			})
			await lambda
				.invoke({
					InvocationType: 'Event',
					FunctionName: config.UPGRADE_CLUB_FUNCTION_NAME,
					Payload: JSON.stringify({
						...req.body,
						agreementId,
						senderWalletAddress: req.wallet.address
					})
				})
				.promise()
		}

		return res.json({
			status: 'success'
		})
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
			throw new Error('MEEM_CONTRACT_NOT_FOUND')
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
			throw new Error('MEEM_CONTRACT_NOT_FOUND')
		}

		const canMint = await agreement.canMint(req.wallet.address)
		if (!canMint) {
			throw new Error('NOT_AUTHORIZED')
		}

		if (config.DISABLE_ASYNC_MINTING) {
			try {
				await services.agreement.bulkMint({
					...req.body,
					mintedBy: req.wallet.address,
					agreementId
				})
			} catch (e) {
				log.crit(e)
			}
		} else {
			const lambda = new AWS.Lambda({
				accessKeyId: config.APP_AWS_ACCESS_KEY_ID,
				secretAccessKey: config.APP_AWS_SECRET_ACCESS_KEY,
				region: 'us-east-1'
			})
			await lambda
				.invoke({
					InvocationType: 'Event',
					FunctionName: config.LAMBDA_AGREEMENT_BULK_MINT_FUNCTION,
					Payload: JSON.stringify({
						...req.body,
						mintedBy: req.wallet.address,
						agreementId
					})
				})
				.promise()
		}

		return res.json({
			status: 'success'
		})
	}
}
