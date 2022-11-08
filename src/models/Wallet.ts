import { DateTime } from 'luxon'
import { Op, DataTypes } from 'sequelize'
import ModelWithAddress from '../core/ModelWithAddress'
import type { IModels } from '../types/models'
import type MeemContractWallet from './MeemContractWallet'
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
		}
	}

	public id!: string

	public address!: string

	public nonce!: string | null

	public apiKey!: string | null

	public ens!: string | null

	public ensFetchedAt!: Date | null

	public dailyTXLimit!: number

	public MeemContractWalletId!: string | null

	public MeemContractWallets!: MeemContractWallet[]

	public UserId!: string | null

	public User!: User

	public static associate(models: IModels) {
		this.hasMany(models.MeemContractWallet)
		this.belongsTo(models.User)
		// this.hasOne(models.MeemIdentityWallet)
	}

	public static async findAllBy(options: {
		addresses?: string[]
		meemContractId?: string
	}) {
		const { addresses, meemContractId } = options

		const findAll: Record<string, any> = {}

		if (addresses) {
			findAll.where = orm.sequelize.where(
				orm.sequelize.fn('lower', orm.sequelize.col('address')),
				{ [Op.in]: addresses.map(w => w.toLowerCase()) }
			)
		}

		if (meemContractId) {
			findAll.include = [
				{
					required: false,
					model: orm.models.MeemContractWallet,
					where: {
						MeemContractId: meemContractId
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
