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
	public static async meemSync() {
		const meemContract = services.meem.getMeemContract()
		const events = await meemContract.queryFilter(
			meemContract.filters.Transfer()
		)

		for (let i = 0; i < events.length; i += 1) {
			// eslint-disable-next-line no-await-in-loop
			await this.meemHandleTransfer(events[i])
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
			await this.createNewMeem(tokenId)
		} else {
			meem.owner = evt.args.to
			await meem.save()
			if (!meem.data || !meem.metadata) {
				await this.updateMeem({ meem })
			}
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

	private static async createNewMeem(tokenId: string) {
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
		const meem = orm.models.Meem.build({
			id: metadata.meem_id || uuidv4(),
			tokenId,
			tokenURI,
			owner: meemData.owner,
			parentChain: meemData.parentChain,
			parentTokenId: meemData.parentTokenId.toHexString(),
			rootChain: meemData.rootChain,
			rootTokenId: meemData.rootTokenId.toHexString(),
			generation: meemData.generation,
			mintedAt: DateTime.fromSeconds(meemData.mintedAt.toNumber()).toJSDate(),
			metadata,
			data: meemData.data,
			PropertiesId: properties.id,
			ChildPropertiesId: childProperties.id
		})

		await Promise.all([properties.save(), childProperties.save()])

		await meem.save()
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
}
