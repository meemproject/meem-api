import coreExpress, { Express } from 'express'
import multer from 'multer'
import ConfigController from '../controllers/ConfigController'
import ContractController from '../controllers/ContractController'
import DiscordController from '../controllers/DiscordController'
import MeemContractController from '../controllers/MeemContractController'
import MeemController from '../controllers/MeemController'
import MeemIdController from '../controllers/MeemIdController'
// import NFTController from '../controllers/NFTController'
import TestController from '../controllers/TestController'
// import TweetController from '../controllers/TweetController'
import TypesController from '../controllers/TypesController'
// import WebhookController from '../controllers/WebhookController'
import extendedRouter from '../core/router'
import userLoggedInPolicy from '../policies/UserLoggedInPolicy'
// import userLoggedInPolicy from '../policies/UserLoggedInPolicy'

export default (app: Express, _express: typeof coreExpress) => {
	const router = extendedRouter()
	const imageRouter = extendedRouter()

	const storage = multer.memoryStorage()
	const upload = multer({ storage })

	app.use('/api/1.0/', router)
	app.use('/images/1.0/', imageRouter)

	router.getAsync('/getNonce', MeemIdController.getNonce)
	router.postAsync('/login', MeemIdController.login)

	router.getAsync('/me', MeemIdController.getMe)
	router.postAsync('/me', MeemIdController.createOrUpdateUser)
	router.deleteAsync(
		'/me/integrations/:integrationId',
		MeemIdController.detachUserIdentity
	)
	router.postAsync('/me/refreshENS', MeemIdController.refreshENS)
	router.getAsync('/me/apiKey', MeemIdController.getApiKey)
	router.postAsync(
		'/me/integrations/:integrationId',
		MeemIdController.updateUserIdentity
	)

	router.getAsync('/config', ConfigController.getConfig)

	router.postAsync('/isSlugAvailable', MeemContractController.isSlugAvailable)
	router.postAsync('/meemContracts', MeemContractController.createMeemContract)
	router.postAsync(
		'/meemContracts/:meemContractId',
		MeemContractController.reInitialize
	)
	router.patchAsync(
		'/meemContracts/:meemContractId',
		MeemContractController.updateMeemContract
	)
	router.postAsync(
		'/meemContracts/:meemContractId/safe',
		MeemContractController.createClubSafe
	)
	router.postAsync(
		'/meemContracts/:meemContractId/bulkMint',
		MeemContractController.bulkMint
	)
	router.postAsync(
		'/meemContracts/:meemContractId/upgrade',
		MeemContractController.upgradeClub
	)
	router.getAsync(
		'/meemContracts/:meemContractId/proof',
		MeemContractController.getMintingProof
	)
	// router.postAsync(
	// 	'/meemContracts/:meemContractId/guild',
	// 	MeemContractController.createMeemContractGuild
	// )
	// router.deleteAsync(
	// 	'/meemContracts/:meemContractId/guild',
	// 	MeemContractController.deleteMeemContractGuild
	// )
	router.postAsync('/discord/authenticate', DiscordController.authenticate)
	router.getAsync('/discord/servers', DiscordController.getGuilds)
	// router.postAsync(
	// 	'/discord/sendButton',
	// 	MeemIdController.sendDiscordJoinButton
	// )
	router.getAsync(
		'/meemContracts/:meemContractId/roles/access',
		MeemContractController.getUserMeemContractRolesAccess
	)
	router.getAsync(
		'/meemContracts/:meemContractId/getJoinGuildMessage',
		MeemContractController.getJoinGuildMessage
	)
	router.postAsync(
		'/meemContracts/:meemContractId/joinGuild',
		MeemContractController.joinMeemContractGuild
	)
	router.getAsync(
		'/meemContracts/:meemContractId/guild',
		MeemContractController.getMeemContractGuild
	)
	router.getAsync(
		'/meemContracts/:meemContractId/roles',
		MeemContractController.getMeemContractRoles
	)
	router.getAsync(
		'/meemContracts/:meemContractId/roles/:meemContractRoleId',
		MeemContractController.getMeemContractRole
	)
	router.postAsync(
		'/meemContracts/:meemContractId/roles',
		MeemContractController.createMeemContractRole
	)
	router.postAsync(
		'/meemContracts/:meemContractId/roles/:meemContractRoleId',
		MeemContractController.updateMeemContractRole
	)
	router.deleteAsync(
		'/meemContracts/:meemContractId/roles/:meemContractRoleId',
		MeemContractController.deleteMeemContractRole
	)
	router.postAsync(
		'/meemContracts/:meemContractId/integrations/:integrationId',
		MeemContractController.createOrUpdateMeemContractIntegration
	)
	// router.getAsync('/meems', MeemController.getMeems)
	// router.getAsync('/meems/:tokenId', MeemController.getMeem)
	// router.getAsync('/meems/:tokenId/children', MeemController.getChildMeems)
	router.getAsync('/clippings', MeemController.getClippings)
	router.postAsync('/clippings/status', MeemController.checkClippingStatus)
	router.postAsync('/meems/mintOriginal', MeemController.mintOriginalMeem)
	router.postAsync('/meems/create-image', MeemController.createMeemImage)
	router.getAsync('/ipfs', MeemController.getIPFSFile)

	if (config.ENABLE_URL_SCRAPER) {
		router.getAsync('/screenshot', MeemController.getScreenshot)
	}

	imageRouter.postAsync('/meems/create-image', MeemController.createMeemImage)

	imageRouter.postAsync(
		'/metadata',
		// TODO: Authentication of some kind?
		// userLoggedInPolicy,
		upload.any(),
		MeemController.saveMetadata
	)

	// Projects
	// router.postAsync('/projects', MeemController.createMeemProject)

	router.postAsync(
		'/contracts',
		userLoggedInPolicy,
		ContractController.createContract
	)

	router.postAsync(
		'/contractInstances',
		userLoggedInPolicy,
		ContractController.addContractInstance
	)

	router.patchAsync(
		'/walletContractInstances/:contractInstanceId',
		userLoggedInPolicy,
		ContractController.updateWalletContractInstance
	)

	router.postAsync(
		'/bundles',
		userLoggedInPolicy,
		ContractController.createBundle
	)

	router.putAsync(
		'/bundles/:bundleId',
		userLoggedInPolicy,
		ContractController.updateBundle
	)

	router.postAsync('/generateTypes', TypesController.generateTypes)

	if (config.ENABLE_TEST_ENDPOINTS) {
		router.getAsync('/test/emit', TestController.testEmit)
		router.getAsync('/test/error', TestController.testError)
		router.getAsync('/test/wrapped', TestController.testWrapped)
		router.getAsync(
			'/test/saveSubscription',
			TestController.testSaveSubscription
		)
		router.getAsync(
			'/test/getSubscriptions',
			TestController.testGetSubscriptions
		)
		router.getAsync('/test/getUserJWT', TestController.testGetUserJWT)
		router.getAsync('/test/gnosis', TestController.testGnosis)
		router.getAsync('/test/testCron', TestController.testCron)
		router.getAsync('/test/syncContract', TestController.syncContract)
		router.getAsync('/test/metadata', TestController.metadata)
		router.getAsync('/test/hash', TestController.testHash)
		router.getAsync('/test/releaseLock', TestController.releaseLock)
		router.getAsync('/test/mintPKP', TestController.mintPKP)
		router.getAsync('/test/getEthAddress', TestController.getEthAddress)
	}
}
