import { ethers } from 'ethers'
import { Pkpnft__factory } from '../types/PKPNFT'

export default class LitService {
	public static async mintPKP() {
		const provider = new ethers.providers.JsonRpcProvider(
			config.JSON_RPC_CELO,
			42220
		)

		const wallet = new ethers.Wallet(config.WALLET_PRIVATE_KEY, provider)

		const pkpNFTContract = Pkpnft__factory.connect(
			config.PKP_CONTRACT_ADDRESS,
			wallet
		)

		const tx = await pkpNFTContract.mintNext(2, {
			value: ethers.utils.parseEther(config.PKP_MINT_COST)
		})

		log.debug(`Minting PKP w/ tx: ${tx.hash}`)

		await tx.wait()

		const receipt = await provider.getTransactionReceipt(tx.hash)
		const tokenId = receipt.logs[0].topics[3]

		log.debug({ tx, tokenId })

		return { tx, tokenId }
	}
}
