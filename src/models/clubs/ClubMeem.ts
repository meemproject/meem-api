import { DataTypes } from 'sequelize'
import { BaseModel } from '../../core/BaseModel'
import { MeemAPI } from '../../types/meem.generated'
import type { IModels } from '../../types/models'
import type Meem from '../Meem'
import type MeemContract from '../MeemContract'

export default class ClubMeem extends BaseModel<ClubMeem> {
	public static readonly modelName = 'ClubMeem'

	public static get indexes() {
		return [
			{
				name: 'ClubMeem_createdAt',
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
		metadata: {
			type: DataTypes.JSONB,
			allowNull: false,
			defaultValue: {}
		}
	}

	public id!: string

	public metadata!: MeemAPI.IMeemMetadata

	public MeemId!: string

	public Meem!: Meem | null

	public MeemContractId!: string

	public MeemContract!: MeemContract | null

	public static associate(models: IModels) {
		this.belongsTo(models.Meem)
		this.belongsTo(models.MeemContract)
	}
}
