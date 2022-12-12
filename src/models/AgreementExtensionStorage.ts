import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import { MeemAPI } from '../types/meem.generated'
import type { IModels } from '../types/models'
import { IMeemMetadataLike } from '../types/shared/meem.shared'
import type Agreement from './Agreement'
import type Extension from './Extension'

export default class AgreementExtensionStorage extends BaseModel<AgreementExtensionStorage> {
	public static readonly modelName = 'AgreementExtensionStorage'

	public static readonly paranoid: boolean = false

	public static get indexes() {
		return [
			{
				name: 'AgreementExtensionStorage_createdAt',
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
		type: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: MeemAPI.StorageType.Tableland
		},
		metadata: {
			type: DataTypes.JSONB,
			allowNull: false,
			defaultValue: {}
		}
	}

	public id!: string

	public type!: MeemAPI.StorageType

	public metadata!: IMeemMetadataLike

	public AgreementId!: string | null

	public Agreement!: Agreement

	public ExtensionId!: string | null

	public Extension!: Extension

	public static associate(models: IModels) {
		this.belongsTo(models.Extension)

		this.belongsTo(models.Agreement)
	}
}
