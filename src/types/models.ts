import Agreement from '../models/Agreement'
import AgreementExtension from '../models/AgreementExtension'
import AgreementGuild from '../models/AgreementGuild'
import AgreementRole from '../models/AgreementRole'
import AgreementRolePermission from '../models/AgreementRolePermission'
import AgreementWallet from '../models/AgreementWallet'
import Bundle from '../models/Bundle'
import BundleContract from '../models/BundleContract'
import ChainNonce from '../models/ChainNonce'
import Contract from '../models/Contract'
import ContractInstance from '../models/ContractInstance'
import Discord from '../models/Discord'
import Extension from '../models/Extension'
import Hashtag from '../models/Hashtag'
import IdentityIntegration from '../models/IdentityIntegration'
import MeemIdentity from '../models/MeemIdentity'
import MeemIdentityIntegration from '../models/MeemIdentityIntegration'
import MeemIdentityWallet from '../models/MeemIdentityWallet'
import RolePermission from '../models/RolePermission'
import Token from '../models/Token'
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
	Contract: typeof Contract
	ContractInstance: typeof ContractInstance
	Discord: typeof Discord
	Hashtag: typeof Hashtag
	Extension: typeof Extension
	Token: typeof Token
	Agreement: typeof Agreement
	IdentityIntegration: typeof IdentityIntegration
	MeemIdentityIntegration: typeof MeemIdentityIntegration
	AgreementGuild: typeof AgreementGuild
	AgreementRole: typeof AgreementRole
	AgreementRolePermission: typeof AgreementRolePermission
	RolePermission: typeof RolePermission
	AgreementExtension: typeof AgreementExtension
	AgreementWallet: typeof AgreementWallet
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
