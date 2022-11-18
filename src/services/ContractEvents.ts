import { MeemMetadataLike, Validator } from '@meemproject/metadata'
import { ethers } from 'ethers'
// import { IGunChainReference } from 'gun/types/chain'
import { DateTime } from 'luxon'
import { Op } from 'sequelize'
import { v4 as uuidv4 } from 'uuid'
// import meemABI from '../abis/Meem.json'
// import { wait } from '../lib/utils'
import Agreement from '../models/Agreement'
import AgreementRole from '../models/AgreementRole'
import AgreementRoleToken from '../models/AgreementRoleToken'
import AgreementToken from '../models/AgreementToken'
import Wallet from '../models/Wallet'
import {
	ContractInfoStruct,
	MeemPermissionStruct,
	MeemSplitsSetEvent,
	MeemTransferEvent,
	SplitStructOutput,
	Mycontract,
	MeemAdminContractSetEvent
} from '../types/Meem'
import { MeemAPI } from '../types/meem.generated'

export default class ContractEvent {
	// TODO: sync reactions?
	// public static async meemSyncReactions() {
	// 	log.debug('Syncing reactions...')
	// 	const provider = await services.ethers.getProvider()

	// 	const genericAgreement = new Contract(MeemAPI.zeroAddress, meemABI)
	// 	// ) as unknown as AgreementType

	// 	const topics = {
	// 		MeemTokenReactionAdded: `MeemTokenReactionAdded(uint256,address,string,uint256)`,
	// 		MeemTokenReactionRemoved: `MeemTokenReactionRemoved(uint256,address,string,uint256)`
	// 	}

	// 	const logs = await provider.getLogs({
	// 		fromBlock: 0,
	// 		toBlock: 'latest',
	// 		topics: [
	// 			[
	// 				utils.id(topics.MeemTokenReactionAdded),
	// 				utils.id(topics.MeemTokenReactionRemoved)
	// 			]
	// 		]
	// 	})

	// 	log.debug(`Syncing ${logs.length} reaction added/remvoed events`)

	// 	for (let i = 0; i < logs.length; i += 1) {
	// 		try {
	// 			const parsedLog = genericAgreement.interface.parseLog({
	// 				data: logs[i].data,
	// 				topics: logs[i].topics
	// 			})

	// 			// eslint-disable-next-line no-await-in-loop
	// 			const block = await provider.getBlock(logs[i].blockHash)

	// 			if (parsedLog.topic === topics.MeemTokenReactionAdded) {
	// 				const eventData =
	// 					parsedLog.args as unknown as MeemTokenReactionAddedEventObject
	// 				// eslint-disable-next-line no-await-in-loop
	// 				await this.meemHandleTokenReactionAdded({
	// 					address: logs[i].address,
	// 					transactionTimestamp:
	// 						block?.timestamp || DateTime.now().toSeconds(),
	// 					eventData
	// 				})
	// 			} else if (parsedLog.topic === topics.MeemTokenReactionRemoved) {
	// 				const eventData =
	// 					parsedLog.args as unknown as MeemTokenReactionRemovedEventObject
	// 				// eslint-disable-next-line no-await-in-loop
	// 				await this.meemHandleTokenReactionRemoved({
	// 					address: logs[i].address,
	// 					eventData
	// 				})
	// 			}
	// 			log.debug(logs[i].blockNumber)
	// 		} catch (e) {
	// 			log.crit(e)
	// 		}
	// 	}
	// }

	// public static async agreementSync(specificEvents?: Log[]) {
	// 	log.debug('Syncing Agreements...')
	// 	const provider = await services.ethers.getProvider()
	// 	const logs =
	// 		specificEvents ??
	// 		(await provider.getLogs({
	// 			fromBlock: 0,
	// 			toBlock: 'latest',
	// 			topics: [[utils.id('AgreementInitialized(address)')]]
	// 		}))

	// 	log.debug(`Syncing ${logs.length} initialized events`)

	// 	const failedEvents: Log[] = []

	// 	for (let i = 0; i < logs.length; i += 1) {
	// 		try {
	// 			log.debug(`Syncing ${i + 1} / ${logs.length} events`)

	// 			// eslint-disable-next-line no-await-in-loop
	// 			await this.meemHandleContractInitialized({
	// 				address: logs[i].address
	// 			})
	// 			// eslint-disable-next-line no-await-in-loop
	// 			await wait(500)
	// 		} catch (e) {
	// 			failedEvents.push(logs[i])
	// 			log.crit(e)
	// 			log.debug(logs[i])
	// 		}
	// 	}

	// 	if (failedEvents.length > 0) {
	// 		log.debug(`Completed with ${failedEvents.length} failed events`)
	// 		// log.debug(`Retrying ${failedEvents.length} events`)
	// 		// await this.agreementSync(failedEvents)
	// 	}
	// }

