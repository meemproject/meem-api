import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import { MeemAPI } from '../types/meem.generated'
import type { IModels } from '../types/models'
import type Agreement from './Agreement'

export default class Extension extends BaseModel<Extension> {
	public static readonly modelName = 'Extension'

	public static get indexes() {
		return [
			{
				name: 'Extension_createdAt',
				fields: ['createdAt']
			},
			{
				name: 'Extension_name',
				fields: ['name']
			},
			{
				name: 'Extension_category',
				fields: ['category']
			},
			{
				name: 'Extension_capabilities',
				fields: ['capabilities']
			}
		]
	}

	public static readonly attributes = {
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: ''
		},
		description: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: ''
		},
		icon: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: ''
		},
		guideUrl: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: ''
		},
		category: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: 'none'
		},
		capabilities: {
			type: DataTypes.JSONB,
			allowNull: false,
			defaultValue: []
		},
		isSetupRequired: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: true
		},
		slug: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: ''
		},
		storageDefinition: {
			type: DataTypes.JSONB,
			allowNull: false,
			defaultValue: {}
		},
		widgetDefinition: {
			type: DataTypes.JSONB,
			allowNull: false,
			defaultValue: {}
		}
	}

	public id!: string

	public name!: string

	public slug!: string

	public description!: string

	public icon!: string

	public guideUrl!: string

	public category!: string

	public capabilities!: MeemAPI.ExtensionCapability[]

	public isSetupRequired!: boolean

	public storageDefinition!: MeemAPI.IExtensionStorageDefinition

	public widgetDefinition!: MeemAPI.IExtensionWidgetDefinition

	public Agreements!: Agreement[]

	public static associate(models: IModels) {
		this.belongsToMany(models.Agreement, {
			through: models.AgreementExtension
		})
	}
}
