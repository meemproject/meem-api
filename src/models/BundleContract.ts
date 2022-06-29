import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'
import type Bundle from './Bundle'
import type Contract from './Contract'

export default class BundleContract extends BaseModel<BundleContract> {
	public static readonly modelName = 'BundleContract'

	public static readonly paranoid = false

	public static get indexes() {
		return [
			{
				name: 'BundleContract_BundleId',
				fields: ['BundleId']
			},
			{
				name: 'BundleContract_ContractId',
				fields: ['ContractId']
			}
		]
	}

	public static readonly attributes = {
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		order: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0
		}
	}

	public id!: string

	public order!: number

	public BundleId!: string | null

	public Bundle!: Bundle | null

	public ContractId!: string | null

	public Contract!: Contract | null

	public static associate(models: IModels) {
		this.belongsTo(models.Bundle)

		this.belongsTo(models.Contract)
	}
}
