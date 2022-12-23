import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'

export default class AgreementRoleTokenTransfer extends BaseModel<AgreementRoleTokenTransfer> {
	public static readonly modelName = 'AgreementRoleTokenTransfer'

	public static get indexes() {
		return [
			{
				name: 'AgreementRoleTokenTransfer_createdAt',
				fields: ['createdAt']
			},
			{
				name: 'AgreementRoleTokenTransfer_AgreementRoleTokenId',
				fields: ['AgreementRoleTokenId']
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

	public AgreementRoleTokenId!: string

	public static associate(models: IModels) {
		this.belongsTo(models.AgreementRoleToken)
	}
}
