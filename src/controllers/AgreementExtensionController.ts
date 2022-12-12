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

		const { extensionId, metadata, externalLink, widget } = req.body

		if (!extensionId) {
			throw new Error('MISSING_PARAMETERS')
		}

		const agreement = await orm.models.Agreement.findOne({
			where: {
				id: req.params.agreementId
			}
		})

		if (!agreement) {
			throw new Error('AGREEMENT_NOT_FOUND')
		}

		const isAdmin = await agreement.isAdmin(req.wallet.address)

		if (!isAdmin) {
			throw new Error('NOT_AUTHORIZED')
		}

		const extension = await orm.models.Extension.findOne({
			where: {
				id: extensionId
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
			throw new Error('EXTENSION_ALREADY_ADDED')
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

		const txIds: string[] = []

		if (extension.storageDefinition.tableland?.tables) {
			const tableNames = Object.keys(
				extension.storageDefinition.tableland?.tables
			)
			for (let i = 0; i < tableNames.length; i++) {
				const tableName = tableNames[i]

				// Create the tableland table
				const txId = await services.ethers.queueCreateTablelandTable({
					chainId: agreement.chainId,
					tableName,
					columns: extension.storageDefinition.tableland.tables[tableName],
					agreementExtensionId: agreementExtension.id
				})

				txIds.push(txId)
			}
		}

		const t = await orm.sequelize.transaction()

		const promises: Promise<any>[] = []

		if (externalLink) {
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

		if (widget) {
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

		await Promise.all(promises)
		await t.commit()

		return res.json({
			status: 'success',
			txIds
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
			throw new Error('AGREEMENT_NOT_FOUND')
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
				agreementExtension.AgreementExtensionLink.label =
					externalLink.label ?? agreementExtension.AgreementExtensionLink.label
				agreementExtension.AgreementExtensionLink.url =
					externalLink.url ?? agreementExtension.AgreementExtensionLink.url
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
