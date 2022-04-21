import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'
import type MeemIdentification from './MeemIdentification'

export default class Instagram extends BaseModel<Instagram> {
	public static readonly modelName = 'Instagram'

	public static get indexes() {
		return []
	}

	public static readonly attributes = {
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		instagramId: {
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

	public instagramId!: string

	public isDefault!: boolean

	public MeemIdentification!: MeemIdentification | null

	public MeemIdentificationId!: string | null

	public ClubId!: string | null

	public static associate(models: IModels) {
		this.belongsTo(models.MeemIdentification)
		this.belongsTo(models.Club)
	}
}
