import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'
import type MeemIdentification from './MeemIdentification'

export default class Twitter extends BaseModel<Twitter> {
	public static readonly modelName = 'Twitter'

	public static get indexes() {
		return []
	}

	public static readonly attributes = {
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		twitterId: {
			type: DataTypes.STRING,
			allowNull: false
		},
		isDefault: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
		}
	}

	public id!: string

	public twitterId!: string

	public isDefault!: boolean

	public MeemIdentification!: MeemIdentification | null

	public MeemIdentificationId!: string | null

	public static associate(models: IModels) {
		this.belongsTo(models.MeemIdentification)
	}
}
