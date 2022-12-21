import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import { MeemAPI } from '../types/meem.generated'
import type { IModels } from '../types/models'
import Agreement from './Agreement'
import AgreementExtensionLink from './AgreementExtensionLink'
import AgreementExtensionRole from './AgreementExtensionRole'
import AgreementExtensionWidget from './AgreementExtensionWidget'
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
		isInitialized: {
			type: DataTypes.BOOLEAN,
			defaultValue: false
		},
		metadata: {
			type: DataTypes.JSONB
		}
	}

	public id!: string

	// public metadata!: MeemAPI.IMeemMetadataLike | null
	public metadata!: MeemAPI.IAgreementExtensionMetadata | null

	public isInitialized!: boolean

	public AgreementId!: string

	public Agreement!: Agreement

	public ExtensionId!: string

	public Extension!: Agreement

	public AgreementExtensionLink!: AgreementExtensionLink | undefined

	public AgreementExtensionWidget!: AgreementExtensionWidget | undefined

	public AgreementExtensionRoles!: AgreementExtensionRole[] | undefined

	public static associate(models: IModels) {
		this.belongsTo(models.Extension)

		this.belongsTo(models.Agreement)

		this.hasOne(models.AgreementExtensionLink)

		this.hasOne(models.AgreementExtensionWidget)

		this.hasMany(models.AgreementExtensionRole)
	}
}
