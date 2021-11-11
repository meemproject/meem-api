/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import Child from '../services/Child'
import Db from '../services/Db'
import Git from '../services/Git'
import Ipfs from '../services/Ipfs'
import Lint from '../services/Lint'
import Meem from '../services/Meem'
import Types from '../services/Types'

declare global {
	namespace services {
		let child: typeof Child
		let db: typeof Db
		let git: typeof Git
		let ipfs: typeof Ipfs
		let lint: typeof Lint
		let meem: typeof Meem
		let types: typeof Types
	}
}
