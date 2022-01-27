import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import { MeemAPI } from '../types/meem.generated'
import type { IModels } from '../types/models'
import MeemProperties from './MeemProperties'

export default class Meem extends BaseModel<Meem> {
	public static readonly modelName = 'Meem'

	public static get indexes() {
		return []
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
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: ''
		},
		verifiedBy: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: MeemAPI.zeroAddress
		},
		metadata: {
			type: DataTypes.JSONB,
			allowNull: false,
			defaultValue: {}
		}
	}

	public id!: string

	public meemId!: string

	public tokenId!: string

	public owner!: string

	public parent!: string

	public parentChain!: MeemAPI.Chain

	public parentTokenId!: string

	public root!: string

	public rootChain!: MeemAPI.Chain

	public rootTokenId!: string

	public generation!: number

	public mintedAt!: string

	public data!: string

	public verifiedBy!: string

	public metadata!: MeemAPI.IMeemMetadata

	public PropertiesId!: string | null

	public ChildPropertiesId!: string | null

	public Properties!: MeemProperties | null

	public ChildProperties!: MeemProperties | null

	public static associate(models: IModels) {
		this.belongsTo(models.MeemProperties, {
			as: 'Properties'
		})

		this.belongsTo(models.MeemProperties, {
			as: 'ChildProperties'
		})
	}
}
