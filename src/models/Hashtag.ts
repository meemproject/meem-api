import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'

export default class Hashtag extends BaseModel<Hashtag> {
	public static readonly modelName = 'Hashtag'

	public static get indexes() {
		return []
	}

	public static readonly attributes = {
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		tag: {
			type: DataTypes.STRING,
			allowNull: false
		}
	}

	public id!: string

	public tag!: string

	public static associate(models: IModels) {
		this.belongsToMany(models.Tweet, {
			through: models.TweetHashtag
		})
	}
}
