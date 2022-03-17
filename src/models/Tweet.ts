import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'
import Meem from './Meem'

export default class Tweet extends BaseModel<Tweet> {
	public static readonly modelName = 'Tweet'

	public static get indexes() {
		return [
			{
				name: 'Tweet_tweetId',
				fields: ['tweetId']
			},
			{
				name: 'Tweet_MeemId',
				fields: ['MeemId']
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
		userId: {
			type: DataTypes.STRING,
			allowNull: false
		},
		username: {
			type: DataTypes.STRING,
			allowNull: false
		},
		userProfileImageUrl: {
			type: DataTypes.STRING,
			allowNull: false
		}
	}

	public id!: string

	public tweetId!: string

	public text!: string

	/** The twitter user ID of author */
	public userId!: string

	/** The twitter username */
	public username!: string

	/** URL for the twitter user's profile picture */
	public userProfileImageUrl!: string

	public MeemId!: string | null

	public Meem!: Meem | null

	public static associate(models: IModels) {
		this.belongsTo(models.Meem)
		this.belongsToMany(models.Hashtag, {
			through: models.TweetHashtag
		})
	}
}
