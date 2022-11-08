import Agreement from '../models/Agreement'
import AgreementIntegration from '../models/AgreementExtension'
import AgreementGuild from '../models/AgreementGuild'
import AgreementRole from '../models/AgreementRole'
import AgreementRolePermission from '../models/AgreementRolePermission'
import AgreementWallet from '../models/AgreementWallet'
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
import MeemIdentity from '../models/MeemIdentity'
import MeemIdentityIntegration from '../models/MeemIdentityIntegration'
import MeemIdentityWallet from '../models/MeemIdentityWallet'
import Reaction from '../models/Reaction'
import RolePermission from '../models/RolePermission'
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
	ChainNonce: typeof ChainNonce
	Clipping: typeof Clipping
	Contract: typeof Contract
	ContractInstance: typeof ContractInstance
	Discord: typeof Discord
	Hashtag: typeof Hashtag
	Integration: typeof Integration
	Meem: typeof Meem
	Agreement: typeof Agreement
	IdentityIntegration: typeof IdentityIntegration
	MeemIdentityIntegration: typeof MeemIdentityIntegration
	AgreementGuild: typeof AgreementGuild
	AgreementRole: typeof AgreementRole
	AgreementRolePermission: typeof AgreementRolePermission
	RolePermission: typeof RolePermission
	AgreementIntegration: typeof AgreementIntegration
	AgreementWallet: typeof AgreementWallet
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
