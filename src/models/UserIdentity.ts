import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'
import User from './User'

export default class UserIdentity extends BaseModel<UserIdentity> {
	public static readonly modelName = 'UserIdentity'

	public static readonly paranoid = false

	public static get indexes() {
		return [
			{
				name: 'UserIdentity_createdAt',
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
		visibility: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: 'mutual-agreement-members'
		},
		externalId: {
			type: DataTypes.STRING,
			unique: true
		},
		metadata: {
			type: DataTypes.JSONB,
			allowNull: false,
			defaultValue: {}
		}
	}

	public id!: string

	public visibility!: string

	public metadata!: { [key: string]: unknown }

	public UserId!: string | null

	public User!: User | null

	public static associate(models: IModels) {
		this.belongsTo(models.IdentityIntegration)

		this.belongsTo(models.User)
	}
}
