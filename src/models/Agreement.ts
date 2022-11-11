import { IERC721Base__factory } from '@meemproject/meem-contracts/dist/typechain/factories/@solidstate/contracts/token/ERC721/base/IERC721Base__factory'
import { MeemContractMetadataLike } from '@meemproject/metadata'
import { ethers } from 'ethers'
import keccak256 from 'keccak256'
import { DateTime } from 'luxon'
import MerkleTree from 'merkletreejs'
import { DataTypes } from 'sequelize'
import ModelWithAddress from '../core/ModelWithAddress'
import { MeemAPI } from '../types/meem.generated'
import type { IModels } from '../types/models'
import AgreementGuild from './AgreementGuild'
import AgreementRole from './AgreementRole'
import type Meem from './AgreementToken'
import type Extension from './Extension'
import type Wallet from './Wallet'

export default class Agreement extends ModelWithAddress<Agreement> {
	public static readonly modelName = 'Agreement'

	public static readonly paranoid: boolean = false

	public static get indexes() {
		return [
			{
				name: 'Agreement_createdAt',
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
			allowNull: false,
			defaultValue: DataTypes.UUIDV4
		},
		type: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: ''
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: ''
		},
		symbol: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: ''
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
			defaultValue: '0x0',
			set(this: Agreement, val: any) {
				this.setDataValue(
					'maxSupply',
					services.web3.toBigNumber(val).toHexString()
				)
				this.changed('maxSupply', true)
			}
		},
		mintPermissions: {
			type: DataTypes.JSONB,
			allowNull: false,
			defaultValue: []
		},
		splits: {
			type: DataTypes.JSONB,
			allowNull: false,
			defaultValue: []
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
		},
		ens: {
			type: DataTypes.STRING
		},
		ensFetchedAt: {
			type: DataTypes.DATE
		},
		ownerFetchedAt: {
			type: DataTypes.DATE
		},
		gnosisSafeAddress: {
			type: DataTypes.STRING
		},
		chainId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 137
		},
		adminContractAddress: {
			type: DataTypes.STRING
		}
	}

	public async isAdmin(minter: string) {
		const agreementWallet = await orm.models.AgreementWallet.findOne({
			where: {
				AgreementId: this.id,
				role: config.ADMIN_ROLE
			},
			include: [
				{
					model: orm.models.Wallet,
					where: orm.sequelize.where(
						orm.sequelize.fn('lower', orm.sequelize.col('Wallet.address')),
						minter.toLowerCase()
					)
				}
			]
		})

		if (agreementWallet) {
			return true
		}

		return false
	}

	public async getMintingPermission(
		minter: string
	): Promise<{ permission?: MeemAPI.IMeemPermission; proof: string[] }> {
		let hasCostBeenSet = false
		let costWei = 0
		const now = DateTime.local().toSeconds()
		const { wallet } = await services.ethers.getProvider({
			chainId: this.chainId
		})

		let permission: MeemAPI.IMeemPermission | undefined
		let proof: string[] = []

		for (let i = 0; i < this.mintPermissions.length; i += 1) {
			const perm = this.mintPermissions[i]
			let hasIndividualPermission = false

			if (
				(+perm.mintStartTimestamp === 0 || now >= +perm.mintStartTimestamp) &&
				(+perm.mintEndTimestamp === 0 || now <= +perm.mintEndTimestamp)
			) {
				if (
					// Allowed if permission is anyone
					perm.permission === MeemAPI.Permission.Anyone
				) {
					hasIndividualPermission = true
				}

				if (perm.permission === MeemAPI.Permission.Addresses) {
					// Allowed if to is in the list of approved addresses
					for (let j = 0; j < perm.addresses.length; j += 1) {
						if (perm.addresses[j].toLowerCase() === minter.toLowerCase()) {
							hasIndividualPermission = true
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
							hasIndividualPermission = true
							break
						}
					}
				}

				if (
					hasIndividualPermission &&
					(!hasCostBeenSet || (hasCostBeenSet && costWei > +perm.costWei))
				) {
					costWei = +perm.costWei
					hasCostBeenSet = true
					permission = perm
					const leaves = perm.addresses.map(a =>
						keccak256(ethers.utils.getAddress(a))
					)
					const merkleTree = new MerkleTree(leaves, keccak256, {
						sortPairs: true
					})
					const hashedAddress = keccak256(ethers.utils.getAddress(minter))
					proof = merkleTree.getHexProof(hashedAddress)
				}
			}
		}

		return { permission, proof }
	}

	public async canMint(minter: string) {
		const isAdmin = await this.isAdmin(minter)
		if (isAdmin) {
			return true
		}

		let hasPermission = false
		let hasCostBeenSet = false
		let costWei = 0
		const now = DateTime.local().toSeconds()
		const { wallet } = await services.ethers.getProvider({
			chainId: this.chainId
		})

		for (let i = 0; i < this.mintPermissions.length; i += 1) {
			const perm = this.mintPermissions[i]
			let hasIndividualPermission = false

			if (
				(+perm.mintStartTimestamp === 0 || now >= +perm.mintStartTimestamp) &&
				(+perm.mintEndTimestamp === 0 || now <= +perm.mintEndTimestamp)
			) {
				if (
					// Allowed if permission is anyone
					perm.permission === MeemAPI.Permission.Anyone
				) {
					hasPermission = true
					hasIndividualPermission = true
				}

				if (perm.permission === MeemAPI.Permission.Addresses) {
					// Allowed if to is in the list of approved addresses
					for (let j = 0; j < perm.addresses.length; j += 1) {
						if (perm.addresses[j].toLowerCase() === minter.toLowerCase()) {
							hasPermission = true
							hasIndividualPermission = true
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
							hasIndividualPermission = true
							break
						}
					}
				}

				if (
					hasIndividualPermission &&
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

	public type!: string

	public symbol!: string

	public contractURI!: string

	public address!: string

	public metadata!: MeemContractMetadataLike

	public maxSupply!: string

	public mintPermissions!: MeemAPI.IMeemPermission[]

	public splits!: MeemAPI.IMeemSplit[]

	public isTransferrable!: boolean

	public ens!: string | null

	public ensFetchedAt!: Date | null

	public ownerFetchedAt!: Date | null

	public gnosisSafeAddress!: string | null

	public chainId!: number

	public adminContractAddress!: string | null

	public OwnerId!: string | null

	public Owner!: Wallet | null

	public Meems?: Meem[] | null

	public Wallets?: Wallet[] | null

	public AgreementGuild?: AgreementGuild | null

	public AgreementRoles?: AgreementRole[] | null

	public Extensions?: Extension[] | null

	public static associate(models: IModels) {
		this.hasMany(models.AgreementToken)

		this.belongsToMany(models.Wallet, {
			through: models.AgreementWallet
		})

		this.belongsToMany(models.Extension, {
			through: models.AgreementExtension
		})

		this.hasOne(models.AgreementGuild)
		this.hasMany(models.AgreementRole)
		this.belongsTo(models.Wallet, {
			as: 'Owner'
		})
	}
}
