import Hashtag from '../models/Hashtag'
import Meem from '../models/Meem'
import MeemIdentification from '../models/MeemIdentification'
import MeemPass from '../models/MeemPass'
import MeemProperties from '../models/MeemProperties'
import Tweet from '../models/Tweet'
import TweetHashtag from '../models/TweetHashtag'
import Twitter from '../models/Twitter'
import Wallet from '../models/Wallet'

export interface IModels {
	Hashtag: typeof Hashtag
	Meem: typeof Meem
	MeemPass: typeof MeemPass
	MeemProperties: typeof MeemProperties
	MeemIdentification: typeof MeemIdentification
	Tweet: typeof Tweet
	TweetHashtag: typeof TweetHashtag
	Twitter: typeof Twitter
	Wallet: typeof Wallet
}

export type AppModel = IModels[keyof IModels]