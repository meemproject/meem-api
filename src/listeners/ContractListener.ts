import { Meem } from '../types'

export default class ContractListener {
	private meemContract?: Meem

	public async start() {
		this.meemContract = services.meem.meemContract()
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
		this.meemContract.on(
			this.meemContract.filters.PropertiesSet(),
			(_a, _b, _c, evt) => services.contractEvents.meemHandlePropertiesSet(evt)
		)
		this.meemContract.on(this.meemContract.filters.SplitsSet(), (_a, _b, evt) =>
			services.contractEvents.meemHandleSplitsSet(evt)
		)
		this.meemContract.on(
			this.meemContract.filters.TotalChildrenSet(),
			(_a, _b, evt) => services.contractEvents.meemHandleTotalChildrenSet(evt)
		)
		this.meemContract.on(
			this.meemContract.filters.TotalChildrenLocked(),
			(_a, _b, evt) =>
				services.contractEvents.meemHandleTotalChildrenLocked(evt)
		)
		this.meemContract.on(
			this.meemContract.filters.ChildrenPerWalletSet(),
			(_a, _b, evt) =>
				services.contractEvents.meemHandleChildrenPerWalletSet(evt)
		)
		this.meemContract.on(
			this.meemContract.filters.ChildrenPerWalletLocked(),
			(_a, _b, evt) =>
				services.contractEvents.meemHandleChildrenPerWalletLocked(evt)
		)
		this.meemContract.on(
			this.meemContract.filters.PermissionsSet(),
			(_a, _b, _c, _d, evt) =>
				services.contractEvents.meemHandlePermissionsSet(evt)
		)

		log.info('Contract listeners set up')
	}
}
