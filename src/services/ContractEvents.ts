import { Log } from '@ethersproject/abstract-provider'
import { Meem as MeemContractType } from '@meemproject/meem-contracts'
import {
	SplitStructOutput,
	MeemPermissionStructOutput,
	MeemPropertiesStructOutput,
	MeemTransferEventObject,
	MeemTotalCopiesSetEventObject,
	MeemTotalRemixesSetEventObject,
	MeemTotalCopiesLockedEventObject,
	MeemTotalRemixesLockedEventObject,
	MeemCopiesPerWalletSetEventObject,
	MeemRemixesPerWalletSetEventObject,
	MeemCopiesPerWalletLockedEventObject,
	MeemRemixesPerWalletLockedEventObject,
	MeemPropertiesSetEventObject,
	MeemTokenReactionAddedEventObject,
	MeemPermissionsSetEventObject,
	MeemTokenReactionRemovedEventObject,
	MeemTokenReactionTypesSetEventObject,
	MeemSplitsSet_uint256_uint8_tuple_array_EventObject,
	MeemClippedEventObject,
	MeemUnClippedEventObject,
	ContractInfoStructOutput
} from '@meemproject/meem-contracts/dist/types/Meem'
import meemABI from '@meemproject/meem-contracts/types/Meem.json'
import { BigNumber, Contract, utils } from 'ethers'
import { IGunChainReference } from 'gun/types/chain'
import { DateTime } from 'luxon'
import { Op } from 'sequelize'
import { v4 as uuidv4 } from 'uuid'
import { wait } from '../lib/utils'
import Meem from '../models/Meem'
import MeemContract from '../models/MeemContract'
import Wallet from '../models/Wallet'
import { MeemAPI } from '../types/meem.generated'

export default class ContractEvent {
	// TODO: sync reactions?
	public static async meemSyncReactions() {
		log.debug('Syncing reactions...')
		const provider = await services.ethers.getProvider()

		const genericMeemContract = new Contract(
			MeemAPI.zeroAddress,
			meemABI
		) as unknown as MeemContractType

		const topics = {
			MeemTokenReactionAdded: `MeemTokenReactionAdded(uint256,address,string,uint256)`,
			MeemTokenReactionRemoved: `MeemTokenReactionRemoved(uint256,address,string,uint256)`
		}

		const logs = await provider.getLogs({
			fromBlock: 0,
			toBlock: 'latest',
			topics: [
				[
					utils.id(topics.MeemTokenReactionAdded),
					utils.id(topics.MeemTokenReactionRemoved)
				]
			]
		})

		log.debug(`Syncing ${logs.length} reaction added/remvoed events`)

		for (let i = 0; i < logs.length; i += 1) {
			try {
				const parsedLog = genericMeemContract.interface.parseLog({
					data: logs[i].data,
					topics: logs[i].topics
				})

				// eslint-disable-next-line no-await-in-loop
				const block = await provider.getBlock(logs[i].blockHash)

				if (parsedLog.topic === topics.MeemTokenReactionAdded) {
					const eventData =
						parsedLog.args as unknown as MeemTokenReactionAddedEventObject
					// eslint-disable-next-line no-await-in-loop
					await this.meemHandleTokenReactionAdded({
						address: logs[i].address,
						transactionTimestamp:
							block?.timestamp || DateTime.now().toSeconds(),
						eventData
					})
				} else if (parsedLog.topic === topics.MeemTokenReactionRemoved) {
					const eventData =
						parsedLog.args as unknown as MeemTokenReactionRemovedEventObject
					// eslint-disable-next-line no-await-in-loop
					await this.meemHandleTokenReactionRemoved({
						address: logs[i].address,
						eventData
					})
				}
				log.debug(logs[i].blockNumber)
			} catch (e) {
				log.crit(e)
			}
		}
	}

	public static async meemContractSync(specificEvents?: Log[]) {
		log.debug('Syncing MeemContracts...')
		const provider = await services.ethers.getProvider()
		const logs =
			specificEvents ??
			(await provider.getLogs({
				fromBlock: 0,
				toBlock: 'latest',
				topics: [[utils.id('MeemContractInitialized(address)')]]
			}))

		log.debug(`Syncing ${logs.length} initialized events`)

		const failedEvents: Log[] = []

		for (let i = 0; i < logs.length; i += 1) {
			try {
				log.debug(`Syncing ${i + 1} / ${logs.length} events`)

				// eslint-disable-next-line no-await-in-loop
				await this.meemHandleContractInitialized({
					address: logs[i].address
				})
				// eslint-disable-next-line no-await-in-loop
				await wait(500)
			} catch (e) {
				failedEvents.push(logs[i])
				log.crit(e)
				log.debug(logs[i])
			}
		}

		if (failedEvents.length > 0) {
			log.debug(`Completed with ${failedEvents.length} failed events`)
			// log.debug(`Retrying ${failedEvents.length} events`)
			// await this.meemContractSync(failedEvents)
		}
	}

