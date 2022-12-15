import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'

export default class IdentityProvider extends BaseModel<IdentityProvider> {
	public static readonly modelName = 'IdentityProvider'

	public static readonly paranoid = false

	public static get indexes() {
		return [
			{
				name: 'IdentityProvider_createdAt',
				fields: ['createdAt']
			},
			{
				name: 'IdentityProvider_name',
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
		connectionName: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: ''
		},
		connectionId: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: ''
		}
	}

	public id!: string

	public name!: string

	public description!: string

	public icon!: string

	public static associate(_models: IModels) {}
}
