import { ethers } from 'ethers'
import { Pkpnft__factory } from '../types/PKPNFT'

export default class LitService {
	public static async mintPKP() {
		const { provider, wallet } = await services.ethers.getProvider({
			chainId: 80001
		})

		const pkpNFTContract = Pkpnft__factory.connect(
			config.PKP_CONTRACT_ADDRESS,
			wallet
		)

		const tx = await pkpNFTContract.mintNext(2, {
			value: ethers.utils.parseEther(config.PKP_MINT_COST)
		})

		log.debug(`Minting PKP w/ tx: ${tx.hash}`)

		await tx.wait()

		const receipt = await provider.core.getTransactionReceipt(tx.hash)

		const transferLog = receipt?.logs.find(
			l =>
				l.topics[0] ===
				'0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
		)

		const tokenId = transferLog ? transferLog.topics[3] : null

		log.debug({ tx, tokenId })
		if (!tokenId) {
			throw new Error('PKP_MINT_FAILED')
		}

		const address = await pkpNFTContract.getEthAddress(tokenId)

		return { tx, tokenId, address }
	}

	public static async getEthAddress(tokenId: string) {
		const { wallet } = await services.ethers.getProvider({
			chainId: 80001
		})

		const pkpNFTContract = Pkpnft__factory.connect(
			config.PKP_CONTRACT_ADDRESS,
			wallet
		)

		const address = await pkpNFTContract.getEthAddress(tokenId)

		return address
	}
}
