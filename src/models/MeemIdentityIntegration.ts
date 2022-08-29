import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'

export default class MeemIdentityIntegration extends BaseModel<MeemIdentityIntegration> {
	public static readonly modelName = 'MeemIdentityIntegration'

	public static get indexes() {
		return [
			{
				name: 'MeemIdentityIntegration_createdAt',
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
		visibility: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: 'mutual-club-members'
		},
		metadata: {
			type: DataTypes.JSONB,
			allowNull: false,
			defaultValue: {}
		}
	}

	public id!: string

	public visibility!: string

	public metadata!: { [key: string]: unknown }

	public static associate(models: IModels) {
		this.belongsTo(models.IdentityIntegration)

		this.belongsTo(models.MeemIdentity)
	}
}
