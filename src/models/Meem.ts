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
		}
	}

	public id!: string

	public tokenId!: string

	public owner!: string

	public parentChain!: MeemAPI.Chain

	public parentTokenId!: string

	public rootChain!: MeemAPI.Chain

	public rootTokenId!: string

	public generation!: number

	public mintedAt!: string

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
