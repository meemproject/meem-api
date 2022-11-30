import { Validator } from '@meemproject/metadata'
import { Response } from 'express'
import { IRequest, IResponse } from '../types/app'
import { MeemAPI } from '../types/meem.generated'
export default class AgreementExtensionController {
	public static async createAgreementExtension(
		req: IRequest<MeemAPI.v1.CreateAgreementExtension.IDefinition>,
		res: IResponse<MeemAPI.v1.CreateAgreementExtension.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		const { slug, metadata } = req.body

		if (!slug || !metadata) {
			throw new Error('INVALID_PARAMETERS')
		}

		const agreement = await orm.models.Agreement.findOne({
			where: {
				id: req.params.agreementId
			}
		})

		if (!agreement) {
			throw new Error('MEEM_CONTRACT_NOT_FOUND')
		}

		const isAdmin = await services.agreement.isAgreementAdmin({
			agreementId: agreement.id,
			walletAddress: req.wallet.address
		})

		if (!isAdmin) {
			throw new Error('NOT_AUTHORIZED')
		}

		const extension = await orm.models.Extension.findOne({
			where: {
				slug
			}
		})

		if (!extension) {
			throw new Error('EXTENSION_NOT_FOUND')
		}

		const existingAgreementExtension =
			await orm.models.AgreementExtension.findOne({
				where: {
					AgreementId: agreement.id,
					ExtensionId: extension.id
				}
			})

		if (existingAgreementExtension) {
			return res.json({
				status: 'success'
			})
		}

		// Integration Verification
		// Can allow for third-party endpoint requests to verify information and return custom metadata
		switch (extension.id) {
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

				// metadata.isVerified = false

				// const verifiedTwitter = await services.twitter.verifyAgreementTwitter({
				// 	twitterUsername,
				// 	agreement
				// })

				// if (!verifiedTwitter) {
				// 	throw integrationError
				// }

				// metadata.isVerified = true
				// metadata.twitterUsername = verifiedTwitter.username
				// metadata.twitterProfileImageUrl =
				// 	verifiedTwitter.profile_image_url
				// metadata.twitterDisplayName = verifiedTwitter.name
				// metadata.twitterUserId = verifiedTwitter.id
				// metadata.externalUrl = `https://twitter.com/${verifiedTwitter.username}`

				break
			}
			case 'guild': {
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

				// metadata.isVerified = false

				// const verifiedTwitter = await services.twitter.verifyAgreementTwitter({
				// 	twitterUsername,
				// 	agreement
				// })

				// if (!verifiedTwitter) {
				// 	throw integrationError
				// }

				// metadata.isVerified = true
				// metadata.twitterUsername = verifiedTwitter.username
				// metadata.twitterProfileImageUrl =
				// 	verifiedTwitter.profile_image_url
				// metadata.twitterDisplayName = verifiedTwitter.name
				// metadata.twitterUserId = verifiedTwitter.id
				// metadata.externalUrl = `https://twitter.com/${verifiedTwitter.username}`

				break
			}
			default:
				break
		}

		try {
			const metadataValidator = new Validator({
				meem_metadata_type: 'Meem_AgreementExtension',
				meem_metadata_version: metadata.meem_metadata_version
			})
			const metadataValidatorResult = metadataValidator.validate(metadata)

			if (!metadataValidatorResult.valid) {
				log.crit(metadataValidatorResult.errors.map((e: any) => e.message))
				throw new Error('INVALID_METADATA')
			}
		} catch (e) {
			log.crit(e)
			throw new Error('INVALID_METADATA')
		}

		await orm.models.AgreementExtension.create({
			AgreementId: agreement.id,
			ExtensionId: extension.id,
			isEnabled: true,
			metadata
		})

		return res.json({
			status: 'success'
		})
	}

	public static async updateAgreementExtension(
		req: IRequest<MeemAPI.v1.UpdateAgreementExtension.IDefinition>,
		res: IResponse<MeemAPI.v1.UpdateAgreementExtension.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		const { agreementId, slug } = req.params
		const { metadata } = req.body

		if (!agreementId || !slug || !metadata) {
			throw new Error('INVALID_PARAMETERS')
		}

		const agreement = await orm.models.Agreement.findOne({
			where: {
				id: agreementId
			}
		})

		if (!agreement) {
			throw new Error('MEEM_CONTRACT_NOT_FOUND')
		}

		const isAdmin = await services.agreement.isAgreementAdmin({
			agreementId: agreement.id,
			walletAddress: req.wallet.address
		})

		if (!isAdmin) {
			throw new Error('NOT_AUTHORIZED')
		}

		const extension = await orm.models.Extension.findOne({
			where: {
				slug
			}
		})

		if (!extension) {
			throw new Error('EXTENSION_NOT_FOUND')
		}

		const agreementExtension = await orm.models.AgreementExtension.findOne({
			where: {
				AgreementId: agreement.id,
				ExtensionId: extension.id
			}
		})

		if (!agreementExtension) {
			throw new Error('EXTENSION_NOT_FOUND')
		}

		try {
			const metadataValidator = new Validator({
				meem_metadata_type: 'Meem_AgreementExtension',
				meem_metadata_version: metadata.meem_metadata_version
			})
			const metadataValidatorResult = metadataValidator.validate(metadata)

			if (!metadataValidatorResult.valid) {
				log.crit(metadataValidatorResult.errors.map((e: any) => e.message))
				throw new Error('INVALID_METADATA')
			}
		} catch (e) {
			log.crit(e)
			throw new Error('INVALID_METADATA')
		}

		agreementExtension.metadata = metadata

		await agreementExtension.save()

		return res.json({
			status: 'success'
		})
	}
}
