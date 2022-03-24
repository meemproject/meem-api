import { Meem } from '../types'

export default class ContractListener {
	private meemContract?: Meem

	private hasSetupListners = false

	public async start() {
		this.meemContract = await services.meem.getMeemContract()
		this.setupListners()
			.then(() => {})
			.catch(e => {
				log.crit(e)
			})
	}

	private async setupListners() {
		if (!this.meemContract) {
			log.crit("ContractListener can't listen. Meem contract not defined")
			return
		}
		if (this.hasSetupListners) {
			log.warn('ContractListener has already setup listners')
		}
		this.meemContract.on(
			this.meemContract.filters.Transfer(),
			async (_a, _b, _c, evt) => {
				try {
					await services.contractEvents.meemHandleTransfer(evt)
				} catch (e) {
					log.crit(e)
				}
			}
		)
		// TODO: Prevent duplicate records / race condition since PropertiesSet and Transfer fires on minting
		this.meemContract.on(
			this.meemContract.filters.PropertiesSet(),
			async (_a, _b, _c, evt) => {
				try {
					await services.contractEvents.meemHandlePropertiesSet(evt)
				} catch (e) {
					log.crit(e)
				}
			}
		)
		this.meemContract.on(
			this.meemContract.filters.SplitsSet(),
			async (_a, _b, _c, evt) => {
				try {
					await services.contractEvents.meemHandleSplitsSet(evt)
				} catch (e) {
					log.crit(e)
				}
			}
		)
		this.meemContract.on(
			this.meemContract.filters.TotalCopiesSet(),
			async (_a, _b, _c, evt) => {
				try {
					await services.contractEvents.meemHandleTotalCopiesSet(evt)
				} catch (e) {
					log.crit(e)
				}
			}
		)
		this.meemContract.on(
			this.meemContract.filters.TotalCopiesLocked(),
			async (_a, _b, _c, evt) => {
				try {
					await services.contractEvents.meemHandleTotalCopiesLocked(evt)
				} catch (e) {
					log.crit(e)
				}
			}
		)
		this.meemContract.on(
			this.meemContract.filters.CopiesPerWalletSet(),
			async (_a, _b, _c, evt) => {
				try {
					await services.contractEvents.meemHandleCopiesPerWalletSet(evt)
				} catch (e) {
					log.crit(e)
				}
			}
		)
		this.meemContract.on(
			this.meemContract.filters.CopiesPerWalletLocked(),
			async (_a, _b, _c, evt) => {
				try {
					await services.contractEvents.meemHandleCopiesPerWalletLocked(evt)
				} catch (e) {
					log.crit(e)
				}
			}
		)
		this.meemContract.on(
			this.meemContract.filters.TotalRemixesSet(),
			async (_a, _b, _c, evt) => {
				try {
					await services.contractEvents.meemHandleTotalRemixesSet(evt)
				} catch (e) {
					log.crit(e)
				}
			}
		)
		this.meemContract.on(
			this.meemContract.filters.TotalRemixesLocked(),
			async (_a, _b, _c, evt) => {
				try {
					await services.contractEvents.meemHandleTotalRemixesLocked(evt)
				} catch (e) {
					log.crit(e)
				}
			}
		)
		this.meemContract.on(
			this.meemContract.filters.RemixesPerWalletSet(),
			async (_a, _b, _c, evt) => {
				try {
					await services.contractEvents.meemHandleRemixesPerWalletSet(evt)
				} catch (e) {
					log.crit(e)
				}
			}
		)
		this.meemContract.on(
			this.meemContract.filters.RemixesPerWalletLocked(),
			async (_a, _b, _c, evt) => {
				try {
					await services.contractEvents.meemHandleRemixesPerWalletLocked(evt)
				} catch (e) {
					log.crit(e)
				}
			}
		)
		this.meemContract.on(
			this.meemContract.filters.PermissionsSet(),
			async (_a, _b, _c, _d, evt) => {
				try {
					await services.contractEvents.meemHandlePermissionsSet(evt)
				} catch (e) {
					log.crit(e)
				}
			}
		)

		this.meemContract.on(
			this.meemContract.filters.TokenClipped(),
			async (_a, _b, evt) => {
				try {
					await services.contractEvents.meemHandleTokenClipped(evt)
				} catch (e) {
					log.crit(e)
				}
			}
		)

		this.meemContract.on(
			this.meemContract.filters.TokenUnClipped(),
			async (_a, _b, evt) => {
				try {
					await services.contractEvents.meemHandleTokenUnClipped(evt)
				} catch (e) {
					log.crit(e)
				}
			}
		)

		this.meemContract.on(
			this.meemContract.filters.TokenReactionAdded(),
			async (_a, _b, _c, _d, evt) => {
				try {
					await services.contractEvents.meemHandleTokenReactionAdded(evt)
				} catch (e) {
					log.crit(e)
				}
			}
		)

		this.meemContract.on(
			this.meemContract.filters.TokenReactionRemoved(),
			async (_a, _b, _c, _d, evt) => {
				try {
					await services.contractEvents.meemHandleTokenReactionRemoved(evt)
				} catch (e) {
					log.crit(e)
				}
			}
		)

		this.meemContract.on(
			this.meemContract.filters.TokenReactionTypesSet(),
			async (_a, _b, evt) => {
				try {
					await services.contractEvents.meemHandleTokenReactionTypesSet(evt)
				} catch (e) {
					log.crit(e)
				}
			}
		)

		this.hasSetupListners = true
		log.info('Contract listeners set up')
	}
}
