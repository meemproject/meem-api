import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'
import MeemIdentity from './MeemIdentity'
import type Wallet from './Wallet'

export default class MeemIdentityWallet extends BaseModel<MeemIdentityWallet> {
	public static readonly modelName = 'MeemIdentityWallet'

	public static get indexes() {
		return [
			{
				name: 'MeemIdentityWallet_createdAt',
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
		isDefault: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			allowNull: false
		}
	}

	public id!: string

	public isDefault!: boolean

	public WalletId!: string

	public MeemIdentityId!: string

	public Wallet!: Wallet | null

	public MeemIdentity!: MeemIdentity | null

	public static associate(models: IModels) {
		this.belongsTo(models.Wallet)

		this.belongsTo(models.MeemIdentity)
	}
}
