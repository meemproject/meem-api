import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'
import MeemContract from './MeemContract'

export default class Guild extends BaseModel<Guild> {
	public static readonly modelName = 'Guild'

	public static get indexes() {
		return []
	}

	public static readonly attributes = {
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		guildId: {
			type: DataTypes.INTEGER,
			allowNull: false
		}
	}

	public id!: string

	public guildId!: string

	public MeemContracts?: MeemContract[] | null

	public static associate(models: IModels) {
		this.belongsToMany(models.MeemContract, {
			through: models.MeemContractGuild
		})
	}
}
