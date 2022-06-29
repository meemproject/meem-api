import { DataTypes } from 'sequelize'
import { BaseModel } from '../../core/BaseModel'
import { MeemAPI } from '../../types/meem.generated'
import type { IModels } from '../../types/models'
import type MeemContract from '../MeemContract'

export default class ClubMeemContract extends BaseModel<ClubMeemContract> {
	public static readonly modelName = 'ClubMeemContract'

	public static get indexes() {
		return [
			{
				name: 'ClubMeemContract_createdAt',
				fields: ['createdAt']
			}
		]
	}

	public static readonly attributes = {
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		slug: {
			type: DataTypes.STRING,
			allowNull: false
		},
		metadata: {
			type: DataTypes.JSONB,
			allowNull: false,
			defaultValue: {}
		}
	}

	public id!: string

	public slug!: string

	public metadata!: MeemAPI.IMeemContractMetadata

	public MeemContractId!: string

	public MeemContract!: MeemContract | null

	public static associate(models: IModels) {
		this.belongsTo(models.MeemContract)
	}
}