	// public static async meemSync(specificEvents?: Log[]) {
	// 	log.debug('Syncing meems...')
	// 	const provider = await services.ethers.getProvider()

	// 	const genericAgreement = new Contract(
	// 		MeemAPI.zeroAddress,
	// 		meemABI
	// 	) as unknown as Mycontract

	// 	const logs =
	// 		specificEvents ??
	// 		(await provider.getLogs({
	// 			fromBlock: 0,
	// 			toBlock: 'latest',
	// 			topics: [[utils.id('MeemTransfer(address,address,uint256)')]]
	// 		}))

	// 	const failedEvents: Log[] = []

	// 	for (let i = 0; i < logs.length; i += 1) {
	// 		try {
	// 			log.debug(`Syncing ${i + 1} / ${logs.length} events`)

	// 			const parsedLog = genericAgreement.interface.parseLog({
	// 				data: logs[i].data,
	// 				topics: logs[i].topics
	// 			})

	// 			const eventData = parsedLog.args as MeemTransferEvent['args']

	// 			// eslint-disable-next-line no-await-in-loop
	// 			const block = await provider.getBlock(logs[i].blockHash)
	// 			// eslint-disable-next-line no-await-in-loop
	// 			await this.meemHandleTransfer({
	// 				address: logs[i].address,
	// 				transactionHash: logs[i].transactionHash,
	// 				transactionTimestamp: block.timestamp,
	// 				eventData
	// 			})
	// 			// eslint-disable-next-line no-await-in-loop
	// 			await wait(500)
	// 		} catch (e) {
	// 			failedEvents.push(logs[i])
	// 			log.crit(e)
	// 			log.debug(logs[i])
	// 		}
	// 	}

	// 	if (failedEvents.length > 0) {
	// 		log.debug(`Completed with ${failedEvents.length} failed events`)
	// 		// log.debug(`Retrying ${failedEvents.length} events`)
	// 		// await this.meemSync(failedEvents)
	// 	}
	// }

