import coreExpress, { Express } from 'express'
import ConfigController from '../controllers/ConfigController'
import MeemController from '../controllers/MeemController'
import MeemIdController from '../controllers/MeemIdController'
import NFTController from '../controllers/NFTController'
import TestController from '../controllers/TestController'
import TweetController from '../controllers/TweetController'
import WebhookController from '../controllers/WebhookController'
import extendedRouter from '../core/router'

export default (app: Express, _express: typeof coreExpress) => {
	const router = extendedRouter()
	const imageRouter = extendedRouter()

	app.use('/api/1.0/', router)
	app.use('/images/1.0/', imageRouter)

	router.getAsync('/getNonce', MeemIdController.getNonce)
	router.postAsync('/login', MeemIdController.login)
	router.postAsync('/meemId', MeemIdController.createOrUpdateMeemId)
	router.getAsync('/meemId', MeemIdController.getMeemId)
	router.getAsync('/me', MeemIdController.getMe)

	router.getAsync('/access', MeemController.getAccessList)
	router.getAsync('/config', ConfigController.getConfig)
	router.getAsync('/whitelist', MeemController.getWhitelist)
	router.postAsync('/meemid', MeemController.createOrUpdateMeemId)
	router.postAsync('/meemids/search', MeemController.searchMeemIds)
	router.getAsync(
		'/meemid/twitter/request-url',
		MeemController.getTwitterAuthUrl
	)
	router.postAsync(
		'/meemid/twitter/access-token',
		MeemController.getTwitterAccessToken
	)
	router.getAsync('/meems', MeemController.getMeems)
	router.getAsync('/meems/:tokenId', MeemController.getMeem)
	router.postAsync('/meems/mint', MeemController.mintMeem)
	router.postAsync('/meems/create-image', MeemController.createMeemImage)
	router.postAsync('/meems/getWrappedTokens', MeemController.getWrappedTokens)
	router.getAsync('/tokenOwner', MeemController.getTokenInfo)
	router.getAsync('/ipfs', MeemController.getIPFSFile)
	router.getAsync('/nfts', NFTController.getNFTs)
	router.postAsync('/webhook/moralis', WebhookController.handleMoralisWebhook)

	// Twitter
	router.getAsync('/tweets', TweetController.getTweets)

	imageRouter.postAsync('/meems/create-image', MeemController.createMeemImage)

	if (config.ENABLE_TEST_ENDPOINTS) {
		router.getAsync('/test/emit', TestController.testEmit)
		router.getAsync('/test/wrapped', TestController.testWrapped)
	}
}
