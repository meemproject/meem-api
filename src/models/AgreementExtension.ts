import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import { MeemAPI } from '../types/meem.public.generated'
import type { IModels } from '../types/models'

export default class AgreementExtension extends BaseModel<AgreementExtension> {
	public static readonly modelName = 'AgreementExtension'

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

	public metadata!: MeemAPI.IAgreementExtensionMetadata

	public static associate(models: IModels) {
		this.belongsTo(models.Extension)

		this.belongsTo(models.Agreement)
	}
}
