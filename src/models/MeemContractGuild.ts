import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'

export default class MeemContractGuild extends BaseModel<MeemContractGuild> {
	public static readonly modelName = 'MeemContractGuild'

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

	public GuildId!: string

	public MeemContractId!: string

	public static associate(models: IModels) {
		this.belongsTo(models.Guild)

		this.belongsTo(models.MeemContract)
	}
}
