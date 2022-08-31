import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
// import type { IModels } from '../types/models'

export default class Discord extends BaseModel<Discord> {
	public static readonly modelName = 'Discord'

	public static get indexes() {
		return []
	}

	public static readonly attributes = {
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		discordId: {
			type: DataTypes.STRING,
			allowNull: false
		},
		username: {
			type: DataTypes.STRING,
			allowNull: false
		},
		avatar: {
			type: DataTypes.STRING,
			allowNull: true
		}
	}

	public id!: string

	public discordId!: string

	public username!: string

	public avatar!: string | null

	public static associate() {}
}
