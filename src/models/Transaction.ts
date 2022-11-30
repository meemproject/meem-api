import type { TransactionInput } from 'ethers-multisend'
import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import { MeemAPI } from '../types/meem.generated'
import type { IModels } from '../types/models'

export default class Transaction extends BaseModel<Transaction> {
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
			type: DataTypes.STRING
		},
		chainId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		status: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: MeemAPI.TransactionStatus.Pending
		},
		transactionInput: {
			type: DataTypes.JSONB,
			allowNull: false
		},
		transactionType: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: MeemAPI.QueueEvent.CallContract
		},
		customABI: {
			type: DataTypes.JSONB
		}
	}

	public id!: string

	public hash!: string

	public chainId!: number

	public status!: MeemAPI.TransactionStatus

	public transactionInput!: TransactionInput

	public transactionType!: MeemAPI.QueueEvent

	public customABI!: Record<string, any>[]

	public static associate(models: IModels) {
		this.belongsTo(models.Wallet)
	}
}
