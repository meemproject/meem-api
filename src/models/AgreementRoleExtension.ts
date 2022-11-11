import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import { MeemAPI } from '../types/meem.public.generated'
import type { IModels } from '../types/models'
import Agreement from './Agreement'
import AgreementRole from './AgreementRole'
import Extension from './Extension'

export default class AgreementRoleExtension extends BaseModel<AgreementRoleExtension> {
	public static readonly modelName = 'AgreementRoleExtension'

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
		isPublic: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: true
		},
		metadata: {
			type: DataTypes.JSONB,
			allowNull: false,
			defaultValue: {}
		}
	}

	public id!: string

	public isEnabled!: boolean

	public isPublic!: boolean

	public metadata!: MeemAPI.IAgreementRoleExtensionMetadata

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
