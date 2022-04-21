import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'

export default class Yelp extends BaseModel<Yelp> {
	public static readonly modelName = 'Yelp'

	public static get indexes() {
		return []
	}

	public static readonly attributes = {
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		yelpId: {
			type: DataTypes.STRING,
			allowNull: false
		}
	}

	public id!: string

	public yelpId!: string

	public ClubId!: string | null

	public static associate(models: IModels) {
		this.belongsTo(models.Club)
	}
}
