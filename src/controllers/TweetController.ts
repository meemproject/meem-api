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
}
