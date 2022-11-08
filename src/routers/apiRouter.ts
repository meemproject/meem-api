import coreExpress, { Express } from 'express'
import multer from 'multer'
import AgreementController from '../controllers/AgreementController'
import ConfigController from '../controllers/ConfigController'
import ContractController from '../controllers/ContractController'
import DiscordController from '../controllers/DiscordController'
import MeemController from '../controllers/MeemController'
import MeemIdController from '../controllers/MeemIdController'
import TestController from '../controllers/TestController'
import TypesController from '../controllers/TypesController'
import extendedRouter from '../core/router'
import userLoggedInPolicy from '../policies/UserLoggedInPolicy'

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
	router.postAsync('/me', MeemIdController.createOrUpdateMeemId)
	router.postAsync('/me/refreshENS', MeemIdController.refreshENS)
	router.getAsync('/me/apiKey', MeemIdController.getApiKey)
	router.postAsync(
		'/me/integrations/:integrationId',
		MeemIdController.createOrUpdateMeemIdIntegration
	)
	router.getAsync('/config', ConfigController.getConfig)

	router.postAsync('/isSlugAvailable', AgreementController.isSlugAvailable)
	router.postAsync('/agreements', AgreementController.createAgreement)
	router.postAsync('/agreements/:agreementId', AgreementController.reInitialize)
	router.patchAsync(
		'/agreements/:agreementId',
		AgreementController.updateAgreement
	)
	router.postAsync(
		'/agreements/:agreementId/safe',
		AgreementController.createClubSafe
	)
	router.postAsync(
		'/agreements/:agreementId/bulkMint',
		AgreementController.bulkMint
	)
	router.postAsync(
		'/agreements/:agreementId/upgrade',
		AgreementController.upgradeClub
	)
	router.getAsync(
		'/agreements/:agreementId/proof',
		AgreementController.getMintingProof
	)
	// router.postAsync(
	// 	'/agreements/:agreementId/guild',
	// 	AgreementController.createAgreementGuild
	// )
	// router.deleteAsync(
	// 	'/agreements/:agreementId/guild',
	// 	AgreementController.deleteAgreementGuild
	// )
	router.postAsync('/discord/authenticate', DiscordController.authenticate)
	router.getAsync('/discord/servers', DiscordController.getGuilds)
	// router.postAsync(
	// 	'/discord/sendButton',
	// 	MeemIdController.sendDiscordJoinButton
	// )
	router.getAsync(
		'/agreements/:agreementId/roles/access',
		AgreementController.getUserAgreementRolesAccess
	)
	router.getAsync(
		'/agreements/:agreementId/getJoinGuildMessage',
		AgreementController.getJoinGuildMessage
	)
	router.postAsync(
		'/agreements/:agreementId/joinGuild',
		AgreementController.joinAgreementGuild
	)
	router.getAsync(
		'/agreements/:agreementId/guild',
		AgreementController.getAgreementGuild
	)
	router.getAsync(
		'/agreements/:agreementId/roles',
		AgreementController.getAgreementRoles
	)
	router.getAsync(
		'/agreements/:agreementId/roles/:agreementRoleId',
		AgreementController.getAgreementRole
	)
	router.postAsync(
		'/agreements/:agreementId/roles',
		AgreementController.createAgreementRole
	)
	router.postAsync(
		'/agreements/:agreementId/roles/:agreementRoleId',
		AgreementController.updateAgreementRole
	)
	router.deleteAsync(
		'/agreements/:agreementId/roles/:agreementRoleId',
		AgreementController.deleteAgreementRole
	)
	router.postAsync(
		'/agreements/:agreementId/extensions/:extensionId',
		AgreementController.createOrUpdateAgreementExtension
	)
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
	}

	// DEPRECATED:
	// router.getAsync('/meems', MeemController.getMeems)
	// router.getAsync('/meems/:tokenId', MeemController.getMeem)
	// router.getAsync('/meems/:tokenId/children', MeemController.getChildMeems)
	// router.getAsync('/clippings', MeemController.getClippings)
	// router.postAsync('/clippings/status', MeemController.checkClippingStatus)
}
