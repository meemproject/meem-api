import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import { MeemAPI } from '../types/meem.generated'
import type { IModels } from '../types/models'

export default class MeemProperties extends BaseModel<MeemProperties> {
	public static readonly modelName = 'MeemProperties'

	public static get indexes() {
		return []
	}

	public static readonly attributes = {
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		totalChildren: {
			type: DataTypes.STRING,
			allowNull: false,
			set(this: MeemProperties, val: any) {
				this.setDataValue(
					'totalChildren',
					services.web3.toBigNumber(val).toHexString()
				)
			}
		},
		totalChildrenLockedBy: {
			type: DataTypes.STRING,
			allowNull: false
		},
		childrenPerWallet: {
			type: DataTypes.STRING,
			allowNull: false,
			set(this: MeemProperties, val: any) {
				this.setDataValue(
					'childrenPerWallet',
					services.web3.toBigNumber(val).toHexString()
				)
			}
		},
		childrenPerWalletLockedBy: {
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
		}
	}

	public id!: string

	public totalChildren!: string

	public totalChildrenLockedBy!: string

	public childrenPerWallet!: string

	public childrenPerWalletLockedBy!: string

	public copyPermissions!: MeemAPI.IMeemPermission[]

	public remixPermissions!: MeemAPI.IMeemPermission[]

	public readPermissions!: MeemAPI.IMeemPermission[]

	public copyPermissionsLockedBy!: string

	public remixPermissionsLockedBy!: string

	public readPermissionsLockedBy!: string

	public splits!: MeemAPI.IMeemSplit[]

	public splitsLockedBy!: string

	public static associate(_models: IModels) {}
}
