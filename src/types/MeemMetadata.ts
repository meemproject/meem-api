// WIP metadata types
// TODO: Move all this to @meemproject/metadata
export interface MeemMetadata {
	metadata_type: string
	metadata_version: string // 1.0.0 or 20221111?
	name: string
	description: string
	image?: string
}

export interface MeemAgreementMetadata extends MeemMetadata {
	metadata_type: 'meem-agreement'
	metadata_version: '1.0.0'
}

export interface MeemAgreementTokenMetadata extends MeemMetadata {
	metadata_type: 'meem-agreement-token'
	metadata_version: '1.0.0'
	image: string
}

export interface MeemAgreementRoleMetadata extends MeemMetadata {
	metadata_type: 'meem-agreement-role'
	metadata_version: '1.0.0'
	agreement_address: string
}

export interface MeemAgreementRoleTokenMetadata extends MeemMetadata {
	metadata_type: 'meem-agreement-role-token'
	metadata_version: '1.0.0'
	image: string
}
export interface MeemAgreementExtensionMetadata extends MeemMetadata {
	metadata_type: 'meem-agreement-extension'
	metadata_version: '1.0.0'
	agreement_address: string
	extension_version: string
	extension_id: string
	extension_roles: {
		id: string
		name: string
		description: string
		permissions: {
			id: string
			name: string
			description: string
		}[] // Define permissions schema
	}[] // TODO: Define schema available roles for extension?
}

export interface MeemClubsForumsExtensionMetadata
	extends MeemAgreementExtensionMetadata {
	extension_id: 'wtf.meem.clubs.extensions.forums'
	extension_name: 'Meem Club Forums'
	extension_version: '1.0.0'
	extension_roles: [
		{
			id: 'editor'
			name: 'Editor'
			description: 'Editors can manage posts and create discussions.'
			permissions: [
				{
					id: 'posts.create'
					name: 'Create Posts'
					description: ''
				},
				{
					id: 'topics.create'
					name: 'Create Topics'
					description: ''
				}
			]
		}
	]
	posts_contract_address: string
	roles: {
		id: string // The extension role's id
		agreement_role_address: string // The agreement role assigned to this extension role
	}[] // TODO: Define schema available roles for extension?
}

export interface MeemAgreementRoleExtensionMetadata extends MeemMetadata {
	metadata_type: 'meem-agreement-role-extension'
	metadata_version: '1.0.0'
	agreement_address: string
	extension_version: string
	extension_id: string
	extension_name: string
}
