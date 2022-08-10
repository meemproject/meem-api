import { Op, DataTypes } from 'sequelize'
import ModelWithAddress from '../core/ModelWithAddress'
import type { IModels } from '../types/models'
import type MeemContractWallet from './MeemContractWallet'

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
		}
	}

	public id!: string

	public address!: string

	public nonce!: string | null

	public apiKey!: string | null

	public ens!: string | null

	public ensFetchedAt!: Date | null

	public MeemContractWalletId!: string | null

	public MeemContractWallets!: MeemContractWallet[]

	public static associate(models: IModels) {
		this.hasMany(models.MeemContractWallet)
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
}
