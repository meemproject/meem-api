import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'
import Agreement from './Agreement'

export default class Twitter extends BaseModel<Twitter> {
	public static readonly modelName = 'Twitter'

	public static readonly paranoid: boolean = false

	public static readonly indexes = []

	public static readonly attributes = {
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		username: {
			type: DataTypes.STRING
		},
		encryptedAccessToken: {
			type: DataTypes.TEXT,
			allowNull: false
		},
		twitterId: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: ''
		}
	}

	public id!: string

	public username?: string | null

	public encryptedAccessToken!: string

	public twitterId!: string

	public Agreements?: Agreement[] | null

	public static associate(models: IModels) {
		this.belongsToMany(models.Agreement, {
			through: models.AgreementTwitter
		})
		this.hasMany(models.AgreementTwitter)
	}
}
