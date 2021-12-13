import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'
import type MeemPass from './MeemPass'
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

	public Twitters!: Twitter[] | null

	public Wallets!: Wallet[] | null

	public MeemPass!: MeemPass | null

	public static associate(models: IModels) {
		this.hasMany(models.Twitter)
		this.hasMany(models.Wallet)
		this.hasOne(models.MeemPass)
	}
}
