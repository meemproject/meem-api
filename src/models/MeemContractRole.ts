import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'

export default class MeemContractRole extends BaseModel<MeemContractRole> {
	public static readonly modelName = 'MeemContractRole'

	public static get indexes() {
		return [
			{
				name: 'MeemContractRole_MeemContractId',
				fields: ['MeemContractId']
			}
		]
	}

	public static readonly attributes = {
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: ''
		},
		guildRoleId: {
			type: DataTypes.INTEGER,
			allowNull: true
		},
		permissions: {
			type: DataTypes.JSONB,
			allowNull: false,
			defaultValue: {}
		}
	}

	public id!: string

	public name!: string

	public permissions!: { [key: string]: unknown }

	public guildRoleId!: number | null

	public MeemContractGuildId!: string | null

	public static associate(models: IModels) {
		this.belongsTo(models.MeemContract)
		this.belongsTo(models.MeemContractGuild)
	}
}
