import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'
import type MeemContract from './MeemContract'
import Twitter from './Twitter'

export default class MeemContractTwitter extends BaseModel<MeemContractTwitter> {
	public static readonly modelName = 'MeemContractTwitter'

	public static get indexes() {
		return [
			{
				name: 'MeemContractTwitter_createdAt',
				fields: ['createdAt']
			}
		]
	}

	public static readonly attributes = {
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		}
	}

	public id!: string

	public TwitterId!: string

	public MeemContractId!: string

	public Twitter!: Twitter | null

	public MeemContract!: MeemContract | null

	public static associate(models: IModels) {
		this.belongsTo(models.Twitter)

		this.belongsTo(models.MeemContract)
	}
}
