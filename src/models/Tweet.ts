import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'

export default class Tweet extends BaseModel<Tweet> {
	public static readonly modelName = 'Tweet'

	public static get indexes() {
		return [
			{
				name: 'tweets_tweetId',
				fields: ['tweetId']
			}
		]
	}

	public static readonly attributes = {
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		tweetId: {
			type: DataTypes.STRING,
			allowNull: false
		},
		text: {
			type: DataTypes.STRING,
			allowNull: false
		},
		username: {
			type: DataTypes.STRING,
			allowNull: false
		}
	}

	public id!: string

	public tweetId!: string

	public text!: string

	/** The twitter username */
	public username!: string

	public static associate(models: IModels) {
		this.belongsTo(models.Meem)
	}
}
