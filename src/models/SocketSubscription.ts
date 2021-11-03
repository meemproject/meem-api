import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'
import type Socket from './Socket'

export default class SocketSubscription extends BaseModel<SocketSubscription> {
	public static readonly modelName = 'SocketSubscription'

	public static readonly paranoid: boolean = false

	public static readonly indexes = [
		{
			name: 'SocketSubscription_key',
			fields: ['key']
		},
		{
			name: 'SocketSubscription_SocketId',
			fields: ['SocketId']
		}
	]

	public static readonly attributes = {
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		key: {
			type: DataTypes.STRING,
			unique: true,
			allowNull: false
		}
	}

	public id!: string

	/** The subscription key */
	public key!: string

	public SocketId!: string | null

	public Socket!: Socket

	public static associate(models: IModels) {
		this.belongsTo(models.Socket, {})
	}
}
