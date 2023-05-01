/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import Agreement from '../services/Agreement'
import Analytics from '../services/Analytics'
import Child from '../services/Child'
import ContractEvents from '../services/ContractEvents'
import Data from '../services/Data'
import Db from '../services/Db'
import Discord from '../services/Discord'
import Ethers from '../services/Ethers'
import Git from '../services/Git'
import Guild from '../services/Guild'
import Ipfs from '../services/Ipfs'
import Lint from '../services/Lint'
import Lit from '../services/Lit'
import Meem from '../services/Meem'
import MeemHelpDesk from '../services/MeemHelpdesk'
import MeemId from '../services/MeemId'
import Openai from '../services/Openai'
import Puppeteer from '../services/Puppeteer'
import Queue from '../services/Queue'
import Rule from '../services/Rule'
import Scraper from '../services/Scraper'
import Slack from '../services/Slack'
import Storage from '../services/Storage'
import Testing from '../services/Testing'
import Twitter from '../services/Twitter'
import Types from '../services/Types'
import Web3 from '../services/Web3'

declare global {
	namespace services {
		let analytics: typeof Analytics
		let agreement: typeof Agreement
		let agreementRole: typeof AgreementRole
		let child: typeof Child
		let contractEvents: typeof ContractEvents
		let data: typeof Data
		let db: typeof Db
		let discord: Discord
		let ethers: Ethers
		let guild: typeof Guild
		let git: typeof Git
		let ipfs: typeof Ipfs
		let lint: typeof Lint
		let lit: typeof Lit
		let meem: typeof Meem
		let meemHelpdesk: typeof MeemHelpDesk
		let meemId: typeof MeemId
		let openai: typeof Openai
		let puppeteer: Puppeteer
		let queue: typeof Queue
		let rule: typeof Rule
		let scraper: typeof Scraper
		let slack: typeof Slack
		let storage: Storage
		let testing: Testing
		let twitter: typeof Twitter
		let types: typeof Types
		let web3: typeof Web3
	}
}
