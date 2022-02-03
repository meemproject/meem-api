// eslint-disable-next-line import/no-extraneous-dependencies
import faker from 'faker'
import { UserV1 } from 'twitter-api-v2'
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

	public static getTwitterUserV1(): UserV1 {
		return {
			id_str: uuidv4(),
			id: faker.datatype.number(),
			name: faker.name.firstName(),
			screen_name: faker.name.firstName(),
			location: faker.random.locale(),
			// derived?: any;
			url: null,
			description: null,
			protected: false,
			verified: false,
			followers_count: faker.datatype.number(),
			friends_count: faker.datatype.number(),
			listed_count: faker.datatype.number(),
			favourites_count: faker.datatype.number(),
			statuses_count: faker.datatype.number(),
			created_at: faker.date.past().toString(),
			profile_banner_url: faker.internet.url(),
			profile_image_url_https: faker.internet.url(),
			default_profile: true,
			default_profile_image: true,
			withheld_in_countries: [],
			withheld_scope: ''
			// entities?: UserEntitiesV1;
			/** Only on account/verify_credentials with include_email: true */
			// email?: string;
		}
	}
}
