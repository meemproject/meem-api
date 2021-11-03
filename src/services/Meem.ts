import { ethers } from 'ethers'
import MeemABI from '../abis/Meem.json'
import { Meem } from '../types'

export default class MeemService {
	/** Get a Meem contract instance */
	public static meemContract() {
		const provider = new ethers.providers.InfuraProvider(
			config.NETWORK,
			config.INFURA_ID
		)
		const wallet = new ethers.Wallet(config.WALLET_PRIVATE_KEY, provider)

		const meemContract = new ethers.Contract(
			config.MEEM_PROXY_ADDRESS,
			MeemABI,
			wallet
		) as Meem

		return meemContract
	}
}