	public static async meemHandleContractInitialized(args: {
		address: string
		chainId: number
	}): Promise<Agreement | AgreementRole | null> {
		const { address, chainId } = args
		const agreementOrRoleContract = (await services.meem.getAgreement({
			address,
			chainId
		})) as unknown as Mycontract

		let contractInfo: ContractInfoStruct

		// TODO: Parse metadata and create database models for contract type (Check if exist first)
		// TODO: Parse associations from metadata and create database associations (Check if exist first)

		try {
			contractInfo = await agreementOrRoleContract.getContractInfo()
		} catch (e) {
			log.debug(e)
			log.debug('getContractInfo function not available. Skipping')
			return null
		}

		const metadata = (await services.meem.getErc721Metadata(
			contractInfo.contractURI as string
		)) as MeemMetadataLike

		if (metadata.meem_contract_type) {
			// Don't index contract if not a valid meem_contract_type
			const contractMetadataValidator = new Validator(metadata)
			const contractMetadataValidatorResult =
				contractMetadataValidator.validate(metadata)

			if (!contractMetadataValidatorResult.valid) {
				log.crit(
					contractMetadataValidatorResult.errors.map((e: any) => e.message)
				)
				return null
			}
		} else {
			log.crit('Invalid metadata.')
			return null
		}

		const isRoleAgreement = metadata.meem_contract_type === 'meem-club-role'

		const existingAgreementOrRole = isRoleAgreement
			? await orm.models.AgreementRole.findOne({
					where: {
						address
					}
			  })
			: await orm.models.Agreement.findOne({
					where: {
						address
					}
			  })

		let slug = existingAgreementOrRole?.slug

		if (!existingAgreementOrRole || !slug) {
			try {
				slug = isRoleAgreement
					? await services.agreementRole.generateSlug({
							baseSlug: contractInfo.name as string,
							chainId
					  })
					: await services.agreement.generateSlug({
							baseSlug: contractInfo.name as string,
							chainId
					  })
			} catch (e) {
				log.crit('Something went wrong while creating slug', e)
				slug = uuidv4()
			}
		}

		const mintPermissions = contractInfo.mintPermissions.map(p => ({
			permission: p.permission,
			addresses: p.addresses,
			numTokens: ethers.BigNumber.from(p.numTokens).toHexString(),
			mintEndTimestamp: ethers.BigNumber.from(p.mintEndTimestamp).toNumber(),
			mintStartTimestamp: ethers.BigNumber.from(
				p.mintStartTimestamp
			).toNumber(),
			costWei: ethers.BigNumber.from(p.costWei).toHexString(),
			merkleRoot: p.merkleRoot
		}))

		// Merge addresses by merkle root if we can
		if (existingAgreementOrRole) {
			mintPermissions.forEach(mp => {
				const existingMintPermission =
					existingAgreementOrRole.mintPermissions.find(
						emp => emp.merkleRoot === mp.merkleRoot
					)
				if (existingMintPermission) {
					// eslint-disable-next-line no-param-reassign
					mp.addresses = existingMintPermission.addresses
				}
			})
		}

		const agreementOrRoleData = {
			slug,
			symbol: contractInfo.symbol,
			name: contractInfo.name,
			contractURI: contractInfo.contractURI,
			address,
			metadata,
			maxSupply: contractInfo.maxSupply,
			mintPermissions,
			splits: contractInfo.splits.map(s => ({
				toAddress: s.toAddress,
				amount: ethers.BigNumber.from(s.amount).toNumber(),
				lockedBy: s.lockedBy
			})),
			isTransferrable: !contractInfo.isTransferLocked,
			chainId
		}

		const t = await orm.sequelize.transaction()

		let agreementOrRole: Agreement | AgreementRole

		if (!existingAgreementOrRole) {
			agreementOrRole = await orm.models.Agreement.create(agreementOrRoleData)
			if (agreementOrRole.metadata.meem_contract_type === 'meem-club') {
				// await services.guild.createAgreementGuild({
				// 	agreementId: agreementOrRole.id
				// })
			} else if (
				agreementOrRole.metadata.meem_contract_type === 'meem-club-role'
			) {
				// TODO: create the guild role? this shouldn't happen.
			}
		} else {
			agreementOrRole = await existingAgreementOrRole.update(
				agreementOrRoleData
			)
		}

		const adminRole = await agreementOrRoleContract.ADMIN_ROLE()

		let admins: string[] = []

		try {
			admins = await agreementOrRoleContract.getRoles(adminRole)
		} catch (e) {
			log.error('getRoles function not available')
		}

		// TODO: How are we handling AgreementRole admins?
		if (!isRoleAgreement) {
			const [adminWallets, currentAdminsToRemove] = await Promise.all([
				orm.models.Wallet.findAllBy({
					addresses: admins,
					agreementId: agreementOrRole.id
				}),
				orm.models.AgreementWallet.findAll({
					where: {
						role: adminRole
					},
					include: [
						{
							model: orm.models.Agreement,
							where: orm.sequelize.where(
								orm.sequelize.fn(
									'lower',
									orm.sequelize.col('Agreement.address')
								),
								agreementOrRole.address.toLowerCase()
							)
						},
						{
							model: orm.models.Wallet,
							where: orm.sequelize.where(
								orm.sequelize.fn('lower', orm.sequelize.col('Wallet.address')),
								{ [Op.notIn]: admins.map(w => w.toLowerCase()) }
							)
						}
					]
				})
			])

			const walletsData: {
				id: string
				address: string
				isDefault: boolean
			}[] = []

			const walletContractsData: {
				AgreementId: string
				WalletId: string
				role: string
			}[] = []

			admins.forEach(adminAddress => {
				const wallet = adminWallets.find(
					aw => aw.address.toLowerCase() === adminAddress.toLowerCase()
				)

				const agreementWallet =
					wallet?.AgreementWallets && wallet?.AgreementWallets[0]

				if (!wallet) {
					// Create the wallet
					const walletId = uuidv4()
					walletsData.push({
						id: walletId,
						address: adminAddress.toLowerCase(),
						isDefault: true
					})

					walletContractsData.push({
						AgreementId: agreementOrRole.id,
						WalletId: walletId,
						role: adminRole
					})
				} else if (wallet && !agreementWallet) {
					// Create the association
					walletContractsData.push({
						AgreementId: agreementOrRole.id,
						WalletId: wallet.id,
						role: adminRole
					})
				}
			})

			log.debug(`Syncing Agreement data: ${agreementOrRole.address}`)

			const promises: Promise<any>[] = []
			if (currentAdminsToRemove.length > 0) {
				promises.push(
					orm.models.AgreementWallet.destroy({
						where: {
							id: currentAdminsToRemove.map(a => a.id)
						},
						transaction: t
					})
				)
			}
			if (walletsData.length > 0) {
				promises.push(
					orm.models.Wallet.bulkCreate(walletsData, {
						transaction: t
					})
				)
			}

			await Promise.all(promises)

			if (walletContractsData.length > 0) {
				await orm.models.AgreementWallet.bulkCreate(walletContractsData, {
					transaction: t
				})
			}
		}

		await t.commit()

		// Update ENS
		if (!isRoleAgreement) {
			await services.meemId.updateENS(agreementOrRole as Agreement)
		}

		return agreementOrRole
	}

