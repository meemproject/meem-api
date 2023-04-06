import coreExpress, { Express } from 'express'
import AgreementController from '../controllers/AgreementController'
import AgreementExtensionController from '../controllers/AgreementExtensionController'
import AgreementRoleController from '../controllers/AgreementRoleController'
import ConfigController from '../controllers/ConfigController'
import DiscordController from '../controllers/DiscordController'
import EPMController from '../controllers/EPMController'
import MeemController from '../controllers/MeemController'
import MeemIdController from '../controllers/MeemIdController'
import TestController from '../controllers/TestController'
import TypesController from '../controllers/TypesController'
import extendedRouter from '../core/router'
import userLoggedInPolicy from '../policies/UserLoggedInPolicy'

export default (app: Express, _express: typeof coreExpress) => {
	const router = extendedRouter()
	const imageRouter = extendedRouter()

	app.use('/api/1.0/', router)
	app.use('/images/1.0/', imageRouter)

	/** Auth Routes */

	router.getAsync('/getNonce', MeemIdController.getNonce)
	router.postAsync('/login', MeemIdController.login)

	/** Current User Routes */

	router.getAsync('/me', MeemIdController.getMe)
	router.postAsync('/me', MeemIdController.createOrUpdateUser)
	router.patchAsync(
		'/me/identity/:userIdentityId',
		MeemIdController.updateUserIdentity
	)
	router.deleteAsync(
		'/me/identity/:userIdentityId',
		MeemIdController.removeUserIdentity
	)
	router.postAsync('/me/refreshENS', MeemIdController.refreshENS)
	router.getAsync('/me/apiKey', MeemIdController.getApiKey)

	/** Agreements and Roles Routes */

	router.postAsync('/agreements', AgreementController.createAgreement)
	router.postAsync(
		'/agreements/isSlugAvailable',
		AgreementController.isSlugAvailable
	)
	router.postAsync(
		'/agreements/:agreementId/reinitialize',
		AgreementController.reInitialize
	)
	router.patchAsync(
		'/agreements/:agreementId',
		AgreementController.updateAgreement
	)
	router.postAsync(
		'/agreements/:agreementId/safe',
		AgreementController.createAgreementSafe
	)
	router.patchAsync(
		'/agreements/:agreementId/safe',
		AgreementController.setAgreementSafeAddress
	)
	router.patchAsync(
		'/agreements/:agreementId/setAdminRole',
		AgreementController.setAgreementAdminRole
	)
	router.postAsync(
		'/agreements/:agreementId/bulkMint',
		AgreementController.bulkMint
	)
	router.postAsync(
		'/agreements/:agreementId/bulkBurn',
		AgreementController.bulkBurn
	)
	router.postAsync(
		'/agreements/:agreementId/upgrade',
		AgreementController.upgradeAgreement
	)
	router.getAsync(
		'/agreements/:agreementId/proof',
		AgreementController.getMintingProof
	)
	router.getAsync(
		'/agreements/:agreementId/isAdmin',
		AgreementController.checkIsAgreementAdmin
	)
	router.postAsync(
		'/agreements/:agreementId/extensions',
		AgreementExtensionController.createAgreementExtension
	)
	router.putAsync(
		'/agreements/:agreementId/extensions/:agreementExtensionId',
		AgreementExtensionController.updateAgreementExtension
	)
	router.getAsync(
		'/agreements/:agreementId/roles',
		AgreementRoleController.getAgreementRoles
	)
	router.getAsync(
		'/agreements/:agreementId/roles/:agreementRoleId',
		AgreementRoleController.getAgreementRole
	)
	router.postAsync(
		'/agreements/:agreementId/roles',
		AgreementRoleController.createAgreementRole
	)
	router.postAsync(
		'/agreements/:agreementId/roles/:agreementRoleId/reinitialize',
		AgreementRoleController.reinitialize
	)
	// TODO: How do we handle deleting roles/role tokens?
	// router.deleteAsync(
	// 	'/agreements/:agreementId/roles/:agreementRoleId',
	// 	AgreementRoleController.deleteAgreementRole
	// )
	router.postAsync(
		'/agreements/:agreementId/roles/:agreementRoleId/bulkMint',
		AgreementRoleController.bulkMint
	)
	router.postAsync(
		'/agreements/:agreementId/roles/:agreementRoleId/bulkBurn',
		AgreementRoleController.bulkBurn
	)
	router.postAsync(
		'/agreements/:agreementId/roles/:agreementRoleId/upgrade',
		AgreementController.upgradeAgreement
	)

	/** EPM Routes */

	router.postAsync(
		'/epm/contracts',
		userLoggedInPolicy,
		EPMController.createContract
	)
	router.postAsync(
		'/epm/contractInstances',
		userLoggedInPolicy,
		EPMController.addContractInstance
	)
	router.postAsync(
		'/epm/bundles',
		userLoggedInPolicy,
		EPMController.createBundle
	)
	router.putAsync(
		'/epm/bundles/:bundleId',
		userLoggedInPolicy,
		EPMController.updateBundle
	)
	router.patchAsync(
		'/epm/walletContractInstances/:contractInstanceId',
		userLoggedInPolicy,
		EPMController.updateWalletContractInstance
	)

	/** Discord Routes */

	router.postAsync('/discord/authenticate', DiscordController.authenticate)
	router.getAsync('/discord/servers', DiscordController.getGuilds)

	/** Misc Routes */

	router.getAsync('/config', ConfigController.getConfig)
	router.getAsync('/ipfs', MeemController.getIPFSFile)
	router.postAsync('/ipfs', MeemController.saveToIPFS)
	router.postAsync('/generateTypes', TypesController.generateTypes)
	router.getAsync('/meem-api.json', TypesController.getOpenAPIFile)

	/** Test Routes */
	router.getAsync('/test/webhook', TestController.testWebhook)
	router.postAsync('/test/webhook', TestController.testWebhook)

	if (config.ENABLE_TEST_ENDPOINTS) {
		router.getAsync('/test/gnosis', TestController.testGnosis)
		router.getAsync('/test/testCron', TestController.testCron)
		router.getAsync('/test/syncContract', TestController.syncContract)
		router.getAsync('/test/metadata', TestController.metadata)
		router.getAsync('/test/hash', TestController.testHash)
		router.getAsync('/test/releaseLock', TestController.releaseLock)
		router.getAsync('/test/mintPKP', TestController.mintPKP)
		router.getAsync('/test/getEthAddress', TestController.getEthAddress)
		router.getAsync('/test/txEncoding', TestController.testTxEncoding)
		router.getAsync('/test/testPinata', TestController.testPinata)
		router.getAsync('/test/callback', TestController.testCallback)
		router.postAsync('/test/callback', TestController.testCallback)
		router.getAsync('/test/summary', TestController.testSummary)
	}
}
