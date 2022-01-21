/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import Child from '../services/Child'
import ContractEvents from '../services/ContractEvents'
import Db from '../services/Db'
import Git from '../services/Git'
import Ipfs from '../services/Ipfs'
import Lint from '../services/Lint'
import Meem from '../services/Meem'
import MeemId from '../services/MeemId'
import Puppeteer from '../services/Puppeteer'
import Scraper from '../services/Scraper'
import Storage from '../services/Storage'
import Twitter from '../services/Twitter'
import Types from '../services/Types'
import Web3 from '../services/Web3'

declare global {
	namespace services {
		let child: typeof Child
		let contractEvents: typeof ContractEvents
		let db: typeof Db
		let git: typeof Git
		let ipfs: typeof Ipfs
		let lint: typeof Lint
		let meem: typeof Meem
		let meemId: typeof MeemId
		let puppeteer: Puppeteer
		let scraper: typeof Scraper
		let storage: typeof Storage
		let types: typeof Types
		let twitter: typeof Twitter
		let web3: typeof Web3
	}
}
