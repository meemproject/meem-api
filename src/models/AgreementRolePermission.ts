import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'

export default class AgreementRolePermission extends BaseModel<AgreementRolePermission> {
	public static readonly modelName = 'AgreementRolePermission'

	public static readonly paranoid: boolean = false

	public static get indexes() {
		return [
			{
				name: 'AgreementRolePermission_AgreementRoleId',
				fields: ['AgreementRoleId']
			},
			{
				name: 'AgreementRolePermission_RolePermissionId',
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

	public AgreementRoleId!: string

	public RolePermissionId!: string

	public static associate(models: IModels) {
		this.belongsTo(models.AgreementRole)
		this.belongsTo(models.RolePermission)
	}
}
