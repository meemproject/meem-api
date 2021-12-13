import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'
import type MeemIdentification from './MeemIdentification'

export default class Wallet extends BaseModel<Wallet> {
	public static readonly modelName = 'Wallet'

	public static get indexes() {
		return []
	}

	public static readonly attributes = {
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		address: {
			type: DataTypes.STRING,
			allowNull: false
		},
		nonce: {
			type: DataTypes.STRING
		}
	}

	public id!: string

	public address!: string

	public nonce!: string | null

	public MeemIdentification!: MeemIdentification | null

	public MeemIdentificationId!: string | null

	public static associate(models: IModels) {
		this.belongsTo(models.MeemIdentification)
	}
}
