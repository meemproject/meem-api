import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'
import type Agreement from './Agreement'
import type Wallet from './Wallet'

export default class AgreementWallet extends BaseModel<AgreementWallet> {
	public static readonly modelName = 'AgreementWallet'

	public static readonly paranoid = false

	public static get indexes() {
		return [
			{
				name: 'AgreementWallet_createdAt',
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
		role: {
			type: DataTypes.STRING,
			allowNull: false
		}
	}

	public id!: string

	public role!: string

	public WalletId!: string

	public AgreementId!: string

	public Wallet!: Wallet | null

	public Agreement!: Agreement | null

	public static associate(models: IModels) {
		this.belongsTo(models.Wallet)

		this.belongsTo(models.Agreement)
	}
}
