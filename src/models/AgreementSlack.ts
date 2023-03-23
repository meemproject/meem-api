import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'
import Agreement from './Agreement'
import Slack from './Slack'

export default class AgreementSlack extends BaseModel<AgreementSlack> {
	public static readonly modelName = 'AgreementSlack'

	public static readonly paranoid: boolean = false

	public static readonly indexes = [
		{
			name: 'AgreementSlack_AgreementId',
			fields: ['AgreementId']
		}
	]

	public static readonly attributes = {
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		}
	}

	public id!: string

	public agreementId!: string

	public SlackId!: string | null

	public Slack?: Slack | null

	public AgreementId!: string | null

	public Agreement?: Agreement | null

	public static associate(models: IModels) {
		this.belongsTo(models.Slack)
		this.belongsTo(models.Agreement)
	}
}
