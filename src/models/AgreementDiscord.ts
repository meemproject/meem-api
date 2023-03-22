import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'
import Agreement from './Agreement'
import Discord from './Discord'

export default class AgreementDiscord extends BaseModel<AgreementDiscord> {
	public static readonly modelName = 'AgreementDiscord'

	public static readonly paranoid: boolean = false

	public static readonly indexes = [
		{
			name: 'AgreementDiscord_agreementId',
			fields: ['agreementId']
		}
	]

	public static readonly attributes = {
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		code: {
			type: DataTypes.UUID
		}
	}

	public id!: string

	public code!: string | null

	public DiscordId!: string | null

	public Discord?: Discord | null

	public AgreementId!: string | null

	public Agreement?: Agreement | null

	public static associate(models: IModels) {
		this.belongsTo(models.Agreement)
		this.belongsTo(models.Discord)
	}
}
