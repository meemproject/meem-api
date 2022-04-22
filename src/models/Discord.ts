import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'
import type MeemIdentification from './MeemIdentification'

export default class Discord extends BaseModel<Discord> {
	public static readonly modelName = 'Discord'

	public static get indexes() {
		return []
	}

	public static readonly attributes = {
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		discordId: {
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

	public discordId!: string

	public isDefault!: boolean

	public MeemIdentification!: MeemIdentification | null

	public MeemIdentificationId!: string | null

	public ClubId!: string | null

	public static associate(models: IModels) {
		this.belongsTo(models.MeemIdentification)
		this.belongsTo(models.Club)
	}
}
