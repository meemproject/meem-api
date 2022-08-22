import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'

export default class IdentityIntegration extends BaseModel<IdentityIntegration> {
	public static readonly modelName = 'IdentityIntegration'

	public static get indexes() {
		return [
			{
				name: 'IdentityIntegration_createdAt',
				fields: ['createdAt']
			},
			{
				name: 'IdentityIntegration_name',
				fields: ['name']
			}
		]
	}

	public static readonly attributes = {
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: ''
		},
		description: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: ''
		},
		icon: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: ''
		}
	}

	public id!: string

	public name!: string

	public description!: string

	public icon!: string

	public static associate(models: IModels) {
		this.belongsToMany(models.MeemIdentity, {
			through: models.MeemIdentityIntegration
		})
	}
}
