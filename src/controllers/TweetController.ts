// import AWS from 'aws-sdk'
// import { ethers } from 'ethers'
// import { Response } from 'express'
// import TwitterApi from 'twitter-api-v2'
import { IRequest, IResponse } from '../types/app'
import { MeemAPI } from '../types/meem.generated'

export default class TweetController {
	public static async getTweets(
		req: IRequest<MeemAPI.v1.GetTweets.IDefinition>,
		res: IResponse<MeemAPI.v1.GetTweets.IResponseBody>
	): Promise<any> {
		const tweets = await services.twitter.getTweets()
		return res.json({
			tweets
		})
	}
}
