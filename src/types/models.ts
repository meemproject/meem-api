import Meem from '../models/Meem'
import Tweet from '../models/Tweet'

export interface IModels {
	Meem: typeof Meem
	Tweet: typeof Tweet
}

export type AppModel = IModels[keyof IModels]
