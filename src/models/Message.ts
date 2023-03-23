import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import { MeemAPI } from '../types/meem.generated'
import type { IModels } from '../types/models'
import Agreement from './Agreement'

export default class Message extends BaseModel<Message> {
	public static readonly modelName = 'Message'

	public static readonly paranoid: boolean = false

	public static readonly indexes = [
		{
			name: 'Message_AgreementId',
			fields: ['AgreementId']
		},
		{
			name: 'Message_messageId',
			fields: ['messageId']
		}
	]

	public static readonly attributes = {
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		messageId: {
			type: DataTypes.STRING,
			allowNull: false
		},
		status: {
			type: DataTypes.STRING,
			allowNull: false
		},
		inputType: {
			type: DataTypes.STRING,
			allowNull: false
		}
	}

	public id!: string

	public messageId!: string

	public status!: MeemAPI.MessageStatus

	public inputType!: MeemAPI.RuleIo

	public AgreementId!: string | null

	public Agreement?: Agreement | null

	public static associate(models: IModels) {
		this.belongsTo(models.Agreement)
	}
}
