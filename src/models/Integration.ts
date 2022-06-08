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
		},
		guideUrl: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: ''
		}
	}

	public id!: string

	public name!: string

	public description!: string

	public icon!: string

	public guideUrl!: string

	public static associate() {}
}
