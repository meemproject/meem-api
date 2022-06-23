import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'

export default class Contract extends BaseModel<Contract> {
	public static readonly modelName = 'Contract'

	public static get indexes() {
		return [
			{
				name: 'Contract_contractType',
				fields: ['contractType']
			}
		]
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
		},
		version: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 1
		},
		contractType: {
			type: DataTypes.STRING,
			allowNull: false
		},
		functionSelectors: {
			type: DataTypes.JSONB,
			allowNull: false,
			defaultValue: []
		},
		abi: {
			type: DataTypes.JSONB,
			allowNull: false,
			defaultValue: []
		},
		bytecode: {
			type: DataTypes.TEXT,
			allowNull: false
		}
	}

	public id!: string

	public name!: string

	public description!: string

	public version!: number

	public contractType!: string

	public functionSelectors!: string[]

	public abi!: any[]

	public bytecode!: string

	public CreatorId!: string | null

	public Creator!: string | null

	public static associate(models: IModels) {
		this.belongsTo(models.Wallet, {
			as: 'Creator'
		})
	}
}
