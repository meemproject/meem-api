import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'
import Token from './Token'

export default class Tweet extends BaseModel<Tweet> {
	public static readonly modelName = 'Tweet'

	public static get indexes() {
		return [
			{
				name: 'Tweet_tweetId',
				fields: ['tweetId']
			},
			{
				name: 'Tweet_TokenId',
				fields: ['TokenId']
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
		},
		conversationId: {
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

	/** The twitter conversation ID of the tweet */
	public conversationId!: string

	public TokenId!: string | null

	public Token!: Token | null

	public static associate(models: IModels) {
		this.belongsTo(models.Token)
		this.belongsToMany(models.Hashtag, {
			through: models.TweetHashtag
		})
	}
}
