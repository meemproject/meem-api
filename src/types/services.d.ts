/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import Child from '../services/Child'
import ContractEvents from '../services/ContractEvents'
import Db from '../services/Db'
import Discord from '../services/Discord'
import Ethers from '../services/Ethers'
import Git from '../services/Git'
import Guild from '../services/Guild'
import Ipfs from '../services/Ipfs'
import Lint from '../services/Lint'
import Lit from '../services/Lit'
import Meem from '../services/Meem'
import MeemContract from '../services/MeemContract'
import MeemContractRole from '../services/MeemContractRole'
import MeemId from '../services/MeemId'
// import Prompts from '../services/Prompts'
import Puppeteer from '../services/Puppeteer'
import Queue from '../services/Queue'
import Scraper from '../services/Scraper'
import Storage from '../services/Storage'
import Testing from '../services/Testing'
import Twitter from '../services/Twitter'
import Types from '../services/Types'
import Web3 from '../services/Web3'

declare global {
	namespace services {
		let child: typeof Child
		let contractEvents: typeof ContractEvents
		let db: typeof Db
		let discord: typeof Discord
		let ethers: Ethers
		let guild: typeof Guild
		let git: typeof Git
		let ipfs: typeof Ipfs
		let lint: typeof Lint
		let lit: typeof Lit
		let meem: typeof Meem
		let meemContract: typeof MeemContract
		let meemContractRole: typeof MeemContractRole
		let meemId: typeof MeemId
		// let prompts: typeof Prompts
		let puppeteer: Puppeteer
		let queue: typeof Queue
		let scraper: typeof Scraper
		let storage: typeof Storage
		let testing: Testing
		let twitter: typeof Twitter
		let types: typeof Types
		let web3: typeof Web3
	}
}
