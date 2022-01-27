import { IGunChainReference } from 'gun/types/chain'
import { DateTime } from 'luxon'
import { v4 as uuidv4 } from 'uuid'
import Meem from '../models/Meem'
import {
	ChildrenPerWalletSetEvent,
	MeemPermissionStructOutput,
	MeemPropertiesStructOutput,
	PermissionsSetEvent,
	PropertiesSetEvent,
	SplitsSetEvent,
	SplitStructOutput,
	TotalChildrenLockedEvent,
	TotalChildrenSetEvent,
	TransferEvent
} from '../types/Meem'
import { MeemAPI } from '../types/meem.generated'

export default class ContractEvent {
	public static async meemSync(specificEvents?: TransferEvent[]) {
		log.debug('Syncing meems...')
		const meemContract = services.meem.getMeemContract()
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

	public static async meemHandleTotalChildrenSet(evt: TotalChildrenSetEvent) {
		const tokenId = evt.args.tokenId.toHexString()
		const { newTotalChildren } = evt.args

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
			meem.Properties.totalChildren = newTotalChildren.toHexString()
			await meem.save()
		}
	}

	public static async meemHandleTotalChildrenLocked(
		evt: TotalChildrenLockedEvent
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
			meem.Properties.totalChildrenLockedBy = lockedBy
			await meem.save()
		}
	}

	public static async meemHandleChildrenPerWalletSet(
		evt: ChildrenPerWalletSetEvent
	) {
		const tokenId = evt.args.tokenId.toHexString()
		const { newTotalChildren } = evt.args

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
			meem.Properties.childrenPerWallet = newTotalChildren.toHexString()
			await meem.save()
		}
	}

	public static async meemHandleChildrenPerWalletLocked(
		evt: TotalChildrenLockedEvent
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
			meem.Properties.childrenPerWalletLockedBy = lockedBy
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

		const block = await evt.getBlock()

		gun.get('meems').get(tokenId).get('transfers').get(block.timestamp).put({
			event: evt.event,
			from: evt.args.from,
			to: evt.args.to,
			tokenId: evt.args.tokenId,
			blockHash: evt.blockHash,
			blockNumber: evt.blockNumber,
			data: evt.data,
			transactionHash: evt.transactionHash
		})
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
		const meemContract = services.meem.getMeemContract()
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

		const d = this.toPureObject({
			...data,
			mintedAt: meemData.mintedAt.toNumber()
		})

		const token = gun
			.user()
			.get('meems')
			.get(tokenId)
			.put(d, ack => {
				if (ack.ok) {
					log.debug(`Put data to gun for ${tokenId}`)
				}
				if (ack.err) {
					log.warn(ack.err)
				}
			})

		token.get('properties').put(properties.get({ plain: true }))
		token.get('childProperties').put(childProperties.get({ plain: true }))
		token.get('metadata').put(metadata)

		let parent: IGunChainReference<any, string | number | symbol, false>
		let root: IGunChainReference<any, string | number | symbol, false>

		if (meemData.parent === config.MEEM_PROXY_ADDRESS) {
			// Parent is a meem
			parent = gun.get('meems').get(meemData.parentTokenId.toHexString())
			token.get('parentMeem').put(parent)
			parent.get('childMeems').put(token)
		}

		if (meemData.root === config.MEEM_PROXY_ADDRESS) {
			// Parent is a meem
			root = gun.get('meems').get(meemData.parentTokenId.toHexString())
			token.get('rootMeem').put(root)
			root.get('descendantMeems').put(token)
		}
	}

	private static async updateMeem(options: { meem: Meem }) {
		const { meem } = options
		log.debug(`Syncing meem tokenId: ${meem.tokenId}`)
		const meemContract = services.meem.getMeemContract()
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
			totalChildren: props.totalChildren.toHexString(),
			totalChildrenLockedBy: props.totalChildrenLockedBy,
			childrenPerWallet: props.childrenPerWallet.toHexString(),
			childrenPerWalletLockedBy: props.childrenPerWalletLockedBy,
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

	public static toPureObject(d: Record<string, any>) {
		const data = { ...d }

		Object.keys(data).forEach(key => {
			const val = data[key]
			if (Array.isArray(val) || typeof val === 'object') {
				data[key] = this.toPureObject(val)
			} else if (Object.prototype.toString.call(val) === '[object Date]') {
				data[key] = (val as Date).toString()
			}
		})

		return data
	}
}
