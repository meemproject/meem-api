import { DataTypes } from 'sequelize'
import ModelWithAddress from '../core/ModelWithAddress'
import type { IModels } from '../types/models'
import Contract from './Contract'

export default class ContractInstance extends ModelWithAddress<ContractInstance> {
	public static readonly modelName = 'ContractInstance'

	public static get indexes() {
		return [
			{
				name: 'ContractInstance_address',
				fields: ['address']
			}
		]
	}

	public static readonly attributes = {
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		address: {
			type: DataTypes.STRING,
			allowNull: false
		},
		chainId: {
			type: DataTypes.INTEGER,
			allowNull: false
		}
	}

	public id!: string

	public address!: string

	public chainId!: number

	public ContractId!: string | null

	public Contract!: Contract | null

	public static associate(models: IModels) {
		this.belongsTo(models.Contract)
	}
}
