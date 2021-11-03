/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import Child from '../services/Child'

declare global {
	namespace services {
		let child: typeof Child
	}
}
