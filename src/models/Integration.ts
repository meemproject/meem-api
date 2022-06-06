import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'

export default class Integration extends BaseModel<Integration> {
	public static readonly modelName = 'Integration'

	public static get indexes() {
		return [
			{
				name: 'Integration_createdAt',
				fields: ['createdAt']
			},
			{
				name: 'Integration_name',
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
			allowNull: false
		}
	}

	public id!: string

	public name!: string

	public static associate(models: IModels) {}
}
