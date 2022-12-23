import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'

export default class AgreementTokenTransfer extends BaseModel<AgreementTokenTransfer> {
	public static readonly modelName = 'AgreementTokenTransfer'

	public static get indexes() {
		return [
			{
				name: 'AgreementTokenTransfer_createdAt',
				fields: ['createdAt']
			},
			{
				name: 'AgreementTokenTransfer_AgreementTokenId',
				fields: ['AgreementTokenId']
			}
		]
	}

	public static readonly attributes = {
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		from: {
			type: DataTypes.STRING,
			allowNull: false
		},
		to: {
			type: DataTypes.STRING,
			allowNull: false
		},
		transactionHash: {
			type: DataTypes.STRING,
			allowNull: false
		},
		transferredAt: {
			type: DataTypes.DATE,
			allowNull: false
		}
	}

	public id!: string

	public from!: string

	public to!: string

	public transactionHash!: string

	public transferredAt!: Date

	public AgreementTokenId!: string

	public static associate(models: IModels) {
		this.belongsTo(models.AgreementToken)
	}
}
