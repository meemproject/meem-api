import Clipping from '../models/Clipping'
import ClubMeem from '../models/clubs/ClubMeem'
import ClubMeemContract from '../models/clubs/ClubMeemContract'
import Hashtag from '../models/Hashtag'
import Integration from '../models/Integration'
import Meem from '../models/Meem'
import MeemContract from '../models/MeemContract'
import MeemContractIntegration from '../models/MeemContractIntegration'
import MeemContractWallet from '../models/MeemContractWallet'
import MeemIdentification from '../models/MeemIdentification'
import MeemPass from '../models/MeemPass'
import MeemProperties from '../models/MeemProperties'
import Prompt from '../models/Prompt'
import Reaction from '../models/Reaction'
import Transfer from '../models/Transfer'
import Tweet from '../models/Tweet'
import TweetHashtag from '../models/TweetHashtag'
import Twitter from '../models/Twitter'
import Wallet from '../models/Wallet'

export interface IModels {
	Clipping: typeof Clipping
	Hashtag: typeof Hashtag
	Integration: typeof Integration
	Meem: typeof Meem
	MeemContract: typeof MeemContract
	MeemContractIntegration: typeof MeemContractIntegration
	MeemContractWallet: typeof MeemContractWallet
	MeemPass: typeof MeemPass
	MeemProperties: typeof MeemProperties
	MeemIdentification: typeof MeemIdentification
	Reaction: typeof Reaction
	Transfer: typeof Transfer
	Tweet: typeof Tweet
	TweetHashtag: typeof TweetHashtag
	Twitter: typeof Twitter
	Wallet: typeof Wallet
	Prompt: typeof Prompt
	Clubs: {
		ClubMeem: typeof ClubMeem
		ClubMeemContract: typeof ClubMeemContract
	}
}

export type AppModel = IModels[keyof IModels]
