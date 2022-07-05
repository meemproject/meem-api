import { IRequest, IResponse } from '../types/app'
import { MeemAPI } from '../types/meem.generated'

export default class TweetController {
	public static async getTweets(
		req: IRequest<MeemAPI.v1.GetTweets.IDefinition>,
		res: IResponse<MeemAPI.v1.GetTweets.IResponseBody>
	): Promise<any> {
		await services.twitter.checkForMissedTweets()
		return res.json({
			tweets: []
		})
	}

	public static async verifyMeemContractTwitter(
		req: IRequest<MeemAPI.v1.VerifyMeemContractTwitter.IDefinition>,
		res: IResponse<MeemAPI.v1.VerifyMeemContractTwitter.IResponseBody>
	): Promise<any> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		if (!req.body.meemContractId) {
			throw new Error('INVALID_PARAMETERS')
		}

		if (!req.body.twitterUsername) {
			throw new Error('INVALID_PARAMETERS')
		}

		const genericMeemContract = await services.meem.getMeemContract()
		const adminRole = await genericMeemContract.ADMIN_ROLE()
		const meemContract = await orm.models.MeemContract.findOne({
			where: {
				id: req.body.meemContractId
			},
			include: [
				{
					model: orm.models.Wallet,
					where: {
						address: req.wallet.address
					},
					through: {
						where: {
							role: adminRole
						}
					}
				}
			]
		})

		if (!meemContract) {
			throw new Error('MEEM_CONTRACT_NOT_FOUND')
		}

		if (meemContract.Wallets.length < 1) {
			throw new Error('NOT_AUTHORIZED')
		}

		await services.twitter.verifyMeemContractTwitter({
			twitterUsername: req.body.twitterUsername,
			meemContract
		})
		return res.json({
			status: 'success'
		})
	}
}
