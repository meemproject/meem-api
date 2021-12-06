// import AWS from 'aws-sdk'
// import { ethers } from 'ethers'
// import { Response } from 'express'
// import TwitterApi from 'twitter-api-v2'
import { IRequest, IResponse } from '../types/app'
import { MeemAPI } from '../types/meem.generated'

export default class TweetController {
	public static async getMeemMentionTweets(
		req: IRequest<MeemAPI.v1.GetMeemMentionTweets.IDefinition>,
		res: IResponse<MeemAPI.v1.GetMeemMentionTweets.IResponseBody>
	): Promise<any> {
		const tweets = await services.twitter.getMeemMentionTweets()
		return res.json(tweets)
	}

	public static async getMeemActionTweets(
		req: IRequest<MeemAPI.v1.GetMeemActionTweets.IDefinition>,
		res: IResponse<MeemAPI.v1.GetMeemActionTweets.IResponseBody>
	): Promise<any> {
		const tweets = await services.twitter.getMeemActionTweets()
		return res.json(tweets)
	}
}