	public static async meemHandleSplitsSet(_args: {
		address: string
		eventData: MeemSplitsSetEvent['args']
		chainId: number
	}) {
		// const tokenId = args.eventData.tokenId.toHexString()
		// const { splits } = args.eventData
		// const meem = await orm.models.AgreementToken.findOne({
		// 	where: {
		// 		tokenId
		// 	},
		// 	include: [
		// 		{
		// 			model: orm.models.Agreement,
		// 			where: {
		// 				address: args.address
		// 			}
		// 		}
		// 	]
		// })
		// if (meem) {
		// 	const prop =
		// 		propertyType === MeemAPI.PropertyType.Meem
		// 			? meem.Properties
		// 			: meem.ChildProperties
		// 	if (!prop) {
		// 		log.crit('Invalid propertyType')
		// 		return
		// 	}
		// 	prop.splits = this.meemSplitsDataToModelData(splits)
		// 	await prop.save()
		// }
	}

	// TODO: update to handle agreement and agreement roles
	public static async meemHandleAdminContractSet(args: {
		address: string
		eventData: MeemAdminContractSetEvent['args']
		chainId: number
	}) {
		const { address, eventData, chainId } = args
		let agreement = await orm.models.Agreement.findByAddress<Agreement>(address)

		if (!agreement) {
			agreement = (await this.meemHandleContractInitialized({
				address,
				chainId
			})) as Agreement
		}

		if (!agreement) {
			log.crit('Unable to find or create Agreement')
			return
		}

		agreement.adminContractAddress = eventData.adminContract
		await agreement.save()
	}

	// public static async meemHandlePropertiesSet(args: {
	// 	address: string
	// 	eventData: MeemPropertiesSetEventObject
	// }) {
	// 	const tokenId = args.eventData.tokenId.toHexString()
	// 	const { propertyType, props } = args.eventData
	// 	const meem = await orm.models.AgreementToken.findOne({
	// 		where: {
	// 			tokenId
	// 		},
	// 		include: [
	// 			{
	// 				model: orm.models.Agreement,
	// 				where: {
	// 					address: args.address
	// 				}
	// 			},
	// 			{
	// 				model: orm.models.MeemProperties,
	// 				as: 'Properties'
	// 			},
	// 			{
	// 				model: orm.models.MeemProperties,
	// 				as: 'ChildProperties'
	// 			}
	// 		]
	// 	})

	// 	if (meem && propertyType === MeemAPI.PropertyType.Meem) {
	// 		await meem.Properties?.update(this.meemPropertiesDataToModelData(props))
	// 	} else if (meem && propertyType === MeemAPI.PropertyType.Child) {
	// 		await meem.ChildProperties?.update(
	// 			this.meemPropertiesDataToModelData(props)
	// 		)
	// 	}
	// }

	// public static async meemHandlePermissionsSet(args: {
	// 	address: string
	// 	eventData: MeemPermissionsSetEventObject
	// }) {
	// 	const tokenId = args.eventData.tokenId.toHexString()
	// 	const { propertyType, permissionType, permission } = args.eventData
	// 	const meem = await orm.models.AgreementToken.findOne({
	// 		where: {
	// 			tokenId
	// 		},
	// 		include: [
	// 			{
	// 				model: orm.models.Agreement,
	// 				where: {
	// 					address: args.address
	// 				}
	// 			},
	// 			{
	// 				model: orm.models.MeemProperties,
	// 				as: 'Properties'
	// 			},
	// 			{
	// 				model: orm.models.MeemProperties,
	// 				as: 'ChildProperties'
	// 			}
	// 		]
	// 	})

	// 	if (meem) {
	// 		const prop =
	// 			propertyType === MeemAPI.PropertyType.Meem
	// 				? meem.Properties
	// 				: meem.ChildProperties
	// 		if (!prop) {
	// 			log.warn(`Missing MeemProperties for token: ${tokenId}`)
	// 			return
	// 		}
	// 		switch (permissionType) {
	// 			case MeemAPI.PermissionType.Copy:
	// 				prop.copyPermissions = this.meemPermissionsDataToModelData(permission)
	// 				break

	// 			case MeemAPI.PermissionType.Read:
	// 				prop.readPermissions = this.meemPermissionsDataToModelData(permission)
	// 				break

	// 			case MeemAPI.PermissionType.Remix:
	// 				prop.remixPermissions =
	// 					this.meemPermissionsDataToModelData(permission)
	// 				break

	// 			default:
	// 				break
	// 		}
	// 		await prop.save()
	// 	}
	// }

	// public static async meemHandleTokenClipped(args: {
	// 	address: string
	// 	transactionTimestamp: number
	// 	eventData: MeemClippedEventObject
	// }) {
	// 	const tokenId = args.eventData.tokenId.toHexString()
	// 	const { addy } = args.eventData

