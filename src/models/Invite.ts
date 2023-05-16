import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'
import type Agreement from './Agreement'

export default class Invite extends BaseModel<Invite> {
	public static readonly modelName = 'Invite'

	public static get indexes() {
		return [
			{
				name: 'Invite_AgreementId',
				fields: ['AgreementId']
			},
			{
				name: 'Invite_code',
				fields: ['code']
			}
		]
	}

	public static readonly attributes = {
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		code: {
			type: DataTypes.STRING,
			allowNull: false
		}
	}

	public id!: string

	public code!: string

	public AgreementId!: string | null

	public Agreement?: Agreement | null

	public static associate(models: IModels) {
		this.belongsTo(models.Agreement)
	}
}
