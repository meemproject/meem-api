import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import { MeemAPI } from '../types/meem.generated'
import type { IModels } from '../types/models'
import Agreement from './Agreement'
export default class AgreementExtensionLink extends BaseModel<AgreementExtensionLink> {
	public static readonly modelName = 'AgreementExtensionLink'

	public static readonly paranoid: boolean = false

	public static get indexes() {
		return [
			{
				name: 'AgreementExtensionLink_createdAt',
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
		url: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: ''
		},
		label: {
			type: DataTypes.STRING,
			allowNull: true
		},
		metadata: {
			type: DataTypes.JSONB
		},
		visibility: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: 'token-holders'
		}
	}

	public id!: string

	public isEnabled!: boolean

	public url!: string

	public label!: string | null

	public metadata!: { [key: string]: any } | null

	public visibility!: MeemAPI.AgreementExtensionVisibility

	public AgreementExtensionId!: string

	public AgreementExtension!: Agreement

	public static associate(models: IModels) {
		this.belongsTo(models.AgreementExtension)
	}
}
