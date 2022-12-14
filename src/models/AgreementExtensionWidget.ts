import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'
import {
	IAgreementExtensionVisibility,
	IMeemMetadataLike
} from '../types/shared/meem.shared'
import Agreement from './Agreement'
export default class AgreementExtensionWidget extends BaseModel<AgreementExtensionWidget> {
	public static readonly modelName = 'AgreementExtensionWidget'

	public static readonly paranoid: boolean = false

	public static get indexes() {
		return [
			{
				name: 'AgreementExtensionWidget_createdAt',
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
			defaultValue: true
		},
		metadata: {
			type: DataTypes.JSONB,
			allowNull: true
		},
		visibility: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: 'token-holders'
		}
	}

	public id!: string

	public isEnabled!: boolean

	public metadata!: IMeemMetadataLike | null

	public visibility!: IAgreementExtensionVisibility

	public AgreementExtensionId!: string

	public AgreementExtension!: Agreement

	public static associate(models: IModels) {
		this.belongsTo(models.AgreementExtension)
	}
}
