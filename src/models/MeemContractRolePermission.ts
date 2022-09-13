import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'

export default class MeemContractRolePermission extends BaseModel<MeemContractRolePermission> {
	public static readonly modelName = 'MeemContractRolePermission'

	public static readonly paranoid: boolean = false

	public static get indexes() {
		return [
			{
				name: 'MeemContractRolePermission_MeemContractRoleId',
				fields: ['MeemContractRoleId']
			},
			{
				name: 'MeemContractRolePermission_RolePermissionId',
				fields: ['RolePermissionId']
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

	public MeemContractRoleId!: string

	public RolePermissionId!: string

	public static associate(models: IModels) {
		this.belongsTo(models.MeemContractRole)
		this.belongsTo(models.RolePermission)
	}
}
