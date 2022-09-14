import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'
import MeemContractGuild from './MeemContractGuild'
import RolePermission from './RolePermission'

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
		}
	}

	public id!: string

	public name!: string

	public guildRoleId!: number | null

	public RolePermissions!: RolePermission[] | null

	public MeemContractId!: string | null

	public MeemContractGuild!: MeemContractGuild | null

	public MeemContractGuildId!: string | null

	public static associate(models: IModels) {
		this.belongsTo(models.MeemContract)
		this.belongsTo(models.MeemContractGuild)
		this.belongsToMany(models.RolePermission, {
			through: models.MeemContractRolePermission
		})
	}
}
