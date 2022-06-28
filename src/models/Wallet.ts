import { Op, DataTypes } from 'sequelize'
import ModelWithAddress from '../core/ModelWithAddress'
import type { IModels } from '../types/models'
import type MeemContractWallet from './MeemContractWallet'
import type MeemIdentification from './MeemIdentification'

export default class Wallet extends ModelWithAddress<Wallet> {
	public static readonly modelName = 'Wallet'

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
		isDefault: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
		}
	}

	public id!: string

	public address!: string

	public nonce!: string | null

	public isDefault!: boolean

	public MeemIdentification!: MeemIdentification | null

	public MeemIdentificationId!: string | null

	public MeemContractWalletId!: string | null

	public MeemContractWallets!: MeemContractWallet[]

	public static associate(models: IModels) {
		this.belongsTo(models.MeemIdentification)
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

	public static async findOrCreate(options: { address: string }) {
		const { address } = options
		let wallet = await this.findByAddress(address)

		if (!wallet) {
			wallet = await this.create({
				address
			})
		}

		return wallet as Wallet
	}
}
