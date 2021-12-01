// import AWS from 'aws-sdk'
// import { ethers } from 'ethers'
// import { Response } from 'express'
// import TwitterApi from 'twitter-api-v2'
import { IRequest, IResponse } from '../types/app'
import { MeemAPI } from '../types/meem.generated'

export default class TweetController {
	public static async getMeemTweets(
		req: IRequest<MeemAPI.v1.GetMeemTweets.IDefinition>,
		res: IResponse<MeemAPI.v1.GetMeemTweets.IResponseBody>
	): Promise<any> {
		const tweets = await services.twitter.getMeemTweets()
		return res.json({
			tweets
		})
	}
}
