import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import { MeemAPI } from '../types/meem.generated'
import type { IModels } from '../types/models'
import type MeemContract from './MeemContract'
import type Transfer from './Transfer'

export default class Meem extends BaseModel<Meem> {
	public static readonly modelName = 'Meem'

	public static readonly paranoid: boolean = false

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
				name: 'Meem_meemType',
				fields: ['meemType']
			},
			{
				name: 'Meem_mintedBy',
				fields: ['mintedBy']
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
		mintedAt: {
			type: DataTypes.DATE,
			allowNull: false
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
		}
	}

	public id!: string

	public tokenId!: string

	public tokenURI!: string

	public owner!: string

	public mintedAt!: Date

	public metadata!: MeemAPI.IMeemMetadata

	public meemType!: MeemAPI.MeemType

	public mintedBy!: string

	public MeemContractId!: string

	public MeemContract!: MeemContract

	public Transfers!: Transfer[] | null

	public static associate(models: IModels) {
		this.belongsTo(models.MeemContract)

		this.hasMany(models.Transfer)

		this.hasMany(models.Reaction)

		this.belongsTo(models.Wallet, {
			as: 'Owner'
		})
	}
}
