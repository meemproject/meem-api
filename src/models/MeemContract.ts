import { IERC721Base__factory } from '@meemproject/meem-contracts/dist/typechain'
import { MeemContractMetadataLike } from '@meemproject/metadata'
import { ethers } from 'ethers'
import { DateTime } from 'luxon'
import { DataTypes } from 'sequelize'
import ModelWithAddress from '../core/ModelWithAddress'
import { MeemAPI } from '../types/meem.generated'
import type { IModels } from '../types/models'
import type Integration from './Integration'
import type Meem from './Meem'
import type Wallet from './Wallet'

export default class MeemContract extends ModelWithAddress<MeemContract> {
	public static readonly modelName = 'MeemContract'

	public static readonly paranoid: boolean = false

	public static get indexes() {
		return [
			{
				name: 'MeemContract_createdAt',
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
		slug: {
			type: DataTypes.STRING,
			allowNull: false
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false
		},
		symbol: {
			type: DataTypes.STRING,
			allowNull: false
		},
		address: {
			type: DataTypes.STRING,
			allowNull: false
		},
		metadata: {
			type: DataTypes.JSONB,
			allowNull: false,
			defaultValue: {}
		},
		maxSupply: {
			type: DataTypes.STRING,
			allowNull: false,
			set(this: MeemContract, val: any) {
				this.setDataValue(
					'maxSupply',
					services.web3.toBigNumber(val).toHexString()
				)
			}
		},
		isMaxSupplyLocked: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
		},
		mintPermissions: {
			type: DataTypes.JSONB,
			allowNull: false
		},
		splits: {
			type: DataTypes.JSONB,
			allowNull: false
		},
		isTransferrable: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: true
		},
		contractURI: {
			type: DataTypes.TEXT,
			allowNull: false,
			defaultValue: ''
		}
	}

	public isAdmin(minter: string) {
		if (!this.Wallets) {
			throw new Error('WALLET_NOT_FOUND')
		}
		// Bypass checks if user has the MINTER_ROLE
		for (let i = 0; i < this.Wallets.length; i += 1) {
			if (
				this.Wallets[i].address.toLowerCase() === minter.toLowerCase() &&
				this.Wallets[i].MeemContractWallets[0].role === config.ADMIN_ROLE
			) {
				return true
			}
		}

		return false
	}

	public async canMint(minter: string) {
		if (this.isAdmin(minter)) {
			return true
		}

		let hasPermission = false
		let hasCostBeenSet = false
		let costWei = 0
		const now = DateTime.local().toSeconds()
		const provider = await services.ethers.getProvider()

		const wallet = new ethers.Wallet(config.WALLET_PRIVATE_KEY, provider)

		for (let i = 0; i < this.mintPermissions.length; i += 1) {
			const perm = this.mintPermissions[i]

			if (
				(+perm.mintStartTimestamp === 0 || now >= +perm.mintStartTimestamp) &&
				(+perm.mintEndTimestamp === 0 || now <= +perm.mintEndTimestamp)
			) {
				if (
					// Allowed if permission is anyone
					perm.permission === MeemAPI.Permission.Anyone
				) {
					hasPermission = true
				}

				if (perm.permission === MeemAPI.Permission.Addresses) {
					// Allowed if to is in the list of approved addresses
					for (let j = 0; j < perm.addresses.length; j += 1) {
						if (perm.addresses[j].toLowerCase() === minter.toLowerCase()) {
							hasPermission = true
							break
						}
					}
				}

				if (perm.permission === MeemAPI.Permission.Holders) {
					// Check each address
					for (let j = 0; j < perm.addresses.length; j += 1) {
						const erc721Contract = IERC721Base__factory.connect(
							perm.addresses[j],
							wallet
						)
						// eslint-disable-next-line no-await-in-loop
						const balance = await erc721Contract.balanceOf(minter)

						if (balance.toNumber() >= +perm.numTokens) {
							hasPermission = true
							break
						}
					}
				}

				if (
					hasPermission &&
					(!hasCostBeenSet || (hasCostBeenSet && costWei > +perm.costWei))
				) {
					costWei = +perm.costWei
					hasCostBeenSet = true
				}
			}
		}

		if (!hasPermission) {
			return false
		}

		// Only allow gasless minting if cost is 0
		if (costWei > 0) {
			return false
		}

		return true
	}

	public id!: string

	public name!: string

	public slug!: string

	public symbol!: string

	public contractURI!: string

	public address!: string

	public metadata!: MeemContractMetadataLike

	public maxSupply!: string

	public isMaxSupplyLocked!: boolean

	public mintPermissions!: MeemAPI.IMeemPermission[]

	public splits!: MeemAPI.IMeemSplit[]

	public isTransferrable!: boolean

	public Meems?: Meem[] | null

	public Wallets?: Wallet[] | null

	public Integrations?: Integration[] | null

	public static associate(models: IModels) {
		this.hasMany(models.Meem)

		this.belongsToMany(models.Wallet, {
			through: models.MeemContractWallet
		})

		this.belongsToMany(models.Integration, {
			through: models.MeemContractIntegration
		})
	}
}
