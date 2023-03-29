import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import { MeemAPI } from '../types/meem.generated'
import type { IModels } from '../types/models'
import Agreement from './Agreement'

export default class Rule extends BaseModel<Rule> {
	public static readonly modelName = 'Rule'

	public static readonly paranoid: boolean = false

	public static readonly indexes = [
		{
			name: 'Rule_AgreementId',
			fields: ['AgreementId']
		}
	]

	public static readonly attributes = {
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		version: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: '1'
		},
		definition: {
			type: DataTypes.JSONB,
			allowNull: false,
			defaultValue: {}
		},
		input: {
			type: DataTypes.STRING
		},
		output: {
			type: DataTypes.STRING
		},
		inputRef: {
			type: DataTypes.UUID
		},
		outputRef: {
			type: DataTypes.UUID
		},
		description: {
			type: DataTypes.TEXT
		},
		abridgedDescription: {
			type: DataTypes.TEXT
		},
		webhookUrl: {
			type: DataTypes.TEXT
		},
		webhookSecret: {
			type: DataTypes.STRING
		}
	}

	public id!: string

	public version!: string

	public definition!: MeemAPI.IRule

	public input?: MeemAPI.RuleIo | null

	public output?: MeemAPI.RuleIo | null

	public inputRef?: string | null

	public outputRef?: string | null

	public description?: string | null

	public abridgedDescription?: string | null

	public webhookUrl?: string | null

	public webhookSecret?: string | null

	public AgreementId!: string | null

	public Agreement?: Agreement

	public static associate(models: IModels) {
		this.belongsTo(models.Agreement)
	}
}
