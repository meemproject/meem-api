import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import { MeemAPI } from '../types/meem.generated'
import type { IModels } from '../types/models'
import type Agreement from './Agreement'
import type AgreementTokenTransfer from './AgreementTokenTransfer'
import type Wallet from './Wallet'

export default class AgreementToken extends BaseModel<AgreementToken> {
	public static readonly modelName = 'AgreementToken'

	public static readonly paranoid: boolean = false

	public static get indexes() {
		return [
			{
				name: 'AgreementToken_createdAt',
				fields: ['createdAt']
			},
			{
				name: 'AgreementToken_tokenId',
				fields: ['tokenId']
			},
			{
				name: 'AgreementToken_meemType',
				fields: ['meemType']
			},
			{
				name: 'AgreementToken_mintedBy',
				fields: ['mintedBy']
			},
			{
				name: 'AgreementToken_AgreementId',
				fields: ['AgreementId']
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
			set(this: AgreementToken, val: any) {
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

	public mintedAt!: Date

	public metadata!: MeemAPI.ITokenMetadata

	public meemType!: MeemAPI.MeemType

	public mintedBy!: string

	public AgreementId!: string

	public Agreement!: Agreement

	public OwnerId!: string

	public Owner!: Wallet

	public Transfers!: AgreementTokenTransfer[] | null

	public static associate(models: IModels) {
		this.belongsTo(models.Agreement)

		this.hasMany(models.AgreementTokenTransfer, {
			as: 'Transfers'
		})

		this.belongsTo(models.Wallet, {
			as: 'Owner'
		})
	}
}
