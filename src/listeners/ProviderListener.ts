import { Meem } from '@meemproject/meem-contracts'
import meemABI from '@meemproject/meem-contracts/types/Meem.json'
import { Contract, providers, utils } from 'ethers'
import { DateTime } from 'luxon'
// import {} from '@meemproject/meem-contracts'
import { MeemAPI } from '../types/meem.generated'

export default class ProviderListener {
	private provider?: providers.Provider

	private hasSetupListners = false

	public async start() {
		// const meemContract = await services.meem.getMeemContract()
		// meemContract.filters.Crea
		this.provider = await services.ethers.getProvider({
			networkName: MeemAPI.NetworkName.Rinkeby
		})
		this.setupListners()
			.then(() => {})
			.catch(e => {
				log.crit(e)
			})
	}

	private async setupListners() {
		try {
			if (!this.provider) {
				log.crit("ProviderListener can't listen. Provider not defined")
				return
			}
			if (this.hasSetupListners) {
				log.warn('ProviderListener has already setup listners')
				return
			}
			// this.provider.on('block', async blockNumber => {
			// 	try {
			// 		console.log(`Block: ${blockNumber}`)
			// 	} catch (e) {
			// 		log.crit(e)
			// 	}
			// })

			const meemContract = new Contract(
				MeemAPI.zeroAddress,
				meemABI
			) as unknown as Meem

			// const eventNames = Object.keys(meemContract.interface.events)

			// See meemContract.interface.events for all available events
			const topics = [utils.id('MeemContractInitialized(address)')]

			this.provider.on(
				{
					topics
				},
				async rawLog => {
					try {
						/*
						TODO: Handle log - get transaction, find the contract address, add the contract address to our DB of contracts that we listen for
						log = {
							blockNumber: 10583485,
							blockHash: '0x7a918ddd1c5ff6ef5ddd72a789452d86da85a91a1824529e2ac6c94e09d3dcbf',
							transactionIndex: 49,
							removed: false,
							address: '0x3FC5cDffD74d9EeebAcB2A7dd94714023662abbf',
							data: '0x0000000000000000000000003fc5cdffd74d9eeebacb2a7dd94714023662abbf',
							topics: [
							  '0x273c08f8f7c609a33a4029ada1508fb7e43c5e434c66274c739d21dc1bb8171f'
							],
							transactionHash: '0x272cafd2ad24cbf36af4a1c2b8756e9ebb83b928640b41ef1021e3dbd853930f',
							logIndex: 87
						}
						*/

						const parsedLog = meemContract.interface.parseLog({
							data: rawLog.data,
							topics: rawLog.topics
						})

						log.debug(parsedLog)

						await orm.models.MeemContract.create({
							address: rawLog.address,
							totalOriginalsSupply: 10,
							totalOriginalsSupplyLockedBy: MeemAPI.zeroAddress,
							mintPermissions: [],
							mintPermissionsLockedBy: MeemAPI.zeroAddress,
							splits: [
								{
									toAddress: config.DAO_WALLET,
									amount: 100,
									lockedBy: MeemAPI.zeroAddress
								}
							],
							splitsLockedBy: MeemAPI.zeroAddress,
							originalsPerWallet: 0,
							originalsPerWalletLockedBy: MeemAPI.zeroAddress,
							isTransferrable: true,
							isTransferrableLockedBy: MeemAPI.zeroAddress,
							mintStartTimestamp: DateTime.now().toSeconds().toFixed(0),
							mintEndTimestamp: '',
							mintDatesLockedBy: MeemAPI.zeroAddress
						})

						/*
							Handle parsed data

						  parsedLog = {
							eventFragment: {
							  name: 'MeemContractInitialized',
							  anonymous: false,
							  inputs: [Array],
							  type: 'event',
							  _isFragment: true,
							  constructor: [Function],
							  format: [Function (anonymous)]
							},
							name: 'MeemContractInitialized',
							signature: 'MeemContractInitialized(address)',
							topic: '0x273c08f8f7c609a33a4029ada1508fb7e43c5e434c66274c739d21dc1bb8171f',
							args: [
							  '0x3FC5cDffD74d9EeebAcB2A7dd94714023662abbf',
							  contractAddress: '0x3FC5cDffD74d9EeebAcB2A7dd94714023662abbf'
							]
						  }
						*/
					} catch (e) {
						log.crit(e)
					}
				}
			)

			this.hasSetupListners = true
			log.info('ProviderListener set up')
		} catch (e) {
			log.crit(e)
		}
	}
}
