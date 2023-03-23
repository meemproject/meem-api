import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'
import Agreement from './Agreement'
import AgreementSlack from './AgreementSlack'

export default class Slack extends BaseModel<Slack> {
	public static readonly modelName = 'Slack'

	public static readonly paranoid: boolean = false

	public static readonly indexes = [
		{
			name: 'Slack_teamId',
			fields: ['teamId']
		}
	]

	public static readonly attributes = {
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		teamId: {
			type: DataTypes.STRING
		},
		name: {
			type: DataTypes.STRING
		},
		encryptedAccessToken: {
			type: DataTypes.TEXT,
			allowNull: false
		},
		icon: {
			type: DataTypes.STRING
		}
	}

	public id!: string

	public teamId?: string | null

	public name?: string | null

	public encryptedAccessToken!: string

	public icon?: string | null

	public AgreementSlacks?: AgreementSlack[] | null

	public Agreements?: Agreement[] | null

	public static associate(models: IModels) {
		this.belongsToMany(models.Agreement, {
			through: models.AgreementSlack
		})
		this.hasMany(models.AgreementSlack)
	}
}
