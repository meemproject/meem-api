import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'

export default class MeemContractRolePermission extends BaseModel<MeemContractRolePermission> {
	public static readonly modelName = 'MeemContractRolePermission'

	public static get indexes() {
		return [
			{
				name: 'MeemContractRolePermission_MeemContractId',
				fields: ['MeemContractId']
			}
		]
	}

	public static readonly attributes = {
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		}
	}

	public id!: string

	public guildRoleId!: number | null

	public MeemContractGuildId!: string | null

	public RolePermissionId!: string

	public MeemContractId!: string

	public static associate(models: IModels) {
		this.belongsTo(models.MeemContract)
		this.belongsTo(models.MeemContractGuild)
	}
}
