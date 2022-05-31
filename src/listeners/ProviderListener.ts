import { Meem } from '@meemproject/meem-contracts'
import {
	MeemClippedEventObject,
	MeemCopiesPerWalletLockedEventObject,
	MeemCopiesPerWalletSetEventObject,
	MeemPropertiesSetEventObject,
	MeemRemixesPerWalletLockedEventObject,
	MeemRemixesPerWalletSetEventObject,
	MeemSplitsSet_uint256_uint8_tuple_array_EventObject,
	MeemTokenReactionAddedEventObject,
	MeemTokenReactionRemovedEventObject,
	MeemTokenReactionTypesSetEventObject,
	MeemTotalCopiesLockedEventObject,
	MeemTotalCopiesSetEventObject,
	MeemTotalRemixesLockedEventObject,
	MeemTotalRemixesSetEventObject,
	MeemTransferEventObject,
	MeemUnClippedEventObject
} from '@meemproject/meem-contracts/dist/types/Meem'
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

			const genericMeemContract = new Contract(
				MeemAPI.zeroAddress,
				meemABI
			) as unknown as Meem

			// const eventNames = Object.keys(genericMeemContract.interface.events)

			// See genericMeemContract.interface.events for all available events
			// genericMeemContract.interface.events
			const eventIds = {
				MeemContractInitialized: utils.id('MeemContractInitialized(address)'),
				MeemTransfer: utils.id('MeemTransfer(address,address,uint256)'),
				MeemPropertiesSet: utils.id('MeemPropertiesSet(uint256,uint8,tuple)'),
				MeemSplitsSet: utils.id('MeemSplitsSet(uint256,uint8,tuple[])'),
				MeemTotalCopiesSet: utils.id(
					'MeemTotalCopiesSet(uint256,uint8,int256)'
				),
				MeemTotalCopiesLocked: utils.id(
					'MeemTotalCopiesLocked(uint256,uint8,address)'
				),
				MeemCopiesPerWalletLocked: utils.id(
					'MeemCopiesPerWalletLocked(uint256,uint8,address)'
				),
				MeemCopiesPerWalletSet: utils.id(
					'MeemCopiesPerWalletSet(uint256,uint8,int256)'
				),
				MeemTotalRemixesLocked: utils.id(
					'MeemTotalRemixesLocked(uint256,uint8,address)'
				),
				MeemTotalRemixesSet: utils.id(
					'MeemTotalRemixesSet(uint256,uint8,int256)'
				),
				MeemRemixesPerWalletLocked: utils.id(
					'MeemRemixesPerWalletLocked(uint256,uint8,address)'
				),
				MeemRemixesPerWalletSet: utils.id(
					'MeemRemixesPerWalletSet(uint256,uint8,int256)'
				),
				MeemTokenReactionAdded: utils.id(
					'MeemTokenReactionAdded(uint256,address,string,uint256)'
				),
				MeemTokenReactionRemoved: utils.id(
					'MeemTokenReactionRemoved(uint256,address,string,uint256)'
				),
				MeemTokenReactionTypesSet: utils.id(
					'MeemTokenReactionTypesSet(uint256,string[])'
				),
				MeemClipped: utils.id('MeemClipped(uint256,address)'),
				MeemUnClipped: utils.id('MeemUnClipped(uint256,address)')
			}

			const topics = [Object.values(eventIds)]

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

						const block = await this.provider?.getBlock(rawLog.blockHash)

						const parsedLog = genericMeemContract.interface.parseLog({
							data: rawLog.data,
							topics: rawLog.topics
						})

						log.debug(parsedLog)

						const eventData =
							parsedLog.args as unknown as MeemTransferEventObject

						switch (parsedLog.topic) {
							case eventIds.MeemContractInitialized: {
								await services.contractEvents.meemHandleContractInitialized({
									address: rawLog.address
								})
								break
							}
							case eventIds.MeemTransfer: {
								await services.contractEvents.meemHandleTransfer({
									address: rawLog.address,
									transactionHash: rawLog.transactionHash,
									transactionTimestamp:
										block?.timestamp || DateTime.now().toSeconds(),
									eventData: eventData as unknown as MeemTransferEventObject
								})
								break
							}
							case eventIds.MeemPropertiesSet: {
								await services.contractEvents.meemHandlePropertiesSet({
									address: rawLog.address,
									eventData:
										eventData as unknown as MeemPropertiesSetEventObject
								})
								break
							}
							case eventIds.MeemSplitsSet: {
								await services.contractEvents.meemHandleSplitsSet({
									address: rawLog.address,
									eventData:
										eventData as unknown as MeemSplitsSet_uint256_uint8_tuple_array_EventObject
								})
								break
							}
							case eventIds.MeemTotalCopiesSet: {
								await services.contractEvents.meemHandleTotalCopiesSet({
									address: rawLog.address,
									eventData:
										eventData as unknown as MeemTotalCopiesSetEventObject
								})
								break
							}
							case eventIds.MeemTotalCopiesLocked: {
								await services.contractEvents.meemHandleTotalCopiesLocked({
									address: rawLog.address,
									eventData:
										eventData as unknown as MeemTotalCopiesLockedEventObject
								})
								break
							}
							case eventIds.MeemCopiesPerWalletLocked: {
								await services.contractEvents.meemHandleCopiesPerWalletLocked({
									address: rawLog.address,
									eventData:
										eventData as unknown as MeemCopiesPerWalletLockedEventObject
								})
								break
							}
							case eventIds.MeemCopiesPerWalletSet: {
								await services.contractEvents.meemHandleCopiesPerWalletSet({
									address: rawLog.address,
									eventData:
										eventData as unknown as MeemCopiesPerWalletSetEventObject
								})
								break
							}
							case eventIds.MeemTotalRemixesLocked: {
								await services.contractEvents.meemHandleTotalRemixesLocked({
									address: rawLog.address,
									eventData:
										eventData as unknown as MeemTotalRemixesLockedEventObject
								})
								break
							}
							case eventIds.MeemTotalRemixesSet: {
								await services.contractEvents.meemHandleTotalRemixesSet({
									address: rawLog.address,
									eventData:
										eventData as unknown as MeemTotalRemixesSetEventObject
								})
								break
							}
							case eventIds.MeemRemixesPerWalletLocked: {
								await services.contractEvents.meemHandleRemixesPerWalletLocked({
									address: rawLog.address,
									eventData:
										eventData as unknown as MeemRemixesPerWalletLockedEventObject
								})
								break
							}
							case eventIds.MeemRemixesPerWalletSet: {
								await services.contractEvents.meemHandleRemixesPerWalletSet({
									address: rawLog.address,
									eventData:
										eventData as unknown as MeemRemixesPerWalletSetEventObject
								})
								break
							}
							case eventIds.MeemTokenReactionAdded: {
								await services.contractEvents.meemHandleTokenReactionAdded({
									address: rawLog.address,
									transactionTimestamp:
										block?.timestamp || DateTime.now().toSeconds(),
									eventData:
										eventData as unknown as MeemTokenReactionAddedEventObject
								})
								break
							}
							case eventIds.MeemTokenReactionRemoved: {
								await services.contractEvents.meemHandleTokenReactionRemoved({
									address: rawLog.address,
									eventData:
										eventData as unknown as MeemTokenReactionRemovedEventObject
								})
								break
							}
							case eventIds.MeemTokenReactionTypesSet: {
								await services.contractEvents.meemHandleTokenReactionTypesSet({
									address: rawLog.address,
									eventData:
										eventData as unknown as MeemTokenReactionTypesSetEventObject
								})
								break
							}
							case eventIds.MeemClipped: {
								await services.contractEvents.meemHandleTokenClipped({
									address: rawLog.address,
									transactionTimestamp:
										block?.timestamp || DateTime.now().toSeconds(),
									eventData: eventData as unknown as MeemClippedEventObject
								})
								break
							}
							case eventIds.MeemUnClipped: {
								await services.contractEvents.meemHandleTokenUnClipped({
									address: rawLog.address,
									eventData: eventData as unknown as MeemUnClippedEventObject
								})
								break
							}
							default:
								break
						}

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
