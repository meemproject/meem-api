/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-var-requires */
// eslint-disable-next-line import/no-extraneous-dependencies
/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-var-requires */
import util from 'util'
import supertest, { SuperTest, Test } from 'supertest'
import start from '../core/start'
import { MeemAPI } from '../types/meem.generated'

let server: Express.Application
let request: SuperTest<Test>

export const handle = async (
	body: MeemAPI.v1.UpgradeAgreement.IRequestBody & {
		agreementId: string
		senderWalletAddress: string
	},
	context: AWSLambda.Context
) => {
	// eslint-disable-next-line no-console
	console.log(
		util.inspect(
			{
				body
			},
			true,
			999,
			true
		)
	)
	context.callbackWaitsForEmptyEventLoop = false

	try {
		if (!request || !server) {
			const result = await start()
			server = result.app
			request = supertest(server)
		}

		if (config.AWS_WEBSOCKET_GATEWAY_URL) {
			sockets?.connectLambda({
				endpoint: config.AWS_WEBSOCKET_GATEWAY_URL
			})
		} else {
			log.crit('AWS_WEBSOCKET_GATEWAY_URL is not set')
		}

		await services.agreement.upgradeAgreement(body)
	} catch (e: any) {
		log.crit(e)
	}
}
