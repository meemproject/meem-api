import coreExpress, { Express } from 'express'
import AgreementController from '../controllers/AgreementController'
import AgreementRoleController from '../controllers/AgreementRoleController'
import ConfigController from '../controllers/ConfigController'
import DiscordController from '../controllers/DiscordController'
import EPMController from '../controllers/EPMController'
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

	router.postAsync(
		'/acceptInvite',
		userLoggedInPolicy,
		AgreementController.acceptInvite
	)
	router.postAsync('/agreements', AgreementController.createAgreement)
	router.postAsync(
		'/agreements/isSlugAvailable',
		AgreementController.isSlugAvailable
	)
	router.postAsync(
		'/agreements/:agreementId/invite',
		userLoggedInPolicy,
		AgreementController.sendInvites
	)
	router.postAsync(
		'/agreements/:agreementId/reinitialize',
		AgreementController.reInitialize
	)
	router.patchAsync(
		'/agreements/:agreementId',
		AgreementController.updateAgreement
	)
	router.patchAsync(
		'/agreements/:agreementId/safe',
		AgreementController.setAgreementSafeAddress
	)
	router.postAsync(
		'/agreements/:agreementId/bulkMint',
		AgreementController.bulkMint
	)
	router.postAsync(
		'/agreements/:agreementId/bulkBurn',
		userLoggedInPolicy,
		AgreementController.bulkBurn
	)
	router.getAsync(
		'/agreements/:agreementId/proof',
		AgreementController.getMintingProof
	)
	router.getAsync(
		'/agreements/:agreementId/isAdmin',
		AgreementController.checkIsAgreementAdmin
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
	router.postAsync('/generateTypes', TypesController.generateTypes)
	router.getAsync('/meem-api.json', TypesController.getOpenAPIFile)

	/** Test Routes */
	router.getAsync('/test/webhook', TestController.testWebhook)
	router.postAsync('/test/webhook', TestController.testWebhook)

	if (config.ENABLE_TEST_ENDPOINTS) {
		router.getAsync('/test/email', TestController.testEmail)
		router.getAsync('/test/emailHtml', TestController.testEmailHtml)
	}
}