	// 	const [wallet, meem] = await Promise.all([
	// 		orm.models.Wallet.findByAddress<Wallet>(addy) as unknown as Wallet | null,
	// 		orm.models.AgreementToken.findOne({
	// 			where: {
	// 				tokenId
	// 			},
	// 			include: [
	// 				{
	// 					model: orm.models.Agreement,
	// 					where: {
	// 						address: args.address
	// 					}
	// 				}
	// 			]
	// 		})
	// 	])

	// 	const clipping = await orm.models.Clipping.findOne({
	// 		where: {
	// 			address: addy,
	// 			MeemIdentificationId: wallet?.MeemIdentificationId ?? null,
	// 			MeemId: meem?.id ?? null
	// 		}
	// 	})

	// 	if (clipping) {
	// 		throw new Error('ALREADY_CLIPPED')
	// 	}

	// 	await orm.models.Clipping.create({
	// 		address: addy,
	// 		MeemIdentificationId: wallet?.MeemIdentificationId ?? null,
	// 		MeemId: meem?.id ?? null,
	// 		clippedAt: DateTime.fromSeconds(args.transactionTimestamp).toJSDate()
	// 	})
	// }

	// public static async meemHandleTokenUnClipped(args: {
	// 	address: string
	// 	eventData: MeemUnClippedEventObject
	// }) {
	// 	const tokenId = args.eventData.tokenId.toHexString()
	// 	const { addy } = args.eventData

	// 	const meem = await orm.models.AgreementToken.findOne({
	// 		where: {
	// 			tokenId
	// 		},
	// 		include: [
	// 			{
	// 				model: orm.models.Agreement,
	// 				where: {
	// 					address: args.address
	// 				}
	// 			}
	// 		]
	// 	})

	// 	if (!meem) {
	// 		throw new Error('MEEM_NOT_FOUND')
	// 	}

	// 	await orm.models.Clipping.destroy({
	// 		where: {
	// 			MeemId: meem.id,
	// 			address: addy
	// 		}
	// 	})
	// }

	// public static async meemHandleTokenReactionAdded(args: {
	// 	address: string
	// 	transactionTimestamp: number
	// 	eventData: MeemTokenReactionAddedEventObject
	// }) {
	// 	const tokenId = args.eventData.tokenId.toHexString()
	// 	const { addy, reaction, newTotalReactions } = args.eventData
	// 	log.debug(`Adding "${reaction}" reaction for ${addy} on token ${tokenId}`)

	// 	const [meem, wallet] = await Promise.all([
	// 		orm.models.AgreementToken.findOne({
	// 			where: {
	// 				tokenId
	// 			},
	// 			include: [
	// 				{
	// 					model: orm.models.Agreement,
	// 					where: {
	// 						address: args.address
	// 					}
	// 				}
	// 			]
	// 		}),
	// 		orm.models.Wallet.findByAddress<Wallet>(addy)
	// 	])

	// 	if (!meem) {
	// 		throw new Error('MEEM_NOT_FOUND')
	// 	}

	// 	meem.reactionCounts[reaction] = newTotalReactions.toNumber()
	// 	meem.changed('reactionCounts', true)

	// 	await meem.save()

	// 	const existingReaction = await orm.models.Reaction.findOne({
	// 		where: {
	// 			address: addy,
	// 			reaction,
	// 			MeemId: meem.id
	// 		}
	// 	})

	// 	if (existingReaction) {
	// 		log.warn(`Address ${addy} Already reacted to meem: ${tokenId}`)
	// 		return
	// 	}

	// 	await orm.models.Reaction.create({
	// 		reaction,
	// 		address: addy,
	// 		MeemId: meem.id,
	// 		MeemIdentification: wallet?.MeemIdentificationId ?? null,
	// 		reactedAt: DateTime.fromSeconds(args.transactionTimestamp).toJSDate()
	// 	})
	// }

	// public static async meemHandleTokenReactionRemoved(args: {
	// 	address: string
	// 	eventData: MeemTokenReactionRemovedEventObject
	// }) {
	// 	const tokenId = args.eventData.tokenId.toHexString()
	// 	const { addy, reaction, newTotalReactions } = args.eventData

	// 	log.debug(`Removing "${reaction}" reaction for ${addy} on token ${tokenId}`)

	// 	const meem = await orm.models.AgreementToken.findOne({
	// 		where: {
	// 			tokenId
	// 		},
	// 		include: [
	// 			{
	// 				model: orm.models.Agreement,
	// 				where: {
	// 					address: args.address
	// 				}
	// 			}
	// 		]
	// 	})

	// 	if (!meem) {
	// 		throw new Error('MEEM_NOT_FOUND')
	// 	}

	// 	meem.reactionCounts[reaction] = newTotalReactions.toNumber()
	// 	meem.changed('reactionCounts', true)

