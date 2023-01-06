import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import { MeemAPI } from '../types/meem.generated'
import type { IModels } from '../types/models'
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

	public metadata!: MeemAPI.IMeemMetadataLike | null

	public visibility!: MeemAPI.AgreementExtensionVisibility

	public AgreementExtensionId!: string

	public AgreementExtension!: Agreement

	public static associate(models: IModels) {
		this.belongsTo(models.AgreementExtension)
	}
}
