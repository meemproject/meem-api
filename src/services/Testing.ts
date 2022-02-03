import type Faker from 'faker'
import { UserV1 } from 'twitter-api-v2'
import { v4 as uuidv4 } from 'uuid'
import { MeemAPI } from '../types/meem.generated'

export default class EthersService {
	public static shouldInitialize = true

	private faker!: typeof Faker

	public constructor() {
		if (config.TESTING) {
			// eslint-disable-next-line
			this.faker = require('faker')
		}
	}

	public getIpfsUrl() {
		return `ipfs://${this.faker.lorem.word()}`
	}

	public getMeemMetadata(
		metadata: Partial<MeemAPI.IMeemMetadata>
	): MeemAPI.IMeemMetadata {
		const imageUrl = this.getIpfsUrl()
		return {
			name: metadata.name ?? this.faker.name.firstName(),
			description: metadata.description ?? this.faker.lorem.paragraphs(),
			external_url: metadata.external_url ?? this.faker.internet.url(),
			image: metadata.image ?? imageUrl,
			image_original: metadata.image_original ?? imageUrl,
			meem_id: metadata.meem_id ?? uuidv4(),
			meem_properties: metadata.meem_properties,
			extension_properties: metadata.extension_properties
		}
	}

	public getNFTs(): MeemAPI.IChainNFTsResult[] {
		return []
	}

	public getTwitterUserV1(): UserV1 {
		return {
			id_str: uuidv4(),
			id: this.faker.datatype.number(),
			name: this.faker.name.firstName(),
			screen_name: this.faker.name.firstName(),
			location: this.faker.random.locale(),
			// derived?: any;
			url: null,
			description: null,
			protected: false,
			verified: false,
			followers_count: this.faker.datatype.number(),
			friends_count: this.faker.datatype.number(),
			listed_count: this.faker.datatype.number(),
			favourites_count: this.faker.datatype.number(),
			statuses_count: this.faker.datatype.number(),
			created_at: this.faker.date.past().toString(),
			profile_banner_url: this.faker.internet.url(),
			profile_image_url_https: this.faker.internet.url(),
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
