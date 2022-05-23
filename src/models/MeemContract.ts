import { DateTime } from 'luxon'
import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import { MeemAPI } from '../types/meem.generated'
import type { IModels } from '../types/models'
import type Meem from './Meem'
import MeemContractWallet from './MeemContractWallet'
import type MeemProperties from './MeemProperties'

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
		slug: {
			type: DataTypes.STRING,
			allowNull: false
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false
		},
		symbol: {
			type: DataTypes.STRING,
			allowNull: false
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
		mintStartAt: {
			type: DataTypes.DATE,
			set(this: MeemContract, val: any) {
				this.setDataValue(
					'mintStartAt',
					DateTime.fromSeconds(
						services.web3.toBigNumber(val).toNumber()
					).toJSDate()
				)
			}
		},
		mintEndAt: {
			type: DataTypes.DATE,
			set(this: MeemContract, val: any) {
				if (!val) {
					return
				}
				this.setDataValue(
					'mintEndAt',
					DateTime.fromSeconds(
						services.web3.toBigNumber(val).toNumber()
					).toJSDate()
				)
			}
		},
		mintDatesLockedBy: {
			type: DataTypes.STRING,
			allowNull: false
		},
		transferLockupUntil: {
			type: DataTypes.DATE,
			set(this: MeemContract, val: any) {
				if (!val) {
					return
				}
				this.setDataValue(
					'transferLockupUntil',
					DateTime.fromSeconds(
						services.web3.toBigNumber(val).toNumber()
					).toJSDate()
				)
			}
		},
		transferLockupUntilLockedBy: {
			type: DataTypes.STRING,
			allowNull: false
		},
		contractURI: {
			type: DataTypes.TEXT,
			allowNull: false,
			defaultValue: ''
		}
	}

	public id!: string

	public name!: string

	public slug!: string

	public symbol!: string

	public contractURI!: string

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

	public mintStartAt!: Date | null

	public mintEndAt!: Date | null

	public mintDatesLockedBy!: string

	public transferLockupUntil!: Date | null

	public transferLockupUntilLockedBy!: string

	public meem?: Meem[] | null

	public DefaultPropertiesId!: string | null

	public DefaultChildPropertiesId!: string | null

	public DefaultProperties!: MeemProperties | null

	public DefaultChildProperties!: MeemProperties | null

	public MeemContractWallets!: MeemContractWallet[]

	public static associate(models: IModels) {
		this.hasMany(models.Meem)

		this.belongsToMany(models.Wallet, {
			through: models.MeemContractWallet
		})

		this.belongsTo(models.MeemProperties, {
			as: 'DefaultProperties'
		})

		this.belongsTo(models.MeemProperties, {
			as: 'DefaultChildProperties'
		})
	}
}
