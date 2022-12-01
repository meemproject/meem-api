import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'
import { IMeemMetadataLike } from '../types/shared/meem.shared'
import Agreement from './Agreement'
export default class AgreementExtensionRole extends BaseModel<AgreementExtensionRole> {
	public static readonly modelName = 'AgreementExtensionRole'

	public static readonly paranoid: boolean = false

	public static get indexes() {
		return [
			{
				name: 'AgreementExtensionRole_createdAt',
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
		metadata: {
			type: DataTypes.JSONB,
			allowNull: true
		}
	}

	public id!: string

	public metadata!: IMeemMetadataLike | null

	public AgreementExtensionId!: string

	public AgreementExtension!: Agreement

	public AgreementRoleId!: string

	public AgreementRole!: Agreement

	public static associate(models: IModels) {
		this.belongsTo(models.AgreementExtension)
		this.belongsTo(models.AgreementRole)
	}
}
