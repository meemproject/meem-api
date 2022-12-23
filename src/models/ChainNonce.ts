import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'

export default class ChainNonce extends BaseModel<ChainNonce> {
	public static readonly modelName = 'ChainNonce'

	public static readonly paranoid: boolean = false

	public static get indexes() {
		return []
	}

	public static readonly attributes = {
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		nonce: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		chainId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			unique: true
		}
	}

	public id!: string

	public address!: string

	public nonce!: number

	public chainId!: number

	public static associate(_models: IModels) {}
}
