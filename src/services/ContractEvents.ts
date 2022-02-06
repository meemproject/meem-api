import { IGunChainReference } from 'gun/types/chain'
import { DateTime } from 'luxon'
import { v4 as uuidv4 } from 'uuid'
import { wait } from '../lib/utils'
import Meem from '../models/Meem'
import {
	RemixesPerWalletSetEvent,
	CopiesPerWalletSetEvent,
	MeemPermissionStructOutput,
	MeemPropertiesStructOutput,
	PermissionsSetEvent,
	PropertiesSetEvent,
	SplitsSetEvent,
	SplitStructOutput,
	TotalRemixesLockedEvent,
	TotalRemixesSetEvent,
	TotalCopiesLockedEvent,
	TotalCopiesSetEvent,
	TransferEvent
} from '../types/Meem'
import { MeemAPI } from '../types/meem.generated'

export default class ContractEvent {
	public static async meemSync(specificEvents?: TransferEvent[]) {
		log.debug('Syncing meems...')
		const meemContract = await services.meem.getMeemContract()
		const events =
			specificEvents ??
			(await meemContract.queryFilter(meemContract.filters.Transfer()))

		log.debug(`Syncing ${events.length} transfer events`)

		const failedEvents: TransferEvent[] = []

		for (let i = 0; i < events.length; i += 1) {
			try {
				log.debug(`Syncing ${i + 1} / ${events.length} events`)
				// eslint-disable-next-line no-await-in-loop
				await this.meemHandleTransfer(events[i])
				// eslint-disable-next-line no-await-in-loop
				await wait(2000)
			} catch (e) {
				failedEvents.push(events[i])
				log.crit(e)
				log.debug(events[i])
			}
		}

		if (failedEvents.length > 0) {
			log.debug(`Retrying ${failedEvents.length} events`)
			await this.meemSync(failedEvents)
		}
	}

	public static async meemHandleTotalCopiesSet(evt: TotalCopiesSetEvent) {
		const tokenId = evt.args.tokenId.toHexString()
		const { newTotalCopies } = evt.args

		const meem = await orm.models.Meem.findOne({
			where: {
				tokenId
			},
			include: [
				{
					model: orm.models.MeemProperties,
					as: 'Properties'
				}
			]
		})

		if (!meem) {
			await this.createNewMeem(tokenId)
		} else if (meem.Properties) {
			meem.Properties.totalCopies = newTotalCopies.toHexString()
			await meem.save()
		}
	}

	public static async meemHandleTotalRemixesSet(evt: TotalRemixesSetEvent) {
		const tokenId = evt.args.tokenId.toHexString()
		const { newTotalRemixes } = evt.args

		const meem = await orm.models.Meem.findOne({
			where: {
				tokenId
			},
			include: [
				{
					model: orm.models.MeemProperties,
					as: 'Properties'
				}
			]
		})

		if (!meem) {
			await this.createNewMeem(tokenId)
		} else if (meem.Properties) {
			meem.Properties.totalRemixes = newTotalRemixes.toHexString()
			await meem.save()
		}
	}

	public static async meemHandleTotalCopiesLocked(evt: TotalCopiesLockedEvent) {
		const tokenId = evt.args.tokenId.toHexString()
		const { lockedBy } = evt.args

		const meem = await orm.models.Meem.findOne({
			where: {
				tokenId
			},
			include: [
				{
					model: orm.models.MeemProperties,
					as: 'Properties'
				}
			]
		})

		if (!meem) {
			await this.createNewMeem(tokenId)
		} else if (meem.Properties) {
			meem.Properties.totalCopiesLockedBy = lockedBy
			await meem.save()
		}
	}

	public static async meemHandleTotalRemixesLocked(
		evt: TotalRemixesLockedEvent
	) {
		const tokenId = evt.args.tokenId.toHexString()
		const { lockedBy } = evt.args

		const meem = await orm.models.Meem.findOne({
			where: {
				tokenId
			},
			include: [
				{
					model: orm.models.MeemProperties,
					as: 'Properties'
				}
			]
		})

		if (!meem) {
			await this.createNewMeem(tokenId)
		} else if (meem.Properties) {
			meem.Properties.totalRemixesLockedBy = lockedBy
			await meem.save()
		}
	}

