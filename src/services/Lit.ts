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
		const tokenId = receipt?.logs[0].topics[3]

		log.debug({ tx, tokenId })

		return { tx, tokenId }
	}
}
