import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'
import type MeemIdentification from './MeemIdentification'

export default class MeemPass extends BaseModel<MeemPass> {
	public static readonly modelName = 'MeemPass'

	public static get indexes() {
		return []
	}

	public static readonly attributes = {
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		tweetsPerDayQuota: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0
		}
	}

	public id!: string

	public tweetsPerDayQuota!: number

	public MeemIdentification!: MeemIdentification | null

	public MeemIdentificationId!: string | null

	public static associate(models: IModels) {
		this.belongsTo(models.MeemIdentification)
	}
}