	public static async meemHandleCopiesPerWalletSet(
		evt: CopiesPerWalletSetEvent
	) {
		const tokenId = evt.args.tokenId.toHexString()
		const { newTotalCopies } = evt.args

		const meem = await orm.models.Meem.findOne({
			where: {
				tokenId
			},
			include: [
				{
					model: orm.models.MeemProperties,
					as: 'Properties'
				}
			]
		})

		if (!meem) {
			await this.createNewMeem(tokenId)
		} else if (meem.Properties) {
			meem.Properties.copiesPerWallet = newTotalCopies.toHexString()
			await meem.save()
		}
	}

	public static async meemHandleRemixesPerWalletSet(
		evt: RemixesPerWalletSetEvent
	) {
		const tokenId = evt.args.tokenId.toHexString()
		const { newTotalRemixes } = evt.args

		const meem = await orm.models.Meem.findOne({
			where: {
				tokenId
			},
			include: [
				{
					model: orm.models.MeemProperties,
					as: 'Properties'
				}
			]
		})

		if (!meem) {
			await this.createNewMeem(tokenId)
		} else if (meem.Properties) {
			meem.Properties.remixesPerWallet = newTotalRemixes.toHexString()
			await meem.save()
		}
	}

	public static async meemHandleCopiesPerWalletLocked(
		evt: TotalCopiesLockedEvent
	) {
		const tokenId = evt.args.tokenId.toHexString()
		const { lockedBy } = evt.args

		const meem = await orm.models.Meem.findOne({
			where: {
				tokenId
			},
			include: [
				{
					model: orm.models.MeemProperties,
					as: 'Properties'
				}
			]
		})

		if (!meem) {
			await this.createNewMeem(tokenId)
		} else if (meem.Properties) {
			meem.Properties.copiesPerWalletLockedBy = lockedBy
			await meem.save()
		}
	}

	public static async meemHandleRemixesPerWalletLocked(
		evt: TotalRemixesLockedEvent
	) {
		const tokenId = evt.args.tokenId.toHexString()
		const { lockedBy } = evt.args

		const meem = await orm.models.Meem.findOne({
			where: {
				tokenId
			},
			include: [
				{
					model: orm.models.MeemProperties,
					as: 'Properties'
				}
			]
		})

		if (!meem) {
			await this.createNewMeem(tokenId)
		} else if (meem.Properties) {
			meem.Properties.remixesPerWalletLockedBy = lockedBy
			await meem.save()
		}
	}

	public static async meemHandleSplitsSet(evt: SplitsSetEvent) {
		const tokenId = evt.args.tokenId.toHexString()
		const { splits } = evt.args

		const meem = await orm.models.Meem.findOne({
			where: {
				tokenId
			},
			include: [
				{
					model: orm.models.MeemProperties,
					as: 'Properties'
				}
			]
		})

		if (!meem) {
			await this.createNewMeem(tokenId)
		} else if (meem.Properties) {
			meem.Properties.splits = this.meemSplitsDataToModelData(splits)
		}
	}

