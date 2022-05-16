import { Meem } from '@meemproject/meem-contracts'
import {
	BasePropertiesStructOutput,
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
import ContractEvent from '../services/ContractEvents'
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

						const meemContract = (await services.meem.getMeemContract({
							address: rawLog.address
						})) as unknown as Meem

						const eventData =
							parsedLog.args as unknown as MeemTransferEventObject

						switch (parsedLog.topic) {
							case eventIds.MeemContractInitialized: {
								const baseProperties: BasePropertiesStructOutput =
									await meemContract.getBaseProperties()

								log.debug(baseProperties)

								const meemContractData = {
									address: rawLog.address,
									totalOriginalsSupply:
										baseProperties.totalOriginalsSupply.toHexString(),
									totalOriginalsSupplyLockedBy:
										baseProperties.totalOriginalsSupplyLockedBy,
									mintPermissions: baseProperties.mintPermissions.map(p => ({
										permission: p.permission,
										addresses: p.addresses,
										numTokens: p.numTokens.toHexString(),
										lockedBy: p.lockedBy,
										costWei: p.costWei.toHexString()
									})),
									mintPermissionsLockedBy:
										baseProperties.mintPermissionsLockedBy,
									splits: baseProperties.splits.map(s => ({
										toAddress: s.toAddress,
										amount: s.amount.toNumber(),
										lockedBy: s.lockedBy
									})),
									splitsLockedBy: baseProperties.splitsLockedBy,
									originalsPerWallet:
										baseProperties.originalsPerWallet.toHexString(),
									originalsPerWalletLockedBy:
										baseProperties.originalsPerWalletLockedBy,
									isTransferrable: baseProperties.isTransferrable,
									isTransferrableLockedBy:
										baseProperties.isTransferrableLockedBy,
									mintStartTimestamp:
										baseProperties.mintStartTimestamp.toHexString(),
									mintEndTimestamp:
										baseProperties.mintEndTimestamp.toHexString(),
									mintDatesLockedBy: baseProperties.mintDatesLockedBy,
									transferLockupUntil:
										baseProperties.transferLockupUntil.toHexString(),
									transferLockupUntilLockedBy:
										baseProperties.transferLockupUntilLockedBy
								}

								await orm.models.MeemContract.create(meemContractData)
								break
							}
							case eventIds.MeemTransfer: {
								await ContractEvent.meemHandleTransfer({
									address: rawLog.address,
									transactionHash: rawLog.transactionHash,
									transactionTimestamp:
										block?.timestamp || DateTime.now().toSeconds(),
									eventData: eventData as unknown as MeemTransferEventObject
								})
								break
							}
							case eventIds.MeemPropertiesSet: {
								await ContractEvent.meemHandlePropertiesSet({
									address: rawLog.address,
									eventData:
										eventData as unknown as MeemPropertiesSetEventObject
								})
								break
							}
							case eventIds.MeemSplitsSet: {
								await ContractEvent.meemHandleSplitsSet({
									address: rawLog.address,
									eventData:
										eventData as unknown as MeemSplitsSet_uint256_uint8_tuple_array_EventObject
								})
								break
							}
							case eventIds.MeemTotalCopiesSet: {
								await ContractEvent.meemHandleTotalCopiesSet({
									address: rawLog.address,
									eventData:
										eventData as unknown as MeemTotalCopiesSetEventObject
								})
								break
							}
							case eventIds.MeemTotalCopiesLocked: {
								await ContractEvent.meemHandleTotalCopiesLocked({
									address: rawLog.address,
									eventData:
										eventData as unknown as MeemTotalCopiesLockedEventObject
								})
								break
							}
							case eventIds.MeemCopiesPerWalletLocked: {
								await ContractEvent.meemHandleCopiesPerWalletLocked({
									address: rawLog.address,
									eventData:
										eventData as unknown as MeemCopiesPerWalletLockedEventObject
								})
								break
							}
							case eventIds.MeemCopiesPerWalletSet: {
								await ContractEvent.meemHandleCopiesPerWalletSet({
									address: rawLog.address,
									eventData:
										eventData as unknown as MeemCopiesPerWalletSetEventObject
								})
								break
							}
							case eventIds.MeemTotalRemixesLocked: {
								await ContractEvent.meemHandleTotalRemixesLocked({
									address: rawLog.address,
									eventData:
										eventData as unknown as MeemTotalRemixesLockedEventObject
								})
								break
							}
							case eventIds.MeemTotalRemixesSet: {
								await ContractEvent.meemHandleTotalRemixesSet({
									address: rawLog.address,
									eventData:
										eventData as unknown as MeemTotalRemixesSetEventObject
								})
								break
							}
							case eventIds.MeemRemixesPerWalletLocked: {
								await ContractEvent.meemHandleRemixesPerWalletLocked({
									address: rawLog.address,
									eventData:
										eventData as unknown as MeemRemixesPerWalletLockedEventObject
								})
								break
							}
							case eventIds.MeemRemixesPerWalletSet: {
								await ContractEvent.meemHandleRemixesPerWalletSet({
									address: rawLog.address,
									eventData:
										eventData as unknown as MeemRemixesPerWalletSetEventObject
								})
								break
							}
							case eventIds.MeemTokenReactionAdded: {
								await ContractEvent.meemHandleTokenReactionAdded({
									address: rawLog.address,
									transactionTimestamp:
										block?.timestamp || DateTime.now().toSeconds(),
									eventData:
										eventData as unknown as MeemTokenReactionAddedEventObject
								})
								break
							}
							case eventIds.MeemTokenReactionRemoved: {
								await ContractEvent.meemHandleTokenReactionRemoved({
									address: rawLog.address,
									eventData:
										eventData as unknown as MeemTokenReactionRemovedEventObject
								})
								break
							}
							case eventIds.MeemTokenReactionTypesSet: {
								await ContractEvent.meemHandleTokenReactionTypesSet({
									address: rawLog.address,
									eventData:
										eventData as unknown as MeemTokenReactionTypesSetEventObject
								})
								break
							}
							case eventIds.MeemClipped: {
								await ContractEvent.meemHandleTokenClipped({
									address: rawLog.address,
									transactionTimestamp:
										block?.timestamp || DateTime.now().toSeconds(),
									eventData: eventData as unknown as MeemClippedEventObject
								})
								break
							}
							case eventIds.MeemUnClipped: {
								await ContractEvent.meemHandleTokenUnClipped({
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
