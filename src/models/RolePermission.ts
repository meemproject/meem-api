import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'

export default class RolePermission extends BaseModel<RolePermission> {
	public static readonly modelName = 'RolePermission'

	public static get indexes() {
		return []
	}

	public static readonly attributes = {
		id: {
			type: DataTypes.STRING,
			allowNull: false,
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
		}
	}

	public id!: string

	public name!: string

	public description!: string

	public static associate() {}
}
