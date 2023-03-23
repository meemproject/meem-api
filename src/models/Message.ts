import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import { MeemAPI } from '../types/meem.generated'
import type { IModels } from '../types/models'

export default class Message extends BaseModel<Message> {
	public static readonly modelName = 'Message'

	public static readonly paranoid: boolean = false

	public static readonly indexes = [
		{
			name: 'Message_agreementId',
			fields: ['agreementId']
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
		},
		agreementId: {
			type: DataTypes.UUID,
			allowNull: false
		}
	}

	public id!: string

	public agreementId!: string

	public messageId!: string

	public status!: MeemAPI.MessageStatus

	public inputType!: MeemAPI.RuleIo

	public static associate(_models: IModels) {}
}
