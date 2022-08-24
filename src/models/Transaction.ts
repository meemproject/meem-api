import { DataTypes } from 'sequelize'
import ModelWithAddress from '../core/ModelWithAddress'
import type { IModels } from '../types/models'
import type Wallet from './Wallet'

export default class Transaction extends ModelWithAddress<Transaction> {
	public static readonly modelName = 'Transaction'

	public static readonly paranoid: boolean = false

	public static get indexes() {
		return [
			{
				name: 'Transaction_WalletId',
				fields: ['WalletId']
			},
			{
				name: 'Transaction_chainId',
				fields: ['chainId']
			}
		]
	}

	public static readonly attributes = {
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		hash: {
			type: DataTypes.STRING,
			allowNull: false
		},
		chainId: {
			type: DataTypes.INTEGER,
			allowNull: false
		}
	}

	public id!: string

	public hash!: string

	public WalletId!: string | null

	public Wallet!: Wallet | null

	public static associate(models: IModels) {
		this.belongsTo(models.Wallet)
	}
}
