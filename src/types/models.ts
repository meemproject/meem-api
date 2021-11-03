import Socket from '../models/Socket'
import SocketSubscription from '../models/SocketSubscription'
import User from '../models/User'

export interface IModels {
	Socket: typeof Socket
	SocketSubscription: typeof SocketSubscription
	User: typeof User
}

export type AppModel = IModels[keyof IModels]