	// 	await Promise.all([
	// 		orm.models.Reaction.destroy({
	// 			where: {
	// 				address: addy,
	// 				reaction,
	// 				MeemId: meem.id
	// 			}
	// 		}),
	// 		meem.save()
	// 	])
	// }

	// public static async meemHandleTokenReactionTypesSet(args: {
	// 	address: string
	// 	eventData: MeemTokenReactionTypesSetEventObject
	// }) {
	// 	const tokenId = args.eventData.tokenId.toHexString()
	// 	const { reactionTypes } = args.eventData

	// 	log.debug(`Reaction types set for token ${tokenId}`)

	// 	const meem = await orm.models.AgreementToken.findOne({
	// 		where: {
	// 			tokenId
	// 		},
	// 		include: [
	// 			{
	// 				model: orm.models.Agreement,
	// 				where: {
	// 					address: args.address
	// 				}
	// 			}
	// 		]
	// 	})

	// 	if (!meem) {
	// 		throw new Error('MEEM_NOT_FOUND')
	// 	}

	// 	meem.reactionTypes = reactionTypes
	// 	await meem.save()
	// }

	public static async meemHandleTransfer(args: {
		address: string
		transactionHash: string
		transactionTimestamp: number
		eventData: MeemTransferEvent['args']
		chainId: number
	}) {
		const tokenId = args.eventData.tokenId.toHexString()
		const { chainId, address } = args

		const agreement = await services.agreement.getAgreementContract({
			address,
			chainId
		})

		const contractURI = await agreement.contractURI()
		const metadata = (await services.meem.getErc721Metadata(
			contractURI
		)) as MeemMetadataLike

		if (metadata.meem_contract_type === 'meem-club') {
			let token = await orm.models.AgreementToken.findOne({
				where: {
					tokenId
				},
				include: [
					{
						model: orm.models.Agreement,
						where: {
							address: args.address
						}
					}
				]
			})

			if (!token) {
				log.debug(`Creating new token: ${tokenId}`)
				token = await this.createNewAgreementToken({
					address: args.address,
					tokenId,
					chainId
				})
			} else {
				log.debug(`Updating token: ${tokenId}`)
				let wallet = await orm.models.Wallet.findByAddress<Wallet>(
					args.eventData.to
				)

				if (!wallet) {
					wallet = await orm.models.Wallet.create({
						address: args.eventData.to
					})
				}

				token.OwnerId = wallet.id
				await token.save()
			}

			const transferredAt = DateTime.fromSeconds(
				args.transactionTimestamp
			).toJSDate()

			await orm.models.AgreementTokenTransfer.create({
				from: args.eventData.from,
				to: args.eventData.to,
				transactionHash: args.transactionHash,
				transferredAt,
				AgreementTokenId: token.id
			})
		} else if (metadata.meem_contract_type === 'meem-club-role') {
			let token = await orm.models.AgreementRoleToken.findOne({
				where: {
					tokenId
				},
				include: [
					{
						model: orm.models.Agreement,
						where: {
							address: args.address
						}
					}
				]
			})

			if (!token) {
				log.debug(`Creating new token: ${tokenId}`)
				token = await this.createNewAgreementRoleToken({
					address: args.address,
					tokenId,
					chainId
				})
			} else {
				log.debug(`Updating token: ${tokenId}`)
				let wallet = await orm.models.Wallet.findByAddress<Wallet>(
					args.eventData.to
				)

				if (!wallet) {
					wallet = await orm.models.Wallet.create({
						address: args.eventData.to
					})
				}

				token.OwnerId = wallet.id
				await token.save()
			}

			const transferredAt = DateTime.fromSeconds(
				args.transactionTimestamp
			).toJSDate()

			await orm.models.AgreementRoleTokenTransfer.create({
				from: args.eventData.from,
				to: args.eventData.to,
				transactionHash: args.transactionHash,
				transferredAt,
				AgreementRoleTokenId: token.id
			})
		}
	}

