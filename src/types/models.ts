import Agreement from '../models/Agreement'
import AgreementExtension from '../models/AgreementExtension'
import AgreementExtensionLink from '../models/AgreementExtensionLink'
import AgreementExtensionRole from '../models/AgreementExtensionRole'
import AgreementExtensionWidget from '../models/AgreementExtensionWidget'
import AgreementRole from '../models/AgreementRole'
import AgreementRoleExtension from '../models/AgreementRoleExtension'
import AgreementRoleToken from '../models/AgreementRoleToken'
import AgreementRoleTokenTransfer from '../models/AgreementRoleTokenTransfer'
import AgreementToken from '../models/AgreementToken'
import AgreementTokenTransfer from '../models/AgreementTokenTransfer'
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
import Transaction from '../models/Transaction'
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
	Contract: typeof Contract
	ContractInstance: typeof ContractInstance
	Discord: typeof Discord
	Hashtag: typeof Hashtag
	Extension: typeof Extension
	AgreementToken: typeof AgreementToken
	Agreement: typeof Agreement
	IdentityIntegration: typeof IdentityIntegration
	UserIdentity: typeof UserIdentity
	AgreementRole: typeof AgreementRole
	AgreementRoleToken: typeof AgreementRoleToken
	AgreementExtension: typeof AgreementExtension
	AgreementExtensionLink: typeof AgreementExtensionLink
	AgreementExtensionWidget: typeof AgreementExtensionWidget
	AgreementExtensionRole: typeof AgreementExtensionRole
	AgreementRoleExtension: typeof AgreementRoleExtension
	AgreementWallet: typeof AgreementWallet
	Transaction: typeof Transaction
	AgreementTokenTransfer: typeof AgreementTokenTransfer
	AgreementRoleTokenTransfer: typeof AgreementRoleTokenTransfer
	Tweet: typeof Tweet
	TweetHashtag: typeof TweetHashtag
	Twitter: typeof Twitter
	User: typeof User
	Wallet: typeof Wallet
	WalletContractInstance: typeof WalletContractInstance
}

export type AppModel = IModels[keyof IModels]
