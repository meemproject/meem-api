import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import { MeemAPI } from '../types/meem.generated'
import type { IModels } from '../types/models'
import MeemContract from './MeemContract'
import MeemProperties from './MeemProperties'
import type Reaction from './Reaction'
import type Transfer from './Transfer'

export default class Meem extends BaseModel<Meem> {
	public static readonly modelName = 'Meem'

	public static get indexes() {
		return [
			{
				name: 'Meem_createdAt',
				fields: ['createdAt']
			},
			{
				name: 'Meem_tokenId',
				fields: ['tokenId']
			},
			{
				name: 'Meem_parent',
				fields: ['parent']
			},
			{
				name: 'Meem_parentTokenId',
				fields: ['parentTokenId']
			},
			{
				name: 'Meem_owner',
				fields: ['owner']
			},
			{
				name: 'Meem_meemType',
				fields: ['meemType']
			},
			{
				name: 'Meem_mintedBy',
				fields: ['mintedBy']
			},
			{
				name: 'Meem_PropertiesId',
				fields: ['PropertiesId']
			},
			{
				name: 'Meem_ChildPropertiesId',
				fields: ['ChildPropertiesId']
			},
			{
				name: 'Meem_MeemContractId',
				fields: ['MeemContractId']
			}
		]
	}

	public static readonly attributes = {
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		meemId: {
			type: DataTypes.UUID
		},
		tokenId: {
			type: DataTypes.STRING,
			allowNull: false,
			set(this: Meem, val: any) {
				this.setDataValue(
					'tokenId',
					services.web3.toBigNumber(val).toHexString()
				)
			}
		},
		tokenURI: {
			type: DataTypes.TEXT,
			allowNull: false
		},
		owner: {
			type: DataTypes.STRING,
			allowNull: false
		},
		parentChain: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		parent: {
			type: DataTypes.STRING,
			allowNull: false,
			defaulValue: ''
		},
		parentTokenId: {
			type: DataTypes.STRING,
			allowNull: false,
			set(this: Meem, val: any) {
				this.setDataValue(
					'parentTokenId',
					services.web3.toBigNumber(val).toHexString()
				)
			}
		},
		rootChain: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		root: {
			type: DataTypes.STRING,
			allowNull: false,
			defaulValue: ''
		},
		rootTokenId: {
			type: DataTypes.STRING,
			allowNull: false,
			set(this: Meem, val: any) {
				this.setDataValue(
					'rootTokenId',
					services.web3.toBigNumber(val).toHexString()
				)
			}
		},
		generation: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		mintedAt: {
			type: DataTypes.DATE,
			allowNull: false
		},
		data: {
			type: DataTypes.TEXT,
			allowNull: false,
			defaultValue: ''
		},
		uriLockedBy: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: MeemAPI.zeroAddress
		},
		metadata: {
			type: DataTypes.JSONB,
			allowNull: false,
			defaultValue: {}
		},
		meemType: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0
		},
		mintedBy: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: MeemAPI.zeroAddress
		},
		reactionTypes: {
			type: DataTypes.JSONB,
			allowNull: false,
			defaultValue: []
		},
		uriSource: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0
		},
		numRemixes: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0
		},
		numCopies: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0
		},
		reactionCounts: {
			type: DataTypes.JSONB,
			allowNull: false,
			defaultValue: {}
		}
	}

	public id!: string

	public meemId!: string

	public tokenId!: string

	public tokenURI!: string

	public owner!: string

	public parent!: string

	public parentChain!: MeemAPI.Chain

	public parentTokenId!: string

	public root!: string

	public rootChain!: MeemAPI.Chain

	public rootTokenId!: string

	public generation!: number

	public mintedAt!: Date

	public data!: string

	public uriLockedBy!: string

	public metadata!: MeemAPI.IMeemMetadata

	public meemType!: MeemAPI.MeemType

	public mintedBy!: string

	public reactionTypes!: string[]

	public uriSource!: MeemAPI.UriSource

	public reactionCounts!: { [reaction: string]: number }

	public numRemixes!: number

	public numCopies!: number

	public MeemContractId!: string

	public PropertiesId!: string | null

	public ChildPropertiesId!: string | null

	public MeemContract!: MeemContract

	public Properties!: MeemProperties | null

	public ChildProperties!: MeemProperties | null

	public Transfers!: Transfer[] | null

	public Reactions!: Reaction[] | null

	public static associate(models: IModels) {
		this.belongsTo(models.MeemProperties, {
			as: 'MeemContract'
		})

		this.belongsTo(models.MeemProperties, {
			as: 'Properties'
		})

		this.belongsTo(models.MeemProperties, {
			as: 'ChildProperties'
		})

		this.hasMany(models.Transfer)

		this.hasMany(models.Reaction)
	}
}