	public static async createNewAgreementToken(options: {
		address: string
		tokenId: string
		chainId: number
	}) {
		const { address, tokenId, chainId } = options
		const agreement = await services.agreement.getAgreementContract({
			address,
			chainId
		})

		log.debug(`Fetching AgreementToken from contract: ${tokenId}`)

		// Fetch the token data and create it
		const [tokenData, tokenURI] = await Promise.all([
			agreement.getMeem(tokenId),
			agreement.tokenURI(tokenId)
		])

		log.debug(`AgreementToken found`, tokenURI, tokenData)

		let [agreementData, wallet] = await Promise.all([
			orm.models.Agreement.findOne({
				where: {
					address
				}
			}),
			orm.models.Wallet.findByAddress<Wallet>(tokenData.owner)
		])

		if (!agreementData) {
			agreementData = (await this.meemHandleContractInitialized({
				address,
				chainId
			})) as Agreement
			if (!agreementData) {
				throw new Error('MEEM_CONTRACT_NOT_FOUND')
			}
		}

		if (!wallet) {
			wallet = await orm.models.Wallet.create({
				address: tokenData.owner
			})
		}

		const metadata = (await services.meem.getErc721Metadata(
			tokenURI
		)) as MeemAPI.IMeemMetadataLike

		const data: Record<string, any> = {
			id: uuidv4(),
			tokenId,
			tokenURI,
			mintedAt: DateTime.fromSeconds(tokenData.mintedAt.toNumber()).toJSDate(),
			metadata,
			mintedBy: tokenData.mintedBy,
			AgreementId: agreementData.id,
			OwnerId: wallet.id
		}

		log.debug(`Saving AgreementToken to db: ${tokenId}`)
		const t = await orm.sequelize.transaction()

		const createUpdatePromises: Promise<AgreementToken>[] = [
			orm.models.AgreementToken.create(data, { transaction: t })
		]

		const [token] = await Promise.all(createUpdatePromises)

		await t.commit()

		return token
	}

	public static async createNewAgreementRoleToken(options: {
		address: string
		tokenId: string
		chainId: number
	}) {
		const { address, tokenId, chainId } = options
		const agreementContract = await services.agreement.getAgreementContract({
			address,
			chainId
		})

		log.debug(`Fetching AgreementRoleToken from contract: ${tokenId}`)

		// Fetch the meem data and create it
		const [tokenData, tokenURI] = await Promise.all([
			agreementContract.getMeem(tokenId),
			agreementContract.tokenURI(tokenId)
		])

		log.debug(`AgreementRoleToken found`, tokenURI, tokenData)

		let [agreementRoleData, wallet] = await Promise.all([
			orm.models.AgreementRole.findOne({
				where: {
					address
				},
				include: [
					{
						model: orm.models.Agreement
					}
				]
			}),
			orm.models.Wallet.findByAddress<Wallet>(tokenData.owner)
		])

		if (!agreementRoleData) {
			agreementRoleData = (await this.meemHandleContractInitialized({
				address,
				chainId
			})) as AgreementRole | null
			if (!agreementRoleData) {
				throw new Error('AGREEMENT_ROLE_NOT_FOUND')
			}
		}

		if (!wallet) {
			wallet = await orm.models.Wallet.create({
				address: tokenData.owner
			})
		}

		const metadata = (await services.meem.getErc721Metadata(
			tokenURI
		)) as MeemAPI.IMeemMetadataLike

		const data: Record<string, any> = {
			id: uuidv4(),
			tokenId,
			tokenURI,
			mintedAt: DateTime.fromSeconds(tokenData.mintedAt.toNumber()).toJSDate(),
			metadata,
			mintedBy: tokenData.mintedBy,
			AgreementId: agreementRoleData.Agreement.id,
			AgreementRoleId: agreementRoleData.id,
			OwnerId: wallet.id
		}

		log.debug(`Saving AgreementRoleToken to db: ${tokenId}`)
		const t = await orm.sequelize.transaction()

		const createUpdatePromises: Promise<AgreementRoleToken>[] = [
			orm.models.AgreementRoleToken.create(data, { transaction: t })
		]

		const [token] = await Promise.all(createUpdatePromises)

		await t.commit()

		return token
	}

	// public static saveToGun(options: {
	// 	paths: string[]
	// 	from?: IGunChainReference<any, string, false>
	// 	data: any
	// }): IGunChainReference<any, string, false> {
	// 	// return new Promise((resolve, reject) => {
	// 	const { paths, data, from } = options
	// 	let item: IGunChainReference<any, string, false> = gun.user()

	// 	if (paths.length === 0) {
	// 		throw new Error('Paths must be set')
	// 	}

	// 	paths.forEach(path => {
	// 		if (from && !item) {
	// 			item = from.get(path)
	// 		} else if (item) {
	// 			item = item.get(path)
	// 		} else {
	// 			item = gun.user().get(path)
	// 		}
	// 	})

	// 	const dataObject = this.toPureObject(data)

	// 	Object.keys(dataObject).forEach(key => {
	// 		const val = dataObject[key]
	// 		if (typeof val === 'object') {
	// 			this.saveToGun({ paths: [key], from: item, data: val })
	// 		} else if (Object.prototype.toString.call(val) === '[object Date]') {
	// 			item.get(key).put(((val as Date).getTime() / 1000) as any, ack => {
	// 				if (ack.ok) {
	// 					log.debug(`Gun sync: ${paths.join('/')}/${key}`)
	// 				} else if (ack.err) {
	// 					log.crit(ack.err)
	// 				}
	// 			})
	// 		} else {
	// 			item.get(key).put(val, ack => {
	// 				if (ack.ok) {
	// 					log.debug(`Gun sync: ${paths.join('/')}/${key}`)
	// 				} else if (ack.err) {
	// 					log.crit(`Error saving: ${key}`, val)
	// 					log.crit(ack.err)
	// 				}
	// 			})
	// 		}
	// 	})

