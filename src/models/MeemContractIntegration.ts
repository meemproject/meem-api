import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'

export default class MeemContractIntegration extends BaseModel<MeemContractIntegration> {
	public static readonly modelName = 'MeemContractIntegration'

	public static get indexes() {
		return [
			{
				name: 'MeemContractIntegration_createdAt',
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
		isEnabled: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
		}
	}

	public id!: string

	public isEnabled!: boolean

	public static associate(models: IModels) {
		this.belongsTo(models.Integration)

		this.belongsTo(models.MeemContract)
	}
}