	public static async meemSync(specificEvents?: Log[]) {
		log.debug('Syncing meems...')
		const provider = await services.ethers.getProvider()

		const genericMeemContract = new Contract(
			MeemAPI.zeroAddress,
			meemABI
		) as unknown as MeemContractType

		const logs =
			specificEvents ??
			(await provider.getLogs({
				fromBlock: 0,
				toBlock: 'latest',
				topics: [[utils.id('MeemTransfer(address,address,uint256)')]]
			}))

		const failedEvents: Log[] = []

		for (let i = 0; i < logs.length; i += 1) {
			try {
				log.debug(`Syncing ${i + 1} / ${logs.length} events`)

				const parsedLog = genericMeemContract.interface.parseLog({
					data: logs[i].data,
					topics: logs[i].topics
				})

				const eventData = parsedLog.args as unknown as MeemTransferEventObject

				// eslint-disable-next-line no-await-in-loop
				const block = await provider.getBlock(logs[i].blockHash)
				// eslint-disable-next-line no-await-in-loop
				await this.meemHandleTransfer({
					address: logs[i].address,
					transactionHash: logs[i].transactionHash,
					transactionTimestamp: block.timestamp,
					eventData
				})
				// eslint-disable-next-line no-await-in-loop
				await wait(500)
			} catch (e) {
				failedEvents.push(logs[i])
				log.crit(e)
				log.debug(logs[i])
			}
		}

		if (failedEvents.length > 0) {
			log.debug(`Completed with ${failedEvents.length} failed events`)
			// log.debug(`Retrying ${failedEvents.length} events`)
			// await this.meemSync(failedEvents)
		}
	}

