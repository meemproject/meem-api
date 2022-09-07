import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'

export default class MeemContractGuild extends BaseModel<MeemContractGuild> {
	public static readonly modelName = 'MeemContractGuild'

	public static get indexes() {
		return [
			{
				name: 'MeemContractGuild_MeemContractId',
				fields: ['MeemContractId']
			}
		]
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

	public guildId!: number

	public MeemContractId!: string

	public static associate(models: IModels) {
		this.belongsTo(models.MeemContract)
	}
}
