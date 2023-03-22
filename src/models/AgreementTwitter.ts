import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'
import Agreement from './Agreement'
import Twitter from './Twitter'

export default class AgreementTwitter extends BaseModel<AgreementTwitter> {
	public static readonly modelName = 'AgreementTwitter'

	public static readonly paranoid: boolean = false

	public static readonly indexes = [
		{
			name: 'AgreementTwitter_agreementId',
			fields: ['agreementId']
		}
	]

	public static readonly attributes = {
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		}
	}

	public id!: string

	public agreementId!: string

	public TwitterId!: string | null

	public Twitter?: Twitter | null

	public AgreementId!: string | null

	public Agreement?: Agreement | null

	public static associate(models: IModels) {
		this.belongsTo(models.Twitter)
		this.belongsTo(models.Agreement)
	}
}
