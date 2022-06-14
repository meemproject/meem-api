import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'
import MeemContract from './MeemContract'
import Wallet from './Wallet'

export default class MeemContractWallet extends BaseModel<MeemContractWallet> {
	public static readonly modelName = 'MeemContractWallet'

	public static get indexes() {
		return [
			{
				name: 'MeemContractWallet_createdAt',
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
		role: {
			type: DataTypes.STRING,
			allowNull: false
		}
	}

	public id!: string

	public role!: string

	public WalletId!: string

	public MeemContractId!: string

	public Wallet!: Wallet | null

	public MeemContract!: MeemContract | null

	public static associate(models: IModels) {
		this.belongsTo(models.Wallet)

		this.belongsTo(models.MeemContract)
	}
}
