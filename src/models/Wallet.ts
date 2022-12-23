import { DateTime } from 'luxon'
import { Op, DataTypes } from 'sequelize'
import ModelWithAddress from '../core/ModelWithAddress'
import type { IModels } from '../types/models'
import AgreementRoleWallet from './AgreementRoleWallet'
import type AgreementWallet from './AgreementWallet'
import User from './User'

export default class Wallet extends ModelWithAddress<Wallet> {
	public static readonly modelName = 'Wallet'

	public static readonly paranoid: boolean = false

	public static get indexes() {
		return []
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
		nonce: {
			type: DataTypes.STRING
		},
		apiKey: {
			type: DataTypes.UUID
		},
		ens: {
			type: DataTypes.STRING
		},
		ensFetchedAt: {
			type: DataTypes.DATE
		},
		dailyTXLimit: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 5
		},
		pkpTokenId: {
			type: DataTypes.STRING
		}
	}

	public id!: string

	public address!: string

	public nonce!: string | null

	public apiKey!: string | null

	public ens!: string | null

	public ensFetchedAt!: Date | null

	public dailyTXLimit!: number

	public pkpTokenId!: string | null

	public AgreementWalletId!: string | null

	public AgreementWallets!: AgreementWallet[]

	public AgreementRoleWalletId!: string | null

	public AgreementRoleWallets!: AgreementRoleWallet[]

	public UserId!: string | null

	public User!: User

	public static associate(models: IModels) {
		this.hasMany(models.AgreementWallet)
		this.hasMany(models.AgreementRoleWallet)
		this.belongsTo(models.User)
		// this.hasOne(models.MeemIdentityWallet)
	}

	public static async findAllBy(options: {
		addresses?: string[]
		agreementId?: string
		agreementRoleId?: string
	}) {
		const { addresses, agreementId, agreementRoleId } = options

		const findAll: Record<string, any> = {}

		if (addresses) {
			findAll.where = orm.sequelize.where(
				orm.sequelize.fn('lower', orm.sequelize.col('address')),
				{ [Op.in]: addresses.map(w => w.toLowerCase()) }
			)
		}

		if (agreementId) {
			findAll.include = [
				{
					required: false,
					model: orm.models.AgreementWallet,
					where: {
						AgreementId: agreementId
					}
				}
			]
		}

		if (agreementRoleId) {
			findAll.include = [
				{
					required: false,
					model: orm.models.AgreementRoleWallet,
					where: {
						AgreementRoleId: agreementRoleId
					}
				}
			]
		}

		const result = await orm.models.Wallet.findAll(findAll)

		return result
	}

	public async enforceTXLimit() {
		// -1 is unlimited transactions
		if (this.dailyTXLimit === -1) {
			return
		}

		const numTransactions = await orm.models.Transaction.count({
			where: {
				WalletId: this.id,
				createdAt: {
					[Op.gte]: DateTime.now().minus({ hours: 24 }).toJSDate()
				}
			}
		})

		if (numTransactions + 1 > this.dailyTXLimit) {
			throw new Error('TX_LIMIT_EXCEEDED')
		}
	}
}
