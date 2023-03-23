import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'
import Agreement from './Agreement'
import AgreementDiscord from './AgreementDiscord'

export default class Discord extends BaseModel<Discord> {
	public static readonly modelName = 'Discord'

	public static readonly paranoid: boolean = false

	public static readonly indexes = [
		{
			name: 'Discord_guildId',
			fields: ['guildId']
		}
	]

	public static readonly attributes = {
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		guildId: {
			type: DataTypes.STRING
		},
		name: {
			type: DataTypes.STRING
		},
		icon: {
			type: DataTypes.STRING
		}
	}

	public id!: string

	public guildId?: string | null

	public name?: string | null

	public icon?: string | null

	public AgreementDiscords?: AgreementDiscord[]

	public Agreements?: Agreement[] | null

	public static associate(models: IModels) {
		this.belongsToMany(models.Agreement, {
			through: models.AgreementDiscord
		})
		this.hasMany(models.AgreementDiscord)
	}
}
