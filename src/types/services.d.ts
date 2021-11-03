/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import Child from '../services/Child'
import Lint from '../services/Lint'
import Meem from '../services/Meem'
import Types from '../services/Types'

declare global {
	namespace services {
		let child: typeof Child
		let meem: typeof Meem
		let lint: typeof Lint
		let types: typeof Types
	}
}
