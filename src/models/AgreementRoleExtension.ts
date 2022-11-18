import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'
import Agreement from './Agreement'
import AgreementRole from './AgreementRole'
import Extension from './Extension'

// TODO: Move to @meemproject/metadata
export interface AgreementRoleExtensionMetadata {}

export default class AgreementRoleExtension extends BaseModel<AgreementRoleExtension> {
	public static readonly modelName = 'AgreementRoleExtension'

	public static readonly paranoid: boolean = false

	public static get indexes() {
		return [
			{
				name: 'AgreementRoleExtension_createdAt',
				fields: ['createdAt']
			}
		]
	}

	public static readonly attributes = {
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		isEnabled: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
		},
		metadata: {
			type: DataTypes.JSONB,
			allowNull: false,
			defaultValue: {}
		}
	}

	public id!: string

	public isEnabled!: boolean

	public metadata!: AgreementRoleExtensionMetadata

	public AgreementId!: string

	public Agreement!: Agreement

	public ExtensionId!: string

	public Extension!: Extension

	public AgreementRoleId!: string

	public AgreementRole!: AgreementRole

	public static associate(models: IModels) {
		this.belongsTo(models.Extension)

		this.belongsTo(models.Agreement)

		this.belongsTo(models.AgreementExtension)

		this.belongsTo(models.AgreementRole)
	}
}
