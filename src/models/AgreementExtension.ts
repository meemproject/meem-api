import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'
import { IMeemMetadataLike } from '../types/shared/meem.shared'
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
		metadata: {
			type: DataTypes.JSONB,
			allowNull: true
		}
	}

	public id!: string

	public metadata!: IMeemMetadataLike | null

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
