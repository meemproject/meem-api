import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'
import { IMeemMetadataLike } from '../types/shared/meem.shared'
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
			defaultValue: false
		},
		metadata: {
			type: DataTypes.JSONB,
			allowNull: true
		}
	}

	public id!: string

	public isEnabled!: boolean

	public metadata!: IMeemMetadataLike | null

	public AgreementExtensionId!: string

	public AgreementExtension!: Agreement

	public static associate(models: IModels) {
		this.belongsTo(models.AgreementExtension)
	}
}
