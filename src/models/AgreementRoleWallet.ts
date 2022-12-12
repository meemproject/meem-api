import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'
import AgreementRole from './AgreementRole'
import type Wallet from './Wallet'

export default class AgreementRoleWallet extends BaseModel<AgreementRoleWallet> {
	public static readonly modelName = 'AgreementRoleWallet'

	public static readonly paranoid = false

	public static get indexes() {
		return [
			{
				name: 'AgreementRoleWallet_createdAt',
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

	public AgreementRoleId!: string

	public Wallet!: Wallet | null

	public AgreementRole!: AgreementRole | null

	public static associate(models: IModels) {
		this.belongsTo(models.Wallet)

		this.belongsTo(models.AgreementRole)
	}
}
