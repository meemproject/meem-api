import { Response } from 'express'
import _ from 'lodash'
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

		const { slug, metadata, externalLink, widget } = req.body

		if (!slug) {
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

		const isAdmin = await agreement.isAdmin(req.wallet.address)

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

		// TODO: Validate widget/role/custom extension metadata?
		// try {
		// 	const metadataValidator = new Validator({
		// 		meem_metadata_type: 'Meem_AgreementExtension',
		// 		meem_metadata_version: metadata.meem_metadata_version
		// 	})
		// 	const metadataValidatorResult = metadataValidator.validate(metadata)

		// 	if (!metadataValidatorResult.valid) {
		// 		log.crit(metadataValidatorResult.errors.map((e: any) => e.message))
		// 		throw new Error('INVALID_METADATA')
		// 	}
		// } catch (e) {
		// 	log.crit(e)
		// 	throw new Error('INVALID_METADATA')
		// }

		const agreementExtension = await orm.models.AgreementExtension.create({
			AgreementId: agreement.id,
			ExtensionId: extension.id,
			metadata
		})

		const t = await orm.sequelize.transaction()

		const promises: Promise<any>[] = []

		if (externalLink) {
			promises.push(
				orm.models.AgreementExtensionLink.create(
					{
						AgreementExtensionId: agreementExtension.id,
						url: externalLink.url,
						label: externalLink.label,
						visibility: externalLink.visibility
					},
					{
						transaction: t
					}
				)
			)
		}

		if (widget) {
			promises.push(
				orm.models.AgreementExtensionWidget.create(
					{
						AgreementExtensionId: agreementExtension.id,
						metadata: widget.metadata,
						visibility: widget.visibility
					},
					{
						transaction: t
					}
				)
			)
		}

		await Promise.all(promises)
		await t.commit()

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

		const { agreementId, agreementExtensionId } = req.params
		const { metadata, externalLink, widget } = req.body

		if (!agreementId || !agreementExtensionId) {
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

		const isAdmin = await agreement.isAdmin(req.wallet.address)

		if (!isAdmin) {
			throw new Error('NOT_AUTHORIZED')
		}

		const agreementExtension = await orm.models.AgreementExtension.findOne({
			where: {
				id: agreementExtensionId
			},
			include: [
				{
					model: orm.models.AgreementExtensionLink
				},
				{
					model: orm.models.AgreementExtensionWidget
				}
			]
		})

		if (!agreementExtension) {
			throw new Error('EXTENSION_NOT_FOUND')
		}

		// TODO: Validate extension metadata?
		// try {
		// 	const metadataValidator = new Validator({
		// 		meem_metadata_type: 'Meem_AgreementExtension',
		// 		meem_metadata_version: metadata.meem_metadata_version
		// 	})
		// 	const metadataValidatorResult = metadataValidator.validate(metadata)

		// 	if (!metadataValidatorResult.valid) {
		// 		log.crit(metadataValidatorResult.errors.map((e: any) => e.message))
		// 		throw new Error('INVALID_METADATA')
		// 	}
		// } catch (e) {
		// 	log.crit(e)
		// 	throw new Error('INVALID_METADATA')
		// }

		const t = await orm.sequelize.transaction()

		const promises: Promise<any>[] = []

		if (metadata) {
			agreementExtension.metadata = metadata
			promises.push(agreementExtension.save({ transaction: t }))
		}

		if (externalLink) {
			if (agreementExtension.AgreementExtensionLink) {
				agreementExtension.AgreementExtensionLink.isEnabled = !_.isUndefined(
					externalLink.isEnabled
				)
					? externalLink.isEnabled
					: agreementExtension.AgreementExtensionLink.isEnabled
				agreementExtension.AgreementExtensionLink.label =
					externalLink.label ?? agreementExtension.AgreementExtensionLink.label
				agreementExtension.AgreementExtensionLink.url =
					externalLink.url ?? agreementExtension.AgreementExtensionLink.url
				agreementExtension.AgreementExtensionLink.visibility =
					externalLink.visibility ??
					agreementExtension.AgreementExtensionLink.visibility
				promises.push(
					agreementExtension.AgreementExtensionLink.save({ transaction: t })
				)
			} else {
				promises.push(
					orm.models.AgreementExtensionLink.create(
						{
							AgreementExtensionId: agreementExtension.id,
							url: externalLink.url,
							label: externalLink.label
						},
						{
							transaction: t
						}
					)
				)
			}
		}

		if (widget) {
			if (agreementExtension.AgreementExtensionWidget) {
				agreementExtension.AgreementExtensionWidget.isEnabled = !_.isUndefined(
					widget.isEnabled
				)
					? widget.isEnabled
					: agreementExtension.AgreementExtensionWidget.isEnabled
				agreementExtension.AgreementExtensionWidget.metadata =
					widget.metadata ??
					agreementExtension.AgreementExtensionWidget.metadata
				promises.push(
					agreementExtension.AgreementExtensionWidget.save({ transaction: t })
				)
			} else {
				promises.push(
					orm.models.AgreementExtensionWidget.create(
						{
							AgreementExtensionId: agreementExtension.id,
							isEnabled: widget.isEnabled,
							metadata: widget.metadata
						},
						{
							transaction: t
						}
					)
				)
			}
		}

		await Promise.all(promises)
		await t.commit()

		return res.json({
			status: 'success'
		})
	}
}
