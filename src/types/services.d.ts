/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import Agreement from '../services/Agreement'
import Analytics from '../services/Analytics'
import Aws from '../services/Aws'
import Child from '../services/Child'
import Data from '../services/Data'
import Db from '../services/Db'
import Discord from '../services/Discord'
import Ethers from '../services/Ethers'
import Lint from '../services/Lint'
import Meem from '../services/Meem'
import MeemHelpDesk from '../services/MeemHelpdesk'
import MeemId from '../services/MeemId'
import Openai from '../services/Openai'
import Rule from '../services/Rule'
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
		let aws: typeof Aws
		let child: typeof Child
		let data: typeof Data
		let db: typeof Db
		let discord: Discord
		let ethers: Ethers
		let lint: typeof Lint
		let meem: typeof Meem
		let meemHelpdesk: typeof MeemHelpDesk
		let meemId: typeof MeemId
		let openai: typeof Openai
		let rule: typeof Rule
		let slack: typeof Slack
		let testing: Testing
		let twitter: typeof Twitter
		let types: typeof Types
		let web3: typeof Web3
	}
}
