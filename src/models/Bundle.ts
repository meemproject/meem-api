import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'
import type BundleContract from './BundleContract'
import type Contract from './Contract'

export default class Bundle extends BaseModel<Bundle> {
	public static readonly modelName = 'Bundle'

	public static get indexes() {
		return []
	}

	public static readonly attributes = {
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false
		},
		description: {
			type: DataTypes.TEXT,
			allowNull: false
		}
	}

	public id!: string

	public name!: string

	public description!: string

	public BundleContracts!: BundleContract[] | null

	public Contracts!: Contract[] | null

	public CreatorId!: string | null

	public Creator!: string | null

	public static associate(models: IModels) {
		this.hasMany(models.BundleContract)

		this.belongsToMany(models.Contract, {
			through: 'BundleContract'
		})

		this.belongsTo(models.Wallet, {
			as: 'Creator'
		})
	}
}
