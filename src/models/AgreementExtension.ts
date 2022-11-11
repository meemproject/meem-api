import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'
import Agreement from './Agreement'
export default class AgreementExtension extends BaseModel<AgreementExtension> {
	public static readonly modelName = 'AgreementExtension'

	public static readonly paranoid: boolean = false

	public static get indexes() {
		return [
			{
				name: 'AgreementExtension_createdAt',
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

	public metadata!: AgreementExtensionMetadata

	public AgreementId!: string

	public Agreement!: Agreement

	public ExtensionId!: string

	public Extension!: Agreement

	public static associate(models: IModels) {
		this.belongsTo(models.Extension)

		this.belongsTo(models.Agreement)
	}
}
