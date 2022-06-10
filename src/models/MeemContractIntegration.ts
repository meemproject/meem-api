import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import { MeemAPI } from '../types/meem.public.generated'
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
		},
		isPublic: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: true
		},
		metadata: {
			type: DataTypes.JSONB,
			allowNull: false,
			defaultValue: {}
		}
	}

	public id!: string

	public isEnabled!: boolean

	public isPublic!: boolean

	public metadata!: MeemAPI.IMeemContractIntegrationMetadata

	public static associate(models: IModels) {
		this.belongsTo(models.Integration)

		this.belongsTo(models.MeemContract)
	}
}
