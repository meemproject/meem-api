import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import { MeemAPI } from '../types/meem.generated'
import type { IModels } from '../types/models'
import type Agreement from './Agreement'
import type AgreementRole from './AgreementRole'
import type AgreementRoleTokenTransfer from './AgreementRoleTokenTransfer'
import type Wallet from './Wallet'

export default class AgreementRoleToken extends BaseModel<AgreementRoleToken> {
	public static readonly modelName = 'AgreementRoleToken'

	public static readonly paranoid: boolean = false

	public static get indexes() {
		return [
			{
				name: 'AgreementRoleToken_createdAt',
				fields: ['createdAt']
			},
			{
				name: 'AgreementRoleToken_tokenId',
				fields: ['tokenId']
			},
			{
				name: 'AgreementRoleToken_mintedBy',
				fields: ['mintedBy']
			},
			{
				name: 'AgreementRoleToken_AgreementId',
				fields: ['AgreementId']
			},
			{
				name: 'AgreementRoleToken_AgreementRoleId',
				fields: ['AgreementRoleId']
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
			set(this: AgreementRoleToken, val: any) {
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

	public metadata!: MeemAPI.IMeemMetadataLike

	public mintedBy!: string

	public AgreementId!: string

	public Agreement!: Agreement

	public AgreementRoleId!: string

	public AgreementRole!: AgreementRole

	public OwnerId!: string

	public Owner!: Wallet

	public Transfers!: AgreementRoleTokenTransfer[] | null

	public static associate(models: IModels) {
		this.belongsTo(models.Agreement)

		this.belongsTo(models.AgreementRole)

		this.hasMany(models.AgreementRoleTokenTransfer, {
			as: 'Transfers'
		})

		this.belongsTo(models.Wallet, {
			as: 'Owner'
		})
	}
}
