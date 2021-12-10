import Hashtag from '../models/Hashtag'
import Meem from '../models/Meem'
import MeemProperties from '../models/MeemProperties'
import Tweet from '../models/Tweet'
import TweetHashtag from '../models/TweetHashtag'

export interface IModels {
	Hashtag: typeof Hashtag
	Meem: typeof Meem
	MeemProperties: typeof MeemProperties
	Tweet: typeof Tweet
	TweetHashtag: typeof TweetHashtag
}

export type AppModel = IModels[keyof IModels]
