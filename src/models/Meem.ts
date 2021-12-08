import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'

export default class Meem extends BaseModel<Meem> {
	public static readonly modelName = 'Meem'

	public static get indexes() {
		return []
	}

	public static readonly attributes = {
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		tokenId: {
			type: DataTypes.STRING,
			allowNull: false
		}
	}

	public id!: string

	public tokenId!: string

	public static associate(_models: IModels) {}
}
