import Clipping from '../models/Clipping'
import Hashtag from '../models/Hashtag'
import Meem from '../models/Meem'
import MeemIdentification from '../models/MeemIdentification'
import MeemPass from '../models/MeemPass'
import MeemProperties from '../models/MeemProperties'
import Reaction from '../models/Reaction'
import Transfer from '../models/Transfer'
import Tweet from '../models/Tweet'
import TweetHashtag from '../models/TweetHashtag'
import Twitter from '../models/Twitter'
import Wallet from '../models/Wallet'

export interface IModels {
	Clipping: typeof Clipping
	Hashtag: typeof Hashtag
	Meem: typeof Meem
	MeemPass: typeof MeemPass
	MeemProperties: typeof MeemProperties
	MeemIdentification: typeof MeemIdentification
	Reaction: typeof Reaction
	Transfer: typeof Transfer
	Tweet: typeof Tweet
	TweetHashtag: typeof TweetHashtag
	Twitter: typeof Twitter
	Wallet: typeof Wallet
}

export type AppModel = IModels[keyof IModels]
