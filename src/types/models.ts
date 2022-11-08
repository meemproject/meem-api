import Bundle from '../models/Bundle'
import BundleContract from '../models/BundleContract'
import ChainNonce from '../models/ChainNonce'
import Clipping from '../models/Clipping'
import Contract from '../models/Contract'
import ContractInstance from '../models/ContractInstance'
import Discord from '../models/Discord'
import Hashtag from '../models/Hashtag'
import IdentityIntegration from '../models/IdentityIntegration'
import Integration from '../models/Integration'
import Meem from '../models/Meem'
import MeemContract from '../models/MeemContract'
import MeemContractGuild from '../models/MeemContractGuild'
import MeemContractIntegration from '../models/MeemContractIntegration'
import MeemContractRole from '../models/MeemContractRole'
import MeemContractRolePermission from '../models/MeemContractRolePermission'
import MeemContractWallet from '../models/MeemContractWallet'
import Reaction from '../models/Reaction'
import RolePermission from '../models/RolePermission'
import Transaction from '../models/Transaction'
import Transfer from '../models/Transfer'
import Tweet from '../models/Tweet'
import TweetHashtag from '../models/TweetHashtag'
import Twitter from '../models/Twitter'
import User from '../models/User'
import UserIdentity from '../models/UserIdentity'
import Wallet from '../models/Wallet'
import WalletContractInstance from '../models/WalletContractInstance'

export interface IModels {
	Bundle: typeof Bundle
	BundleContract: typeof BundleContract
	ChainNonce: typeof ChainNonce
	Clipping: typeof Clipping
	Contract: typeof Contract
	ContractInstance: typeof ContractInstance
	Discord: typeof Discord
	Hashtag: typeof Hashtag
	Integration: typeof Integration
	IdentityIntegration: typeof IdentityIntegration
	Meem: typeof Meem
	MeemContract: typeof MeemContract
	UserIdentity: typeof UserIdentity
	MeemContractGuild: typeof MeemContractGuild
	MeemContractIntegration: typeof MeemContractIntegration
	MeemContractRole: typeof MeemContractRole
	MeemContractRolePermission: typeof MeemContractRolePermission
	MeemContractWallet: typeof MeemContractWallet
	RolePermission: typeof RolePermission
	Reaction: typeof Reaction
	Transaction: typeof Transaction
	Transfer: typeof Transfer
	Tweet: typeof Tweet
	TweetHashtag: typeof TweetHashtag
	Twitter: typeof Twitter
	User: typeof User
	Wallet: typeof Wallet
	WalletContractInstance: typeof WalletContractInstance
}

export type AppModel = IModels[keyof IModels]
