import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'
import AgreementRole from './AgreementRole'

export default class AgreementGuild extends BaseModel<AgreementGuild> {
	public static readonly modelName = 'AgreementGuild'

	public static readonly paranoid = false

	public static get indexes() {
		return [
			{
				name: 'AgreementGuild_AgreementId',
				fields: ['AgreementId']
			}
		]
	}

	public static readonly attributes = {
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		guildId: {
			type: DataTypes.INTEGER,
			allowNull: false
		}
	}

	public id!: string

	public guildId!: number

	public AgreementId!: string

	public AgreementRoles!: AgreementRole[] | null

	public static associate(models: IModels) {
		this.belongsTo(models.Agreement)
		this.hasMany(models.AgreementRole)
	}
}
