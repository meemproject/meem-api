export interface TweetMeemExtensionProperties {
	meem_tweets_extension: {
		tweet: {
			text: string
			userId: string
			tweetId: string
			entities?: any
			username: string
			createdAt: string
			updatedAt: string
			userProfileImageUrl: string
		}
		prompt?: {
			body: string
			startAt: string
			tweetId: string
		}
	}
}
