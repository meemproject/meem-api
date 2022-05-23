import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'

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

	public static associate(models: IModels) {
		this.belongsTo(models.Wallet)

		this.belongsTo(models.MeemContract)
	}
}