	public static async meemHandleContractInitialized(args: {
		address: string
	}): Promise<MeemContract | null> {
		const { address } = args
		const meemContract = (await services.meem.getMeemContract({
			address
		})) as unknown as MeemContractType

		let contractInfo: ContractInfoStructOutput

		// TODO: Parse metadata and create database models for contract type (Check if exist first)
		// TODO: Parse associations from metadata and create database associations (Check if exist first)

		try {
			contractInfo = await meemContract.getContractInfo()
		} catch (e) {
			log.debug('getContractInfo function not available. Skipping')
			return null
		}

		const existingMeemContract = await orm.models.MeemContract.findOne({
			where: {
				address
			},
			include: [
				{
					model: orm.models.MeemProperties,
					as: 'DefaultProperties'
				},
				{
					model: orm.models.MeemProperties,
					as: 'DefaultChildProperties'
				}
			]
		})

		let slug = existingMeemContract?.slug

		const metadata = (await services.meem.getErc721Metadata(
			contractInfo.contractURI
		)) as MeemAPI.IMeemContractMetadata

		const propertiesData = this.meemPropertiesDataToModelData(
			contractInfo.defaultProperties
		)
		const childPropertiesData = this.meemPropertiesDataToModelData(
			contractInfo.defaultChildProperties
		)

		const properties =
			existingMeemContract?.DefaultProperties ??
			orm.models.MeemProperties.build({
				id: uuidv4(),
				...propertiesData
			})
		const childProperties =
			existingMeemContract?.DefaultChildProperties ??
			orm.models.MeemProperties.build({
				id: uuidv4(),
				...childPropertiesData
			})

		if (!existingMeemContract || !slug) {
			try {
				slug = await services.meemContract.generateSlug(contractInfo.name)
			} catch (e) {
				slug = uuidv4()
			}
		} else {
			properties.set(propertiesData)
			childProperties.set(childPropertiesData)
		}
		const meemContractData = {
			slug,
			symbol: contractInfo.symbol,
			name: contractInfo.name,
			contractURI: contractInfo.contractURI,
			childDepth: contractInfo.childDepth,
			nonOwnerSplitAllocationAmount: contractInfo.nonOwnerSplitAllocationAmount,
			address,
			metadata,
			totalOriginalsSupply:
				contractInfo.baseProperties.totalOriginalsSupply.toHexString(),
			totalOriginalsSupplyLockedBy:
				contractInfo.baseProperties.totalOriginalsSupplyLockedBy,
			mintPermissions: contractInfo.baseProperties.mintPermissions.map(p => ({
				permission: p.permission,
				addresses: p.addresses,
				numTokens: p.numTokens.toHexString(),
				lockedBy: p.lockedBy,
				costWei: p.costWei.toHexString()
			})),
			mintPermissionsLockedBy:
				contractInfo.baseProperties.mintPermissionsLockedBy,
			splits: contractInfo.baseProperties.splits.map(s => ({
				toAddress: s.toAddress,
				amount: s.amount.toNumber(),
				lockedBy: s.lockedBy
			})),
			splitsLockedBy: contractInfo.baseProperties.splitsLockedBy,
			originalsPerWallet:
				contractInfo.baseProperties.originalsPerWallet.toHexString(),
			originalsPerWalletLockedBy:
				contractInfo.baseProperties.originalsPerWalletLockedBy,
			isTransferrable: contractInfo.baseProperties.isTransferrable,
			isTransferrableLockedBy:
				contractInfo.baseProperties.isTransferrableLockedBy,
			mintStartAt: contractInfo.baseProperties.mintStartTimestamp.toHexString(),
			mintEndAt: contractInfo.baseProperties.mintEndTimestamp.toHexString(),
			mintDatesLockedBy: contractInfo.baseProperties.mintDatesLockedBy,
			transferLockupUntil:
				contractInfo.baseProperties.transferLockupUntil.toHexString(),
			transferLockupUntilLockedBy:
				contractInfo.baseProperties.transferLockupUntilLockedBy,
			DefaultProperties: properties.id,
			DefaultChildProperties: childProperties.id
		}

		const t = await orm.sequelize.transaction()

		await Promise.all([
			properties.save({ transaction: t }),
			childProperties.save({ transaction: t })
		])

		let theMeemContract: MeemContract

		if (!existingMeemContract) {
			theMeemContract = await orm.models.MeemContract.create(meemContractData, {
				transaction: t
			})
		} else {
			theMeemContract = await existingMeemContract.update(meemContractData)
		}

		const adminRole = await meemContract.ADMIN_ROLE()

		let admins: string[] = []

		try {
			admins = await meemContract.getRoles(adminRole)
		} catch (e) {
			log.error('getRoles function not available')
		}

		const [adminWallets, currentAdminsToRemove] = await Promise.all([
			orm.models.Wallet.findAllBy({
				addresses: admins,
				meemContractId: theMeemContract.id
			}),
			orm.models.MeemContractWallet.findAll({
				where: {
					role: adminRole
				},
				include: [
					{
						model: orm.models.MeemContract,
						where: orm.sequelize.where(
							orm.sequelize.fn(
								'lower',
								orm.sequelize.col('MeemContract.address')
							),
							theMeemContract.address.toLowerCase()
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
			MeemContractId: string
			WalletId: string
			role: string
		}[] = []

		admins.forEach(adminAddress => {
			const wallet = adminWallets.find(
				aw => aw.address.toLowerCase() === adminAddress.toLowerCase()
			)

			const meemContractWallet =
				wallet?.MeemContractWallets && wallet?.MeemContractWallets[0]

			if (!wallet) {
				// Create the wallet
				const walletId = uuidv4()
				walletsData.push({
					id: walletId,
					address: adminAddress.toLowerCase(),
					isDefault: true
				})

				walletContractsData.push({
					MeemContractId: theMeemContract.id,
					WalletId: walletId,
					role: adminRole
				})
			} else if (wallet && !meemContractWallet) {
				// Create the association
				walletContractsData.push({
					MeemContractId: theMeemContract.id,
					WalletId: wallet.id,
					role: adminRole
				})
			}
		})

		log.debug(`Syncing MeemContract data: ${theMeemContract.address}`)

		const promises: Promise<any>[] = []
		if (currentAdminsToRemove.length > 0) {
			promises.push(
				orm.models.MeemContractWallet.destroy({
					where: {
						id: currentAdminsToRemove.map(a => a.id)
					},
					transaction: t
				})
			)
		}
		if (walletsData.length > 0) {
			promises.push(
				orm.models.Wallet.bulkCreate(walletsData, { transaction: t })
			)
		}

		await Promise.all(promises)

		if (walletContractsData.length > 0) {
			await orm.models.MeemContractWallet.bulkCreate(walletContractsData, {
				transaction: t
			})
		}

		await t.commit()

		return theMeemContract
	}

	public static async meemHandleTotalCopiesSet(args: {
		address: string
		eventData: MeemTotalCopiesSetEventObject
	}) {
		const tokenId = args.eventData.tokenId.toHexString()
		const { newTotalCopies, propertyType } = args.eventData

		const meem = await orm.models.Meem.findOne({
			where: {
				tokenId
			},
			include: [
				{
					model: orm.models.MeemContract,
					where: {
						address: args.address
					}
				},
				{
					model: orm.models.MeemProperties,
					as: 'Properties'
				},
				{
					model: orm.models.MeemProperties,
					as: 'ChildProperties'
				}
			]
		})

		if (meem) {
			const prop =
				propertyType === MeemAPI.PropertyType.Meem
					? meem.Properties
					: meem.ChildProperties
			if (!prop) {
				log.crit('Invalid propertyType')
				return
			}
			prop.totalCopies = newTotalCopies.toHexString()
			await prop.save()
		}
	}

	public static async meemHandleTotalRemixesSet(args: {
		address: string
		eventData: MeemTotalRemixesSetEventObject
	}) {
		const tokenId = args.eventData.tokenId.toHexString()
		const { newTotalRemixes, propertyType } = args.eventData

		const meem = await orm.models.Meem.findOne({
			where: {
				tokenId
			},
			include: [
				{
					model: orm.models.MeemContract,
					where: {
						address: args.address
					}
				},
				{
					model: orm.models.MeemProperties,
					as: 'Properties'
				},
				{
					model: orm.models.MeemProperties,
					as: 'ChildProperties'
				}
			]
		})

		if (meem) {
			const prop =
				propertyType === MeemAPI.PropertyType.Meem
					? meem.Properties
					: meem.ChildProperties
			if (!prop) {
				log.crit('Invalid propertyType')
				return
			}
			prop.totalRemixes = newTotalRemixes.toHexString()
			await prop.save()
		}
	}

	public static async meemHandleTotalCopiesLocked(args: {
		address: string
		eventData: MeemTotalCopiesLockedEventObject
	}) {
		const tokenId = args.eventData.tokenId.toHexString()
		const { lockedBy, propertyType } = args.eventData

		const meem = await orm.models.Meem.findOne({
			where: {
				tokenId
			},
			include: [
				{
					model: orm.models.MeemContract,
					where: {
						address: args.address
					}
				},
				{
					model: orm.models.MeemProperties,
					as: 'Properties'
				},
				{
					model: orm.models.MeemProperties,
					as: 'ChildProperties'
				}
			]
		})

		if (meem) {
			const prop =
				propertyType === MeemAPI.PropertyType.Meem
					? meem.Properties
					: meem.ChildProperties
			if (!prop) {
				log.crit('Invalid propertyType')
				return
			}
			prop.totalCopiesLockedBy = lockedBy
			await prop.save()
		}
	}

	public static async meemHandleTotalRemixesLocked(args: {
		address: string
		eventData: MeemTotalRemixesLockedEventObject
	}) {
		const tokenId = args.eventData.tokenId.toHexString()
		const { lockedBy, propertyType } = args.eventData

		const meem = await orm.models.Meem.findOne({
			where: {
				tokenId
			},
			include: [
				{
					model: orm.models.MeemContract,
					where: {
						address: args.address
					}
				},
				{
					model: orm.models.MeemProperties,
					as: 'Properties'
				},
				{
					model: orm.models.MeemProperties,
					as: 'ChildProperties'
				}
			]
		})

		if (meem) {
			const prop =
				propertyType === MeemAPI.PropertyType.Meem
					? meem.Properties
					: meem.ChildProperties
			if (!prop) {
				log.crit('Invalid propertyType')
				return
			}
			prop.totalRemixesLockedBy = lockedBy
			await prop.save()
		}
	}

	public static async meemHandleCopiesPerWalletSet(args: {
		address: string
		eventData: MeemCopiesPerWalletSetEventObject
	}) {
		const tokenId = args.eventData.tokenId.toHexString()
		const { newTotalCopies, propertyType } = args.eventData

		const meem = await orm.models.Meem.findOne({
			where: {
				tokenId
			},
			include: [
				{
					model: orm.models.MeemContract,
					where: {
						address: args.address
					}
				},
				{
					model: orm.models.MeemProperties,
					as: 'Properties'
				},
				{
					model: orm.models.MeemProperties,
					as: 'ChildProperties'
				}
			]
		})

		if (meem) {
			const prop =
				propertyType === MeemAPI.PropertyType.Meem
					? meem.Properties
					: meem.ChildProperties
			if (!prop) {
				log.crit('Invalid propertyType')
				return
			}
			// TODO: Update property name
			prop.copiesPerWallet = newTotalCopies.toHexString()
			await prop.save()
		}
	}

	public static async meemHandleRemixesPerWalletSet(args: {
		address: string
		eventData: MeemRemixesPerWalletSetEventObject
	}) {
		const tokenId = args.eventData.tokenId.toHexString()
		const { newTotalRemixes, propertyType } = args.eventData

		const meem = await orm.models.Meem.findOne({
			where: {
				tokenId
			},
			include: [
				{
					model: orm.models.MeemContract,
					where: {
						address: args.address
					}
				},
				{
					model: orm.models.MeemProperties,
					as: 'Properties'
				},
				{
					model: orm.models.MeemProperties,
					as: 'ChildProperties'
				}
			]
		})

		if (meem?.Properties) {
			const prop =
				propertyType === MeemAPI.PropertyType.Meem
					? meem.Properties
					: meem.ChildProperties
			if (!prop) {
				log.crit('Invalid propertyType')
				return
			}
			prop.remixesPerWallet = newTotalRemixes.toHexString()
			await prop.save()
		}
	}

	public static async meemHandleCopiesPerWalletLocked(args: {
		address: string
		eventData: MeemCopiesPerWalletLockedEventObject
	}) {
		const tokenId = args.eventData.tokenId.toHexString()
		const { lockedBy, propertyType } = args.eventData

		const meem = await orm.models.Meem.findOne({
			where: {
				tokenId
			},
			include: [
				{
					model: orm.models.MeemContract,
					where: {
						address: args.address
					}
				},
				{
					model: orm.models.MeemProperties,
					as: 'Properties'
				},
				{
					model: orm.models.MeemProperties,
					as: 'ChildProperties'
				}
			]
		})

		if (meem) {
			const prop =
				propertyType === MeemAPI.PropertyType.Meem
					? meem.Properties
					: meem.ChildProperties
			if (!prop) {
				log.crit('Invalid propertyType')
				return
			}
			prop.copiesPerWalletLockedBy = lockedBy
			await prop.save()
		}
	}

	public static async meemHandleRemixesPerWalletLocked(args: {
		address: string
		eventData: MeemRemixesPerWalletLockedEventObject
	}) {
		const tokenId = args.eventData.tokenId.toHexString()
		const { lockedBy, propertyType } = args.eventData

		const meem = await orm.models.Meem.findOne({
			where: {
				tokenId
			},
			include: [
				{
					model: orm.models.MeemContract,
					where: {
						address: args.address
					}
				},
				{
					model: orm.models.MeemProperties,
					as: 'Properties'
				},
				{
					model: orm.models.MeemProperties,
					as: 'ChildProperties'
				}
			]
		})

		if (meem) {
			const prop =
				propertyType === MeemAPI.PropertyType.Meem
					? meem.Properties
					: meem.ChildProperties
			if (!prop) {
				log.crit('Invalid propertyType')
				return
			}
			prop.remixesPerWalletLockedBy = lockedBy
			await prop.save()
		}
	}

	public static async meemHandleSplitsSet(args: {
		address: string
		eventData: MeemSplitsSet_uint256_uint8_tuple_array_EventObject
	}) {
		const tokenId = args.eventData.tokenId.toHexString()
		const { splits, propertyType } = args.eventData

		const meem = await orm.models.Meem.findOne({
			where: {
				tokenId
			},
			include: [
				{
					model: orm.models.MeemContract,
					where: {
						address: args.address
					}
				},
				{
					model: orm.models.MeemProperties,
					as: 'Properties'
				},
				{
					model: orm.models.MeemProperties,
					as: 'ChildProperties'
				}
			]
		})

		if (meem) {
			const prop =
				propertyType === MeemAPI.PropertyType.Meem
					? meem.Properties
					: meem.ChildProperties
			if (!prop) {
				log.crit('Invalid propertyType')
				return
			}
			prop.splits = this.meemSplitsDataToModelData(splits)
			await prop.save()
		}
	}

	public static async meemHandlePropertiesSet(args: {
		address: string
		eventData: MeemPropertiesSetEventObject
	}) {
		const tokenId = args.eventData.tokenId.toHexString()
		const { propertyType, props } = args.eventData
		const meem = await orm.models.Meem.findOne({
			where: {
				tokenId
			},
			include: [
				{
					model: orm.models.MeemContract,
					where: {
						address: args.address
					}
				},
				{
					model: orm.models.MeemProperties,
					as: 'Properties'
				},
				{
					model: orm.models.MeemProperties,
					as: 'ChildProperties'
				}
			]
		})

		if (meem && propertyType === MeemAPI.PropertyType.Meem) {
			await meem.Properties?.update(this.meemPropertiesDataToModelData(props))
		} else if (meem && propertyType === MeemAPI.PropertyType.Child) {
			await meem.ChildProperties?.update(
				this.meemPropertiesDataToModelData(props)
			)
		}
	}

	public static async meemHandlePermissionsSet(args: {
		address: string
		eventData: MeemPermissionsSetEventObject
	}) {
		const tokenId = args.eventData.tokenId.toHexString()
		const { propertyType, permissionType, permission } = args.eventData
		const meem = await orm.models.Meem.findOne({
			where: {
				tokenId
			},
			include: [
				{
					model: orm.models.MeemContract,
					where: {
						address: args.address
					}
				},
				{
					model: orm.models.MeemProperties,
					as: 'Properties'
				},
				{
					model: orm.models.MeemProperties,
					as: 'ChildProperties'
				}
			]
		})

		if (meem) {
			const prop =
				propertyType === MeemAPI.PropertyType.Meem
					? meem.Properties
					: meem.ChildProperties
			if (!prop) {
				log.warn(`Missing MeemProperties for token: ${tokenId}`)
				return
			}
			switch (permissionType) {
				case MeemAPI.PermissionType.Copy:
					prop.copyPermissions = this.meemPermissionsDataToModelData(permission)
					break

				case MeemAPI.PermissionType.Read:
					prop.readPermissions = this.meemPermissionsDataToModelData(permission)
					break

				case MeemAPI.PermissionType.Remix:
					prop.remixPermissions =
						this.meemPermissionsDataToModelData(permission)
					break

				default:
					break
			}
			await prop.save()
		}
	}

	public static async meemHandleTokenClipped(args: {
		address: string
		transactionTimestamp: number
		eventData: MeemClippedEventObject
	}) {
		const tokenId = args.eventData.tokenId.toHexString()
		const { addy } = args.eventData

		const [wallet, meem] = await Promise.all([
			orm.models.Wallet.findByAddress<Wallet>(addy) as unknown as Wallet | null,
			orm.models.Meem.findOne({
				where: {
					tokenId
				},
				include: [
					{
						model: orm.models.MeemContract,
						where: {
							address: args.address
						}
					}
				]
			})
		])

		const clipping = await orm.models.Clipping.findOne({
			where: {
				address: addy,
				MeemIdentificationId: wallet?.MeemIdentificationId ?? null,
				MeemId: meem?.id ?? null
			}
		})

		if (clipping) {
			throw new Error('ALREADY_CLIPPED')
		}

		await orm.models.Clipping.create({
			address: addy,
			MeemIdentificationId: wallet?.MeemIdentificationId ?? null,
			MeemId: meem?.id ?? null,
			clippedAt: DateTime.fromSeconds(args.transactionTimestamp).toJSDate()
		})
	}

	public static async meemHandleTokenUnClipped(args: {
		address: string
		eventData: MeemUnClippedEventObject
	}) {
		const tokenId = args.eventData.tokenId.toHexString()
		const { addy } = args.eventData

		const meem = await orm.models.Meem.findOne({
			where: {
				tokenId
			},
			include: [
				{
					model: orm.models.MeemContract,
					where: {
						address: args.address
					}
				}
			]
		})

		if (!meem) {
			throw new Error('MEEM_NOT_FOUND')
		}

		await orm.models.Clipping.destroy({
			where: {
				MeemId: meem.id,
				address: addy
			}
		})
	}

	public static async meemHandleTokenReactionAdded(args: {
		address: string
		transactionTimestamp: number
		eventData: MeemTokenReactionAddedEventObject
	}) {
		const tokenId = args.eventData.tokenId.toHexString()
		const { addy, reaction, newTotalReactions } = args.eventData
		log.debug(`Adding "${reaction}" reaction for ${addy} on token ${tokenId}`)

		const [meem, wallet] = await Promise.all([
			orm.models.Meem.findOne({
				where: {
					tokenId
				},
				include: [
					{
						model: orm.models.MeemContract,
						where: {
							address: args.address
						}
					}
				]
			}),
			orm.models.Wallet.findByAddress<Wallet>(addy)
		])

		if (!meem) {
			throw new Error('MEEM_NOT_FOUND')
		}

		meem.reactionCounts[reaction] = newTotalReactions.toNumber()
		meem.changed('reactionCounts', true)

		await meem.save()

		const existingReaction = await orm.models.Reaction.findOne({
			where: {
				address: addy,
				reaction,
				MeemId: meem.id
			}
		})

		if (existingReaction) {
			log.warn(`Address ${addy} Already reacted to meem: ${tokenId}`)
			return
		}

		await orm.models.Reaction.create({
			reaction,
			address: addy,
			MeemId: meem.id,
			MeemIdentification: wallet?.MeemIdentificationId ?? null,
			reactedAt: DateTime.fromSeconds(args.transactionTimestamp).toJSDate()
		})
	}

	public static async meemHandleTokenReactionRemoved(args: {
		address: string
		eventData: MeemTokenReactionRemovedEventObject
	}) {
		const tokenId = args.eventData.tokenId.toHexString()
		const { addy, reaction, newTotalReactions } = args.eventData

		log.debug(`Removing "${reaction}" reaction for ${addy} on token ${tokenId}`)

		const meem = await orm.models.Meem.findOne({
			where: {
				tokenId
			},
			include: [
				{
					model: orm.models.MeemContract,
					where: {
						address: args.address
					}
				}
			]
		})

		if (!meem) {
			throw new Error('MEEM_NOT_FOUND')
		}

		meem.reactionCounts[reaction] = newTotalReactions.toNumber()
		meem.changed('reactionCounts', true)

		await Promise.all([
			orm.models.Reaction.destroy({
				where: {
					address: addy,
					reaction,
					MeemId: meem.id
				}
			}),
			meem.save()
		])
	}

	public static async meemHandleTokenReactionTypesSet(args: {
		address: string
		eventData: MeemTokenReactionTypesSetEventObject
	}) {
		const tokenId = args.eventData.tokenId.toHexString()
		const { reactionTypes } = args.eventData

		log.debug(`Reaction types set for token ${tokenId}`)

		const meem = await orm.models.Meem.findOne({
			where: {
				tokenId
			},
			include: [
				{
					model: orm.models.MeemContract,
					where: {
						address: args.address
					}
				}
			]
		})

		if (!meem) {
			throw new Error('MEEM_NOT_FOUND')
		}

		meem.reactionTypes = reactionTypes
		await meem.save()
	}

	public static async meemHandleTransfer(args: {
		address: string
		transactionHash: string
		transactionTimestamp: number
		eventData: MeemTransferEventObject
	}) {
		const tokenId = args.eventData.tokenId.toHexString()
		let meem = await orm.models.Meem.findOne({
			where: {
				tokenId
			},
			include: [
				{
					model: orm.models.MeemContract,
					where: {
						address: args.address
					}
				}
			]
		})

		if (!meem) {
			log.debug(`Creating new meem: ${tokenId}`)
			meem = await this.createNewMeem(args.address, tokenId)
		} else {
			log.debug(`Updating meem: ${tokenId}`)
			meem.owner = args.eventData.to
			await meem.save()
			if (!meem.data || !meem.metadata) {
				await this.updateMeem({ meem })
			}
		}

		const transferredAt = DateTime.fromSeconds(
			args.transactionTimestamp
		).toJSDate()

		await orm.models.Transfer.create({
			from: args.eventData.from,
			to: args.eventData.to,
			transactionHash: args.transactionHash,
			transferredAt,
			MeemId: meem.id
		})

		// if (config.ENABLE_GUNDB) {
		// 	const transfer = gun
		// 		.user()
		// 		.get('transfers')
		// 		.get(evt.transactionHash)
		// 		.put({
		// 			event: evt.event,
		// 			from: args.eventData.from,
		// 			to: args.eventData.to,
		// 			tokenId: args.eventData.tokenId,
		// 			blockHash: evt.blockHash,
		// 			blockNumber: evt.blockNumber,
		// 			data: evt.data,
		// 			transactionHash: evt.transactionHash
		// 		})

		// 	const token = gun.user().get('meems').get(tokenId)
		// 	token.get('transfers').put(transfer)
		// 	transfer.get('token').put(token)
		// }
	}

	public static async createNewMeem(address: string, tokenId: string) {
		// TODO: Do we pass the contract address to getMeemContract?
		const meemContract = await services.meem.getMeemContract({
			address
		})

		log.debug(`Fetching meem from contract: ${tokenId}`)

		// Fetch the meem data and create it
		const [meemData, tokenURI] = await Promise.all([
			meemContract.getMeem(tokenId),
			meemContract.tokenURI(tokenId)
		])

		log.debug(`Meem found`, tokenURI, meemData)

		let meemContractData = await orm.models.MeemContract.findOne({
			where: {
				address
			}
		})

		if (!meemContractData) {
			meemContractData = await this.meemHandleContractInitialized({
				address
			})
			if (!meemContractData) {
				throw new Error('MEEM_CONTRACT_NOT_FOUND')
			}
		}

		const metadata = (await services.meem.getErc721Metadata(
			tokenURI
		)) as MeemAPI.IMeemMetadata

		const properties = orm.models.MeemProperties.build({
			id: uuidv4(),
			...this.meemPropertiesDataToModelData(meemData.properties)
		})
		const childProperties = orm.models.MeemProperties.build({
			id: uuidv4(),
			...this.meemPropertiesDataToModelData(meemData.childProperties)
		})

		const data: Record<string, any> = {
			id: uuidv4(),
			meemId: metadata.meem_id ?? null,
			tokenId,
			tokenURI,
			owner: meemData.owner,
			parentChain: meemData.parentChain,
			parent: meemData.parent,
			parentTokenId: meemData.parentTokenId.toHexString(),
			rootChain: meemData.rootChain,
			root: meemData.root,
			rootTokenId: meemData.rootTokenId.toHexString(),
			generation: meemData.generation,
			mintedAt: DateTime.fromSeconds(meemData.mintedAt.toNumber()).toJSDate(),
			metadata,
			// data: meemData.data,
			PropertiesId: properties.id,
			ChildPropertiesId: childProperties.id,
			meemType: meemData.meemType,
			mintedBy: meemData.mintedBy,
			uriLockedBy: meemData.uriLockedBy,
			uriSource: meemData.uriSource,
			reactionTypes: meemData.reactionTypes,
			MeemContractId: meemContractData.id
		}

		log.debug(`Saving meem to db: ${tokenId}`)
		const t = await orm.sequelize.transaction()

		const promises: Promise<any>[] = []

		const parentMeem =
			meemData.parent.toLowerCase() ===
				config.MEEM_PROXY_ADDRESS.toLowerCase() &&
			[MeemAPI.MeemType.Remix, MeemAPI.MeemType.Copy].includes(
				meemData.meemType
			)
				? await orm.models.Meem.findOne({
						where: {
							tokenId: meemData.parentTokenId.toHexString()
						},
						include: [
							{
								model: orm.models.MeemContract,
								where: {
									address
								}
							}
						]
				  })
				: null

		if (parentMeem) {
			promises.push(meemContract.numCopiesOf(parentMeem.tokenId))
			promises.push(meemContract.numRemixesOf(parentMeem.tokenId))
		}

		promises.push(properties.save({ transaction: t }))
		promises.push(childProperties.save({ transaction: t }))

		const [numCopies, numRemixes] = await Promise.all(promises)

		const createUpdatePromises: Promise<any>[] = [
			orm.models.Meem.create(data, { transaction: t })
		]
		if (parentMeem) {
			parentMeem.numCopies = (numCopies as BigNumber).toNumber()
			parentMeem.numRemixes = (numRemixes as BigNumber).toNumber()
			promises.push(parentMeem.save({ transaction: t }))
		}

		const [meem] = (await Promise.all(createUpdatePromises)) as [Meem]

		await t.commit()

		try {
			const meemDataJson = services.meem.parseMeemData(meem.data)

			if (meemDataJson.tweetId) {
				log.debug(
					`Tweet Meem. Saving MeemId (${meem.id}) to tweet: (${meemDataJson.twitterId})`
				)
				const tweetMeem = await orm.models.Tweet.findOne({
					where: {
						tweetId: meemDataJson.tweetId
					}
				})

				if (tweetMeem) {
					tweetMeem.MeemId = meem.id
					await tweetMeem.save()
				}
			}
		} catch (e) {
			log.warn(e)
		}

		// if (config.ENABLE_GUNDB) {
		// 	const d = {
		// 		...data,
		// 		mintedAt: meemData.mintedAt.toNumber()
		// 		// properties: properties.get({ plain: true }),
		// 		// childProperties: childProperties.get({ plain: true }),
		// 		// metadata
		// 	}

		// 	const token = this.saveToGun({ paths: ['meems', tokenId], data: d })
		// 	const tokenProperties = this.saveToGun({
		// 		paths: ['properties', tokenId],
		// 		data: properties.get({ plain: true })
		// 	})
		// 	const tokenChildProperties = this.saveToGun({
		// 		paths: ['childProperties', tokenId],
		// 		data: childProperties.get({ plain: true })
		// 	})
		// 	const tokenMetadata = this.saveToGun({
		// 		paths: ['metadata', tokenId],
		// 		data: metadata
		// 	})

		// 	token.get('properties').put(tokenProperties)
		// 	token.get('childProperties').put(tokenChildProperties)
		// 	token.get('metadata').put(tokenMetadata)
		// 	tokenProperties.get('token').put(token)
		// 	tokenChildProperties.get('token').put(token)
		// 	tokenMetadata.get('token').put(token)

		// 	let parent: IGunChainReference<any, string | number | symbol, false>
		// 	let root: IGunChainReference<any, string | number | symbol, false>

		// 	if (meemData.parent === config.MEEM_PROXY_ADDRESS) {
		// 		// Parent is a meem
		// 		parent = gun
		// 			.user()
		// 			.get('meems')
		// 			.get(meemData.parentTokenId.toHexString())
		// 		token.get('parentMeem').put(parent)
		// 		parent.get('childMeems').put(token)
		// 	}

		// 	if (meemData.root === config.MEEM_PROXY_ADDRESS) {
		// 		// Parent is a meem
		// 		root = gun.user().get('meems').get(meemData.parentTokenId.toHexString())
		// 		token.get('rootMeem').put(root)
		// 		root.get('descendantMeems').put(token)
		// 	}
		// }

		return meem
	}

	public static saveToGun(options: {
		paths: string[]
		from?: IGunChainReference<any, string, false>
		data: any
	}): IGunChainReference<any, string, false> {
		// return new Promise((resolve, reject) => {
		const { paths, data, from } = options
		let item: IGunChainReference<any, string, false> = gun.user()

		if (paths.length === 0) {
			throw new Error('Paths must be set')
		}

		paths.forEach(path => {
			if (from && !item) {
				item = from.get(path)
			} else if (item) {
				item = item.get(path)
			} else {
				item = gun.user().get(path)
			}
		})

		const dataObject = this.toPureObject(data)

		Object.keys(dataObject).forEach(key => {
			const val = dataObject[key]
			if (typeof val === 'object') {
				this.saveToGun({ paths: [key], from: item, data: val })
			} else if (Object.prototype.toString.call(val) === '[object Date]') {
				item.get(key).put(((val as Date).getTime() / 1000) as any, ack => {
					if (ack.ok) {
						log.debug(`Gun sync: ${paths.join('/')}/${key}`)
					} else if (ack.err) {
						log.crit(ack.err)
					}
				})
			} else {
				item.get(key).put(val, ack => {
					if (ack.ok) {
						log.debug(`Gun sync: ${paths.join('/')}/${key}`)
					} else if (ack.err) {
						log.crit(`Error saving: ${key}`, val)
						log.crit(ack.err)
					}
				})
			}
		})

		return item
	}

	private static async updateMeem(options: { meem: Meem }) {
		const { meem } = options
		log.debug(`Syncing meem tokenId: ${meem.tokenId}`)
		const meemContract = await services.meem.getMeemContract({
			address: meem.MeemContract.address
		})
		// Fetch the meem data and create it
		const [meemData, tokenURI] = await Promise.all([
			meemContract.getMeem(meem.tokenId),
			meemContract.tokenURI(meem.tokenId)
		])

		const metadata = (await services.meem.getErc721Metadata(
			tokenURI
		)) as MeemAPI.IMeemMetadata

		// meem.data = meemData.data
		meem.metadata = metadata
		meem.uriLockedBy = meemData.uriLockedBy
		await meem.save()
	}

	private static meemPropertiesDataToModelData(
		props: MeemPropertiesStructOutput
	) {
		return {
			totalCopies: props.totalCopies.toHexString(),
			totalCopiesLockedBy: props.totalCopiesLockedBy,
			copiesPerWallet: props.copiesPerWallet.toHexString(),
			copiesPerWalletLockedBy: props.copiesPerWalletLockedBy,
			totalRemixes: props.totalRemixes.toHexString(),
			totalRemixesLockedBy: props.totalRemixesLockedBy,
			remixesPerWallet: props.remixesPerWallet.toHexString(),
			remixesPerWalletLockedBy: props.remixesPerWalletLockedBy,
			copyPermissions: this.meemPermissionsDataToModelData(
				props.copyPermissions
			),
			remixPermissions: this.meemPermissionsDataToModelData(
				props.remixPermissions
			),
			readPermissions: this.meemPermissionsDataToModelData(
				props.readPermissions
			),
			copyPermissionsLockedBy: props.copyPermissionsLockedBy,
			remixPermissionsLockedBy: props.remixPermissionsLockedBy,
			readPermissionsLockedBy: props.readPermissionsLockedBy,
			splits: this.meemSplitsDataToModelData(props.splits),
			splitsLockedBy: props.splitsLockedBy,
			isTransferrable: props.isTransferrable,
			isTransferrableLockedBy: props.isTransferrableLockedBy,
			mintStartAt: props.mintStartTimestamp.toHexString(),
			mintEndAt: props.mintEndTimestamp.toHexString(),
			mintDatesLockedBy: props.mintDatesLockedBy,
			transferLockupUntil: !props.transferLockupUntil.isZero
				? props.transferLockupUntil.toHexString()
				: null,
			transferLockupUntilLockedBy: props.transferLockupUntilLockedBy
		}
	}

	private static meemSplitsDataToModelData(splits: SplitStructOutput[]) {
		return splits.map(s => ({
			toAddress: s.toAddress,
			amount: s.amount.toNumber(),
			lockedBy: s.lockedBy
		}))
	}

	private static meemPermissionsDataToModelData(
		perms: MeemPermissionStructOutput[]
	) {
		return perms.map(p => ({
			permission: p.permission,
			addresses: p.addresses,
			numTokens: p.numTokens.toHexString(),
			lockedBy: p.lockedBy,
			costWei: p.costWei.toHexString()
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
