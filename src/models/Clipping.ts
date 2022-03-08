import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'
import Meem from './Meem'
import MeemIdentification from './MeemIdentification'

export default class Clipping extends BaseModel<Clipping> {
	public static readonly modelName = 'Clipping'

	public static get indexes() {
		return [
			{
				name: 'Clipping_MeemId',
				fields: ['MeemId']
			},
			{
				name: 'Clipping_MeemIdentificationId',
				fields: ['MeemIdentificationId']
			},
			{
				name: 'Clipping_address',
				fields: ['address']
			},
			{
				name: 'Clipping_clippedAt',
				fields: ['clippedAt']
			}
		]
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
		clippedAt: {
			type: DataTypes.DATE,
			allowNull: false
		}
	}

	public id!: string

	public address!: string

	public clippedAt!: Date

	public MeemId!: string | null

	public Meem!: Meem | null

	public MeemIdentificationId!: string | null

	public MeemIdentification!: MeemIdentification | null

	public static associate(models: IModels) {
		this.belongsTo(models.Meem)
		this.belongsTo(models.MeemIdentification)
	}
}
