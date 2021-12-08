import Meem from '../models/Meem'

export interface IModels {
	Meem: typeof Meem
}

export type AppModel = IModels[keyof IModels]
