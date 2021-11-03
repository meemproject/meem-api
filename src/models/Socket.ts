import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'
import type SocketSubscription from './SocketSubscription'
import type User from './User'

export default class Socket extends BaseModel<Socket> {
	public static readonly modelName = 'Socket'

	public static readonly paranoid: boolean = false

	public static readonly indexes = [
		{
			name: 'Socket_socketId',
			fields: ['socketId']
		}
	]

	public static readonly attributes = {
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		socketId: {
			type: DataTypes.STRING,
			unique: true,
			allowNull: false
		}
	}

	public id!: string

	public socketId!: string

	/** Array of subscriptions */
	public SocketSubscriptions?: SocketSubscription[] | null

	public UserId!: string | null

	public User!: User

	public static associate(models: IModels) {
		this.belongsTo(models.User, {})
	}
}
