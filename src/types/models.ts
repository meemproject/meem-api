import Bundle from '../models/Bundle'
import BundleContract from '../models/BundleContract'
import Clipping from '../models/Clipping'
import Contract from '../models/Contract'
import ContractInstance from '../models/ContractInstance'
import Discord from '../models/Discord'
import Hashtag from '../models/Hashtag'
import IdentityIntegration from '../models/IdentityIntegration'
import Integration from '../models/Integration'
import Meem from '../models/Meem'
import MeemContract from '../models/MeemContract'
import MeemContractIntegration from '../models/MeemContractIntegration'
import MeemContractWallet from '../models/MeemContractWallet'
import MeemIdentity from '../models/MeemIdentity'
import MeemIdentityIntegration from '../models/MeemIdentityIntegration'
import MeemIdentityWallet from '../models/MeemIdentityWallet'
import Reaction from '../models/Reaction'
import Transaction from '../models/Transaction'
import Transfer from '../models/Transfer'
import Tweet from '../models/Tweet'
import TweetHashtag from '../models/TweetHashtag'
import Twitter from '../models/Twitter'
import Wallet from '../models/Wallet'
import WalletContractInstance from '../models/WalletContractInstance'

export interface IModels {
	Bundle: typeof Bundle
	BundleContract: typeof BundleContract
	Clipping: typeof Clipping
	Contract: typeof Contract
	ContractInstance: typeof ContractInstance
	Discord: typeof Discord
	Hashtag: typeof Hashtag
	Integration: typeof Integration
	Meem: typeof Meem
	MeemContract: typeof MeemContract
	IdentityIntegration: typeof IdentityIntegration
	MeemIdentityIntegration: typeof MeemIdentityIntegration
	MeemContractIntegration: typeof MeemContractIntegration
	MeemContractWallet: typeof MeemContractWallet
	Reaction: typeof Reaction
	Transaction: typeof Transaction
	Transfer: typeof Transfer
	Tweet: typeof Tweet
	TweetHashtag: typeof TweetHashtag
	Twitter: typeof Twitter
	Wallet: typeof Wallet
	MeemIdentity: typeof MeemIdentity
	MeemIdentityWallet: typeof MeemIdentityWallet
	WalletContractInstance: typeof WalletContractInstance
}

export type AppModel = IModels[keyof IModels]
