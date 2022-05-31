import { BigNumber } from 'ethers'
import { DateTime } from 'luxon'
import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import { MeemAPI } from '../types/meem.generated'
import type { IModels } from '../types/models'
import MeemContract from './MeemContract'

export default class MeemProperties extends BaseModel<MeemProperties> {
	public static readonly modelName = 'MeemProperties'

	public static get indexes() {
		return [
			{
				name: 'MeemProperties_createdAt',
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
		totalRemixes: {
			type: DataTypes.STRING,
			allowNull: false,
			set(this: MeemProperties, val: any) {
				this.setDataValue(
					'totalRemixes',
					services.web3.toBigNumber(val).toHexString()
				)
			}
		},
		totalRemixesLockedBy: {
			type: DataTypes.STRING,
			allowNull: false
		},
		remixesPerWallet: {
			type: DataTypes.STRING,
			allowNull: false,
			set(this: MeemProperties, val: any) {
				this.setDataValue(
					'remixesPerWallet',
					services.web3.toBigNumber(val).toHexString()
				)
			}
		},
		remixesPerWalletLockedBy: {
			type: DataTypes.STRING,
			allowNull: false
		},
		totalCopies: {
			type: DataTypes.STRING,
			allowNull: false,
			set(this: MeemProperties, val: any) {
				this.setDataValue(
					'totalCopies',
					services.web3.toBigNumber(val).toHexString()
				)
			}
		},
		totalCopiesLockedBy: {
			type: DataTypes.STRING,
			allowNull: false
		},
		copiesPerWallet: {
			type: DataTypes.STRING,
			allowNull: false,
			set(this: MeemProperties, val: any) {
				this.setDataValue(
					'copiesPerWallet',
					services.web3.toBigNumber(val).toHexString()
				)
			}
		},
		copiesPerWalletLockedBy: {
			type: DataTypes.STRING,
			allowNull: false
		},
		copyPermissions: {
			type: DataTypes.JSONB,
			allowNull: false
		},
		remixPermissions: {
			type: DataTypes.JSONB,
			allowNull: false
		},
		readPermissions: {
			type: DataTypes.JSONB,
			allowNull: false
		},
		copyPermissionsLockedBy: {
			type: DataTypes.STRING,
			allowNull: false
		},
		remixPermissionsLockedBy: {
			type: DataTypes.STRING,
			allowNull: false
		},
		readPermissionsLockedBy: {
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
			allowNull: true,
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
			allowNull: true,
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
		}
	}

	public id!: string

	public totalRemixes!: string

	public totalRemixesLockedBy!: string

	public remixesPerWallet!: string

	public remixesPerWalletLockedBy!: string

	public totalCopies!: string

	public totalCopiesLockedBy!: string

	public copiesPerWallet!: string

	public copiesPerWalletLockedBy!: string

	public copyPermissions!: MeemAPI.IMeemPermission[]

	public remixPermissions!: MeemAPI.IMeemPermission[]

	public readPermissions!: MeemAPI.IMeemPermission[]

	public copyPermissionsLockedBy!: string

	public remixPermissionsLockedBy!: string

	public readPermissionsLockedBy!: string

	public splits!: MeemAPI.IMeemSplit[]

	public splitsLockedBy!: string

	public isTransferrable!: boolean

	public isTransferrableLockedBy!: string

	public mintStartAt!: Date | null

	public mintEndAt!: Date | null

	public mintDatesLockedBy!: string

	public transferLockupUntil!: Date | null

	public transferLockupUntilLockedBy!: string

	public static associate(_models: IModels) {}
}
