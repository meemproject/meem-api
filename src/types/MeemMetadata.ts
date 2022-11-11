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
	name: string
	agreement_address: string
	extension_version: string
	extension_id: string
}

export interface MeemClubsForumsExtensionMetadata
	extends MeemAgreementExtensionMetadata {
	extension_id: 'wtf.meem.clubs.extensions.forums'
	extension_name: 'Meem Club Forums'
	extension_version: '1.0.0'
	posts_contract_address: string
}

export interface MeemAgreementRoleExtensionMetadata extends MeemMetadata {
	metadata_type: 'meem-agreement-role-extension'
	metadata_version: '1.0.0'
	agreement_address: string
	extension_version: string
	extension_id: string
	extension_name: string
}
