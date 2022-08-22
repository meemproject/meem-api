import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'
import type Meem from './Meem'

export default class Reaction extends BaseModel<Reaction> {
	public static readonly modelName = 'Reaction'

	public static get indexes() {
		return [
			{
				name: 'Reaction_MeemId',
				fields: ['MeemId']
			},
			{
				name: 'Reaction_reaction',
				fields: ['reaction']
			},
			{
				name: 'Reaction_address',
				fields: ['address']
			},
			{
				name: 'Reaction_reactedAt',
				fields: ['reactedAt']
			}
		]
	}

	public static readonly attributes = {
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		reaction: {
			type: DataTypes.STRING,
			allowNull: false
		},
		address: {
			type: DataTypes.STRING,
			allowNull: false
		},
		reactedAt: {
			type: DataTypes.DATE,
			allowNull: false
		}
	}

	public id!: string

	public reaction!: string

	public address!: string

	public reactedAt!: Date

	public MeemId!: string | null

	public Meem!: Meem | null

	public static associate(models: IModels) {
		this.belongsTo(models.Meem)
	}
}
