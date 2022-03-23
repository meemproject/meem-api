import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'

export default class Prompt extends BaseModel<Prompt> {
	public static readonly modelName = 'Prompt'

	public static get indexes() {
		return [
			{
				name: 'Prompt_createdAt',
				fields: ['createdAt']
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
			type: DataTypes.STRING
		},
		body: {
			type: DataTypes.STRING,
			allowNull: false
		},
		startAt: {
			type: DataTypes.DATE,
			allowNull: false
		},
		hasStarted: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
		},
		hasEnded: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
		}
	}

	public id!: string

	public tweetId!: string

	public body!: string

	public startAt!: Date

	public hasStarted!: boolean

	public hasEnded!: boolean
}
