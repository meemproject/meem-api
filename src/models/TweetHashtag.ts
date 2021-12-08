import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'

export default class TweetHashtag extends BaseModel<TweetHashtag> {
	public static readonly modelName = 'TweetHashtag'

	public static get indexes() {
		return []
	}

	public static readonly attributes = {
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		}
	}

	public id!: string

	public TweetId!: string | null

	public HashtagId!: string | null

	public static associate(models: IModels) {
		this.belongsTo(models.Tweet)
		this.belongsTo(models.Hashtag)
	}
}
