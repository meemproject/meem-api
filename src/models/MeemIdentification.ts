import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'
import type Twitter from './Twitter'
import type Wallet from './Wallet'

export default class MeemIdentification extends BaseModel<MeemIdentification> {
	public static readonly modelName = 'MeemIdentification'

	public static get indexes() {
		return []
	}

	public static readonly attributes = {
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		}
	}

	public id!: string

	public Twitter!: Twitter[] | null

	public Wallet!: Wallet[] | null

	public static associate(models: IModels) {
		this.hasMany(models.Twitter)
		this.hasMany(models.Wallet)
	}
}
