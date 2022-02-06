import { Meem } from '../types'

export default class ContractListener {
	private meemContract?: Meem

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
		this.meemContract.on(
			this.meemContract.filters.Transfer(),
			(_a, _b, _c, evt) => services.contractEvents.meemHandleTransfer(evt)
		)
		// TODO: Prevent duplicate records / race condition since PropertiesSet and Transfer fires on minting
		// this.meemContract.on(
		// 	this.meemContract.filters.PropertiesSet(),
		// 	(_a, _b, _c, evt) => services.contractEvents.meemHandlePropertiesSet(evt)
		// )
		this.meemContract.on(this.meemContract.filters.SplitsSet(), (_a, _b, evt) =>
			services.contractEvents.meemHandleSplitsSet(evt)
		)
		this.meemContract.on(
			this.meemContract.filters.TotalCopiesSet(),
			(_a, _b, _c, evt) => services.contractEvents.meemHandleTotalCopiesSet(evt)
		)
		this.meemContract.on(
			this.meemContract.filters.TotalCopiesLocked(),
			(_a, _b, _c, evt) =>
				services.contractEvents.meemHandleTotalCopiesLocked(evt)
		)
		this.meemContract.on(
			this.meemContract.filters.CopiesPerWalletSet(),
			(_a, _b, _c, evt) =>
				services.contractEvents.meemHandleCopiesPerWalletSet(evt)
		)
		this.meemContract.on(
			this.meemContract.filters.CopiesPerWalletLocked(),
			(_a, _b, _c, evt) =>
				services.contractEvents.meemHandleCopiesPerWalletLocked(evt)
		)
		this.meemContract.on(
			this.meemContract.filters.TotalRemixesSet(),
			(_a, _b, _c, evt) =>
				services.contractEvents.meemHandleTotalRemixesSet(evt)
		)
		this.meemContract.on(
			this.meemContract.filters.TotalRemixesLocked(),
			(_a, _b, _c, evt) =>
				services.contractEvents.meemHandleTotalRemixesLocked(evt)
		)
		this.meemContract.on(
			this.meemContract.filters.RemixesPerWalletSet(),
			(_a, _b, _c, evt) =>
				services.contractEvents.meemHandleRemixesPerWalletSet(evt)
		)
		this.meemContract.on(
			this.meemContract.filters.RemixesPerWalletLocked(),
			(_a, _b, _c, evt) =>
				services.contractEvents.meemHandleRemixesPerWalletLocked(evt)
		)
		this.meemContract.on(
			this.meemContract.filters.PermissionsSet(),
			(_a, _b, _c, _d, evt) =>
				services.contractEvents.meemHandlePermissionsSet(evt)
		)

		log.info('Contract listeners set up')
	}
}