	public static async meemHandlePropertiesSet(evt: PropertiesSetEvent) {
		const tokenId = evt.args.tokenId.toHexString()
		const { propertyType, props } = evt.args
		const meem = await orm.models.Meem.findOne({
			where: {
				tokenId
			},
			include: [
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

		if (!meem) {
			await this.createNewMeem(tokenId)
		} else if (propertyType === MeemAPI.PropertyType.Meem) {
			await meem.Properties?.update(this.meemPropertiesDataToModelData(props))
		} else if (propertyType === MeemAPI.PropertyType.Child) {
			await meem.ChildProperties?.update(
				this.meemPropertiesDataToModelData(props)
			)
		}
	}

	public static async meemHandleTransfer(evt: TransferEvent) {
		const tokenId = evt.args.tokenId.toHexString()
		const meem = await orm.models.Meem.findOne({
			where: {
				tokenId
			}
		})

		if (!meem) {
			log.debug(`Creating new meem: ${tokenId}`)
			await this.createNewMeem(tokenId)
		} else {
			log.debug(`Updating meem: ${tokenId}`)
			meem.owner = evt.args.to
			await meem.save()
			if (!meem.data || !meem.metadata) {
				await this.updateMeem({ meem })
			}
		}

		// const block = await evt.getBlock()

		if (config.ENABLE_GUNDB) {
			const transfer = gun
				.user()
				.get('transfers')
				.get(evt.transactionHash)
				.put({
					event: evt.event,
					from: evt.args.from,
					to: evt.args.to,
					tokenId: evt.args.tokenId,
					blockHash: evt.blockHash,
					blockNumber: evt.blockNumber,
					data: evt.data,
					transactionHash: evt.transactionHash
				})

			const token = gun.user().get('meems').get(tokenId)
			token.get('transfers').put(transfer)
			transfer.get('token').put(token)
		}
	}

	public static async meemHandlePermissionsSet(evt: PermissionsSetEvent) {
		const tokenId = evt.args.tokenId.toHexString()
		const { propertyType, permissionType, permission } = evt.args
		const meem = await orm.models.Meem.findOne({
			where: {
				tokenId
			},
			include: [
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

		if (!meem) {
			await this.createNewMeem(tokenId)
		} else {
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
			await meem.save()
		}
	}

	public static async createNewMeem(tokenId: string) {
		const meemContract = await services.meem.getMeemContract()
		// Fetch the meem data and create it
		const [meemData, tokenURI] = await Promise.all([
			meemContract.getMeem(tokenId),
			meemContract.tokenURI(tokenId)
		])

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

		const data = {
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
			data: meemData.data,
			PropertiesId: properties.id,
			ChildPropertiesId: childProperties.id
		}

		const meem = orm.models.Meem.build(data)

		await Promise.all([properties.save(), childProperties.save()])

		await meem.save()

		if (config.ENABLE_GUNDB) {
			const d = {
				...data,
				mintedAt: meemData.mintedAt.toNumber()
				// properties: properties.get({ plain: true }),
				// childProperties: childProperties.get({ plain: true }),
				// metadata
			}

			const token = this.saveToGun({ paths: ['meems', tokenId], data: d })
			const tokenProperties = this.saveToGun({
				paths: ['properties', tokenId],
				data: properties.get({ plain: true })
			})
			const tokenChildProperties = this.saveToGun({
				paths: ['childProperties', tokenId],
				data: childProperties.get({ plain: true })
			})
			const tokenMetadata = this.saveToGun({
				paths: ['metadata', tokenId],
				data: metadata
			})

			token.get('properties').put(tokenProperties)
			token.get('childProperties').put(tokenChildProperties)
			token.get('metadata').put(tokenMetadata)
			tokenProperties.get('token').put(token)
			tokenChildProperties.get('token').put(token)
			tokenMetadata.get('token').put(token)

			let parent: IGunChainReference<any, string | number | symbol, false>
			let root: IGunChainReference<any, string | number | symbol, false>

			if (meemData.parent === config.MEEM_PROXY_ADDRESS) {
				// Parent is a meem
				parent = gun
					.user()
					.get('meems')
					.get(meemData.parentTokenId.toHexString())
				token.get('parentMeem').put(parent)
				parent.get('childMeems').put(token)
			}

			if (meemData.root === config.MEEM_PROXY_ADDRESS) {
				// Parent is a meem
				root = gun.user().get('meems').get(meemData.parentTokenId.toHexString())
				token.get('rootMeem').put(root)
				root.get('descendantMeems').put(token)
			}
		}
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
		const meemContract = await services.meem.getMeemContract()
		// Fetch the meem data and create it
		const [meemData, tokenURI] = await Promise.all([
			meemContract.getMeem(meem.tokenId),
			meemContract.tokenURI(meem.tokenId)
		])

		const metadata = (await services.meem.getErc721Metadata(
			tokenURI
		)) as MeemAPI.IMeemMetadata

		meem.data = meemData.data
		meem.metadata = metadata
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
			splitsLockedBy: props.splitsLockedBy
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
			lockedBy: p.lockedBy
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
