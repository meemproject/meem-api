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
			type: DataTypes.STRING,
			allowNull: false
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
		encodeTransactionInput: {
			type: DataTypes.JSONB,
			allowNull: false
		},
		transactionType: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: MeemAPI.TransactionType.MeemContract
		},
		customABI: {
			type: DataTypes.JSONB
		}
	}

	public id!: string

	public hash!: string

	public chainId!: number

	public status!: MeemAPI.TransactionStatus

	public encodeTransactionInput!: TransactionInput

	public transactionType!: MeemAPI.TransactionType

	public customABI!: Record<string, any>[]

	public static associate(models: IModels) {
		this.belongsTo(models.Wallet)
	}
}
