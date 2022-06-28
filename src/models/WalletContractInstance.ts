import { DataTypes } from 'sequelize'
import ModelWithAddress from '../core/ModelWithAddress'
import type { IModels } from '../types/models'
import ContractInstance from './ContractInstance'
import Wallet from './Wallet'

export default class WalletContractInstance extends ModelWithAddress<WalletContractInstance> {
	public static readonly modelName = 'WalletContractInstance'

	public static get indexes() {
		return [
			{
				name: 'WalletContractInstance_ContractInstanceId',
				fields: ['ContractInstanceId']
			},
			{
				name: 'WalletContractInstance_WalletId',
				fields: ['WalletId']
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
			type: DataTypes.STRING
		},
		note: {
			type: DataTypes.TEXT
		}
	}

	public id!: string

	public name!: string | null

	public note!: string | null

	public ContractInstanceId!: string | null

	public ContractInstance!: ContractInstance | null

	public WalletId!: string | null

	public Wallet!: Wallet | null

	public static associate(models: IModels) {
		this.belongsTo(models.ContractInstance)
		this.belongsTo(models.Wallet)
	}
}
