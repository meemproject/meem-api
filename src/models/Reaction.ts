import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'
import type Meem from './Meem'
import type MeemIdentification from './MeemIdentification'

export default class Reaction extends BaseModel<Reaction> {
	public static readonly modelName = 'Reaction'

	public static get indexes() {
		return [
			{
				name: 'Reaction_MeemId',
				fields: ['MeemId']
			},
			{
				name: 'Reaction_MeemIdentificationId',
				fields: ['MeemIdentificationId']
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

	public MeemIdentificationId!: string | null

	public MeemIdentification!: MeemIdentification | null

	public static associate(models: IModels) {
		this.belongsTo(models.Meem)
		this.belongsTo(models.MeemIdentification)
	}
}
