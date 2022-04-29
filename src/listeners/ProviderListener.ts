import { Meem } from '@meemproject/meem-contracts'
import meemABI from '@meemproject/meem-contracts/types/Meem.json'
import { Contract, ethers, providers, utils } from 'ethers'
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

			const topicId = utils.id('MeemContractInitialized(address)')
			log.debug(`topicId: ${topicId}`)
			const meemContract = new Contract(
				MeemAPI.zeroAddress,
				meemABI
			) as unknown as Meem
			// const decode = ethers.utils.defaultAbiCoder.decode(
			// 	['address'],
			// 	'0x0000000000000000000000003fc5cdffd74d9eeebacb2a7dd94714023662abbf'
			// )

			// const result = meemContract.interface.parseLog({
			// 	data: '0x0000000000000000000000003fc5cdffd74d9eeebacb2a7dd94714023662abbf',
			// 	topics: [
			// 		'0x273c08f8f7c609a33a4029ada1508fb7e43c5e434c66274c739d21dc1bb8171f'
			// 	]
			// })
			// log.debug({ decode, result })

			this.provider.on(
				{
					topics: [topicId]
				},
				async log => {
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
							data: log.data,
							topics: log.topics
						})

						log.debug(parsedLog)

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