	// 	return item
	// }

	// private static async updateMeem(options: { meem: Meem }) {
	// 	const { meem } = options
	// 	log.debug(`Syncing meem tokenId: ${meem.tokenId}`)
	// 	const agreement = await services.meem.getAgreement({
	// 		address: meem.Agreement.address
	// 	})
	// 	// Fetch the meem data and create it
	// 	const [meemData, tokenURI] = await Promise.all([
	// 		agreement.getMeem(meem.tokenId),
	// 		agreement.tokenURI(meem.tokenId)
	// 	])

	// 	const metadata = (await services.meem.getErc721Metadata(
	// 		tokenURI
	// 	)) as MeemAPI.IMeemMetadataLike

	// 	// meem.data = meemData.data
	// 	meem.metadata = metadata
	// 	meem.owner = meemData.owner
	// 	meem.mintedAt = DateTime.fromSeconds(
	// 		meemData.mintedAt.toNumber()
	// 	).toJSDate()
	// 	meem.mintedBy = meemData.mintedBy
	// 	// meem.uriLockedBy = meemData.uriLockedBy
	// 	await meem.save()
	// }

	// private static meemPropertiesDataToModelData(
	// 	props: MeemPropertiesStructOutput
	// ) {
	// 	return {
	// 		totalCopies: props.totalCopies.toHexString(),
	// 		totalCopiesLockedBy: props.totalCopiesLockedBy,
	// 		copiesPerWallet: props.copiesPerWallet.toHexString(),
	// 		copiesPerWalletLockedBy: props.copiesPerWalletLockedBy,
	// 		totalRemixes: props.totalRemixes.toHexString(),
	// 		totalRemixesLockedBy: props.totalRemixesLockedBy,
	// 		remixesPerWallet: props.remixesPerWallet.toHexString(),
	// 		remixesPerWalletLockedBy: props.remixesPerWalletLockedBy,
	// 		copyPermissions: this.meemPermissionsDataToModelData(
	// 			props.copyPermissions
	// 		),
	// 		remixPermissions: this.meemPermissionsDataToModelData(
	// 			props.remixPermissions
	// 		),
	// 		readPermissions: this.meemPermissionsDataToModelData(
	// 			props.readPermissions
	// 		),
	// 		copyPermissionsLockedBy: props.copyPermissionsLockedBy,
	// 		remixPermissionsLockedBy: props.remixPermissionsLockedBy,
	// 		readPermissionsLockedBy: props.readPermissionsLockedBy,
	// 		splits: this.meemSplitsDataToModelData(props.splits),
	// 		splitsLockedBy: props.splitsLockedBy,
	// 		isTransferrable: props.isTransferrable,
	// 		isTransferrableLockedBy: props.isTransferrableLockedBy,
	// 		mintStartAt: props.mintStartTimestamp.toHexString(),
	// 		mintEndAt: props.mintEndTimestamp.toHexString(),
	// 		mintDatesLockedBy: props.mintDatesLockedBy,
	// 		transferLockupUntil: !props.transferLockupUntil.isZero
	// 			? props.transferLockupUntil.toHexString()
	// 			: null,
	// 		transferLockupUntilLockedBy: props.transferLockupUntilLockedBy
	// 	}
	// }

	private static meemSplitsDataToModelData(splits: SplitStructOutput[]) {
		return splits.map(s => ({
			toAddress: s.toAddress,
			amount: s.amount.toNumber(),
			lockedBy: s.lockedBy
		}))
	}

	private static meemPermissionsDataToModelData(perms: MeemPermissionStruct[]) {
		return perms.map(p => ({
			permission: p.permission,
			addresses: p.addresses,
			numTokens: ethers.BigNumber.from(p.numTokens).toHexString(),
			// lockedBy: p.lockedBy,
			costWei: ethers.BigNumber.from(p.costWei).toHexString()
		}))
	}

	public static toPureObject(d: any) {
		// let data: Record<string, any> = {}

		// if (Array.isArray(d)) {
		// 	d.forEach((val, i) => {
		// 		data[`a${i}`] = val
		// 	})
		// } else {
		// 	data = { ...d }
		// }

		const data = { ...d }

		Object.keys(data).forEach(key => {
			const val = data[key]
			if (Array.isArray(val) || typeof val === 'object') {
				data[key] = this.toPureObject(val)
			} else if (Object.prototype.toString.call(val) === '[object Date]') {
				data[key] = (val as Date).toString()
			} else if (typeof val === 'string') {
				data[key] = val.replace(/\n/g, '/n')
			}
		})

		return data
	}
}
