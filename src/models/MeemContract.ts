import { BigNumber } from 'ethers'
import { DateTime } from 'luxon'
import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import { MeemAPI } from '../types/meem.generated'
import type { IModels } from '../types/models'
import Integration from './Integration'
import type Meem from './Meem'
import type MeemProperties from './MeemProperties'
import Wallet from './Wallet'

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
				const bigNumberString = val ?? BigNumber.from(-1).toHexString()
				const timestamp = services.web3.toBigNumber(bigNumberString).toNumber()
				if (timestamp < 1) {
					this.setDataValue('mintStartAt', null)
				} else {
					this.setDataValue(
						'mintStartAt',
						DateTime.fromSeconds(
							services.web3.toBigNumber(bigNumberString).toNumber()
						).toJSDate()
					)
				}
			}
		},
		mintEndAt: {
			type: DataTypes.DATE,
			set(this: MeemContract, val: any) {
				const bigNumberString = val ?? BigNumber.from(-1).toHexString()
				const timestamp = services.web3.toBigNumber(bigNumberString).toNumber()
				if (timestamp < 1) {
					this.setDataValue('mintEndAt', null)
				} else {
					this.setDataValue(
						'mintEndAt',
						DateTime.fromSeconds(
							services.web3.toBigNumber(bigNumberString).toNumber()
						).toJSDate()
					)
				}
			}
		},
		mintDatesLockedBy: {
			type: DataTypes.STRING,
			allowNull: false
		},
		transferLockupUntil: {
			type: DataTypes.DATE,
			set(this: MeemContract, val: any) {
				const bigNumberString = val ?? BigNumber.from(-1).toHexString()
				const timestamp = services.web3.toBigNumber(bigNumberString).toNumber()
				if (timestamp < 1) {
					this.setDataValue('transferLockupUntil', null)
				} else {
					this.setDataValue(
						'transferLockupUntil',
						DateTime.fromSeconds(
							services.web3.toBigNumber(bigNumberString).toNumber()
						).toJSDate()
					)
				}
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

	public Wallets!: Wallet[]

	public Integrations!: Integration[]

	public static associate(models: IModels) {
		this.hasMany(models.Meem)

		this.belongsToMany(models.Wallet, {
			through: models.MeemContractWallet
		})

		this.belongsToMany(models.Integration, {
			through: models.MeemContractIntegration
		})

		this.belongsTo(models.MeemProperties, {
			as: 'DefaultProperties'
		})

		this.belongsTo(models.MeemProperties, {
			as: 'DefaultChildProperties'
		})
	}
}
