import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'
import Agreement from './Agreement'
import AgreementGuild from './AgreementGuild'
import RolePermission from './RolePermission'

export default class AgreementRole extends BaseModel<AgreementRole> {
	public static readonly modelName = 'AgreementRole'

	public static readonly paranoid = false

	public static get indexes() {
		return [
			{
				name: 'AgreementRole_AgreementId',
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
		name: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: ''
		},
		description: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: ''
		},
		tokenAddress: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: ''
		},
		imageUrl: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: ''
		},
		guildRoleId: {
			type: DataTypes.INTEGER,
			allowNull: true
		},
		isAdminRole: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			allowNull: false
		},
		isDefaultRole: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			allowNull: false
		},
		integrationsMetadata: {
			type: DataTypes.JSONB,
			allowNull: false,
			defaultValue: []
		}
	}

	public id!: string

	public name!: string

	public imageUrl!: string

	public description!: string

	public tokenAddress!: string | null

	public integrationsMetadata!: { [key: string]: any }[]

	public isAdminRole!: boolean

	public isDefaultRole!: boolean

	public guildRoleId!: number | null

	public RolePermissions!: RolePermission[] | null

	public AgreementId!: string | null

	public AgreementGuild!: AgreementGuild | null

	public AgreementGuildId!: string | null

	public RoleAgreementId!: string | null

	public RoleAgreement!: Agreement | null

	public static associate(models: IModels) {
		this.belongsTo(models.Agreement)
		this.belongsTo(models.AgreementGuild)
		this.belongsToMany(models.RolePermission, {
			through: models.AgreementRolePermission
		})
		this.belongsTo(models.Agreement, {
			as: 'RoleAgreement'
		})
	}
}
