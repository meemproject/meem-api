import Agreement from '../models/Agreement'
import AgreementDiscord from '../models/AgreementDiscord'
import AgreementExtension from '../models/AgreementExtension'
import AgreementExtensionLink from '../models/AgreementExtensionLink'
import AgreementExtensionRole from '../models/AgreementExtensionRole'
import AgreementExtensionWidget from '../models/AgreementExtensionWidget'
import AgreementRole from '../models/AgreementRole'
import AgreementRoleExtension from '../models/AgreementRoleExtension'
import AgreementRoleToken from '../models/AgreementRoleToken'
import AgreementRoleTokenTransfer from '../models/AgreementRoleTokenTransfer'
import AgreementRoleWallet from '../models/AgreementRoleWallet'
import AgreementSlack from '../models/AgreementSlack'
import AgreementToken from '../models/AgreementToken'
import AgreementTokenTransfer from '../models/AgreementTokenTransfer'
import AgreementTwitter from '../models/AgreementTwitter'
import AgreementWallet from '../models/AgreementWallet'
import Bundle from '../models/Bundle'
import BundleContract from '../models/BundleContract'
import ChainNonce from '../models/ChainNonce'
import Contract from '../models/Contract'
import ContractInstance from '../models/ContractInstance'
import Discord from '../models/Discord'
import Extension from '../models/Extension'
import IdentityProvider from '../models/IdentityProvider'
import Message from '../models/Message'
import Rule from '../models/Rule'
import Slack from '../models/Slack'
import Transaction from '../models/Transaction'
import Twitter from '../models/Twitter'
import User from '../models/User'
import UserIdentity from '../models/UserIdentity'
import Wallet from '../models/Wallet'
import WalletContractInstance from '../models/WalletContractInstance'

export interface IModels {
	Agreement: typeof Agreement
	AgreementDiscord: typeof AgreementDiscord
	AgreementExtension: typeof AgreementExtension
	AgreementExtensionLink: typeof AgreementExtensionLink
	AgreementExtensionRole: typeof AgreementExtensionRole
	AgreementExtensionWidget: typeof AgreementExtensionWidget
	AgreementRole: typeof AgreementRole
	AgreementRoleExtension: typeof AgreementRoleExtension
	AgreementRoleToken: typeof AgreementRoleToken
	AgreementSlack: typeof AgreementSlack
	AgreementToken: typeof AgreementToken
	AgreementTwitter: typeof AgreementTwitter
	AgreementWallet: typeof AgreementWallet
	AgreementRoleTokenTransfer: typeof AgreementRoleTokenTransfer
	AgreementRoleWallet: typeof AgreementRoleWallet
	AgreementTokenTransfer: typeof AgreementTokenTransfer
	Bundle: typeof Bundle
	BundleContract: typeof BundleContract
	ChainNonce: typeof ChainNonce
	Contract: typeof Contract
	ContractInstance: typeof ContractInstance
	Discord: typeof Discord
	Extension: typeof Extension
	IdentityProvider: typeof IdentityProvider
	Message: typeof Message
	UserIdentity: typeof UserIdentity
	Transaction: typeof Transaction
	Rule: typeof Rule
	Slack: typeof Slack
	Twitter: typeof Twitter
	User: typeof User
	Wallet: typeof Wallet
	WalletContractInstance: typeof WalletContractInstance
}

export type AppModel = IModels[keyof IModels]
