import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'
import Wallet from './Wallet'

export default class User extends BaseModel<User> {
	public static readonly modelName = 'User'

	public static get indexes() {
		return [
			{
				name: 'User_createdAt',
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
		displayName: {
			type: DataTypes.STRING,
			allowNull: true
		},
		profilePicUrl: {
			type: DataTypes.STRING,
			allowNull: true
		}
	}

	public id!: string

	public displayName!: string | null

	public profilePicUrl!: string | null

	public DefaultWalletId!: string

	public DefaultWallet!: Wallet

	public Wallets!: Wallet[]

	public static associate(models: IModels) {
		this.hasMany(models.Wallet)

		this.belongsTo(models.Wallet, {
			as: 'DefaultWallet'
		})

		this.hasMany(models.UserIdentity)
	}
}
