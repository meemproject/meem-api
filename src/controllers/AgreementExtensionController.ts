import { IFacetVersion } from '@meemproject/meem-contracts'
import { ethers } from 'ethers'
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

		const {
			extensionId,
			isInitialized,
			isSetupComplete,
			metadata,
			externalLink /*, widget */
		} = req.body

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

		const [dbContract, bundle] = await Promise.all([
			orm.models.Contract.findOne({
				where: {
					id: config.MEEM_PROXY_CONTRACT_ID
				}
			}),
			orm.models.Bundle.findOne({
				where: {
					id: config.TABLELAND_CONTROLLER_BUNDLE_ID
				},
				include: [
					{
						model: orm.models.BundleContract,
						include: [
							{
								model: orm.models.Contract,
								include: [
									{
										model: orm.models.ContractInstance,
										where: {
											chainId: agreement.chainId
										}
									}
								]
							}
						]
					}
				]
			})
		])

		const t = await orm.sequelize.transaction()

		if (!dbContract || !bundle) {
			throw new Error('CONTRACT_NOT_FOUND')
		}

		const agreementExtension = await orm.models.AgreementExtension.build({
			AgreementId: agreement.id,
			ExtensionId: extension.id,
			metadata,
			isInitialized: isInitialized ?? false,
			isSetupComplete: isSetupComplete ?? false
		})

		const txIds: string[] = []

		const toVersion: IFacetVersion[] = []

		bundle?.BundleContracts?.forEach(bc => {
			if (
				!bc.Contract?.ContractInstances ||
				!bc.Contract?.ContractInstances[0]
			) {
				throw new Error('CONTRACT_INSTANCE_NOT_FOUND')
			}
			toVersion.push({
				address: bc.Contract.ContractInstances[0].address,
				functionSelectors: bc.functionSelectors
			})
		})

		// TODO: Finish tableland creation process
		if (extension.storageDefinition.tableland?.tables) {
			for (
				let i = 0;
				i < extension.storageDefinition.tableland.tables.length;
				i++
			) {
				const def = extension.storageDefinition.tableland.tables[i]

				const iFace = new ethers.utils.Interface(bundle.abi)

				// By default we'll let any agreement member insert data and let admins manage
				const functionCall = iFace.encodeFunctionData('initialize', [
					{
						...def.permissions,
						insertRoleContract: agreement.address,
						adminRoleContract:
							agreement.adminContractAddress ?? ethers.constants.AddressZero
					}
				])

				const { wallet } = await services.ethers.getProvider({
					chainId: agreement.chainId
				})

				// Create the tableland table
				const txId = await services.ethers.queueCreateTablelandTable({
					chainId: agreement.chainId,
					tableName: def.name,
					columns: def.schema,
					agreementExtensionId: agreementExtension.id,
					abi: dbContract.abi,
					args: [req.wallet.address, [req.wallet.address, wallet.address]],
					bytecode: dbContract.bytecode,
					fromVersion: [],
					toVersion,
					functionCall
				})

				txIds.push(txId)
			}
		}

		agreementExtension.metadata = {
			...agreementExtension.metadata,
			transactions: txIds.map(txId => ({
				TransactionId: txId,
				status: MeemAPI.TransactionStatus.Pending
			}))
		}

		const promises: Promise<any>[] = [
			agreementExtension.save({
				transaction: t
			})
		]

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

		if (
			extension.widgetDefinition &&
			extension.widgetDefinition.widgets &&
			extension.widgetDefinition.widgets.length > 0
		) {
			extension.widgetDefinition.widgets.forEach(w => {
				promises.push(
					orm.models.AgreementExtensionWidget.create(
						{
							AgreementExtensionId: agreementExtension.id,
							metadata: w.metadata,
							visibility: w.visibility
						},
						{
							transaction: t
						}
					)
				)
			})
		}

		// if (widget) {
		// 	promises.push(
		// 		orm.models.AgreementExtensionWidget.create(
		// 			{
		// 				AgreementExtensionId: agreementExtension.id,
		// 				metadata: widget.metadata,
		// 				visibility: widget.visibility
		// 			},
		// 			{
		// 				transaction: t
		// 			}
		// 		)
		// 	)
		// }

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
		const { isInitialized, isSetupComplete, metadata, externalLink, widget } =
			req.body

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

		if (!_.isUndefined(isInitialized)) {
			agreementExtension.isInitialized = isInitialized
			promises.push(agreementExtension.save({ transaction: t }))
		}

		if (!_.isUndefined(isSetupComplete)) {
			agreementExtension.isSetupComplete = isSetupComplete
			promises.push(agreementExtension.save({ transaction: t }))
		}

		if (!_.isUndefined(externalLink)) {
			if (externalLink && agreementExtension.AgreementExtensionLink) {
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
			} else if (
				externalLink === null &&
				agreementExtension.AgreementExtensionLink
			) {
				await agreementExtension.AgreementExtensionLink.destroy()
			} else if (externalLink) {
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

		if (!_.isUndefined(widget)) {
			if (widget && agreementExtension.AgreementExtensionWidget) {
				agreementExtension.AgreementExtensionWidget.isEnabled = !_.isUndefined(
					widget.isEnabled
				)
					? widget.isEnabled
					: agreementExtension.AgreementExtensionWidget.isEnabled
				agreementExtension.AgreementExtensionWidget.metadata =
					widget.metadata ??
					agreementExtension.AgreementExtensionWidget.metadata
				agreementExtension.AgreementExtensionWidget.visibility =
					widget.visibility ??
					agreementExtension.AgreementExtensionWidget.visibility
				promises.push(
					agreementExtension.AgreementExtensionWidget.save({ transaction: t })
				)
			} else if (
				widget === null &&
				agreementExtension.AgreementExtensionWidget
			) {
				await agreementExtension.AgreementExtensionWidget.destroy()
			} else if (widget) {
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
