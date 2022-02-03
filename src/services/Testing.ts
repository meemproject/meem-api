// eslint-disable-next-line import/no-extraneous-dependencies
import faker from 'faker'
import { v4 as uuidv4 } from 'uuid'
import { MeemAPI } from '../types/meem.generated'

export default class EthersService {
	public static getIpfsUrl() {
		return `ipfs://${faker.lorem.word()}`
	}

	public static getMeemMetadata(
		metadata: Partial<MeemAPI.IMeemMetadata>
	): MeemAPI.IMeemMetadata {
		const imageUrl = this.getIpfsUrl()
		return {
			name: metadata.name ?? faker.name.firstName(),
			description: metadata.description ?? faker.lorem.paragraphs(),
			external_url: metadata.external_url ?? faker.internet.url(),
			image: metadata.image ?? imageUrl,
			image_original: metadata.image_original ?? imageUrl,
			meem_id: metadata.meem_id ?? uuidv4(),
			meem_properties: metadata.meem_properties,
			extension_properties: metadata.extension_properties
		}
	}

	public static getNFTs(): MeemAPI.IChainNFTsResult[] {
		return []
	}
}
