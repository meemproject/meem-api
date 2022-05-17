import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import { MeemAPI } from '../types/meem.generated'
import type { IModels } from '../types/models'
import type Meem from './Meem'

export default class MeemContract extends BaseModel<MeemContract> {
	public static readonly modelName = 'MeemContract'

	public static get indexes() {
		return [
			{
				name: 'MeemContract_createdAt',
				fields: ['createdAt']
			}
		]
	}

	public static readonly attributes = {
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		address: {
			type: DataTypes.STRING,
			allowNull: false
		},
		totalOriginalsSupply: {
			type: DataTypes.STRING,
			allowNull: false,
			set(this: MeemContract, val: any) {
				this.setDataValue(
					'totalOriginalsSupply',
					services.web3.toBigNumber(val).toHexString()
				)
			}
		},
		totalOriginalsSupplyLockedBy: {
			type: DataTypes.STRING,
			allowNull: false
		},
		mintPermissions: {
			type: DataTypes.JSONB,
			allowNull: false
		},
		mintPermissionsLockedBy: {
			type: DataTypes.STRING,
			allowNull: false
		},
		splits: {
			type: DataTypes.JSONB,
			allowNull: false
		},
		splitsLockedBy: {
			type: DataTypes.STRING,
			allowNull: false
		},
		originalsPerWallet: {
			type: DataTypes.STRING,
			allowNull: false,
			set(this: MeemContract, val: any) {
				this.setDataValue(
					'originalsPerWallet',
					services.web3.toBigNumber(val).toHexString()
				)
			}
		},
		originalsPerWalletLockedBy: {
			type: DataTypes.STRING,
			allowNull: false
		},
		isTransferrable: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: true
		},
		isTransferrableLockedBy: {
			type: DataTypes.STRING,
			allowNull: false
		},
		mintStartTimestamp: {
			type: DataTypes.STRING,
			allowNull: false,
			set(this: MeemContract, val: any) {
				this.setDataValue(
					'mintStartTimestamp',
					services.web3.toBigNumber(val).toHexString()
				)
			}
		},
		mintEndTimestamp: {
			type: DataTypes.STRING,
			allowNull: true,
			set(this: MeemContract, val: any) {
				if (!val) {
					return
				}
				this.setDataValue(
					'mintEndTimestamp',
					services.web3.toBigNumber(val).toHexString()
				)
			}
		},
		mintDatesLockedBy: {
			type: DataTypes.STRING,
			allowNull: false
		},
		transferLockupUntil: {
			type: DataTypes.STRING,
			allowNull: true,
			set(this: MeemContract, val: any) {
				if (!val) {
					return
				}
				this.setDataValue(
					'transferLockupUntil',
					services.web3.toBigNumber(val).toHexString()
				)
			}
		},
		transferLockupUntilLockedBy: {
			type: DataTypes.STRING,
			allowNull: false
		}
	}

	public id!: string

	public address!: string

	public totalOriginalsSupply!: string

	public totalOriginalsSupplyLockedBy!: string

	public mintPermissions!: MeemAPI.IMeemPermission[]

	public mintPermissionsLockedBy!: string

	public splits!: MeemAPI.IMeemSplit[]

	public splitsLockedBy!: string

	public originalsPerWallet!: string

	public originalsPerWalletLockedBy!: string

	public isTransferrable!: boolean

	public isTransferrableLockedBy!: string

	public mintStartTimestamp!: string

	public mintEndTimestamp!: string

	public mintDatesLockedBy!: string

	public transferLockupUntil!: string

	public transferLockupUntilLockedBy!: string

	public meem?: Meem[] | null

	public static associate(models: IModels) {
		this.hasMany(models.Meem)
	}
}
