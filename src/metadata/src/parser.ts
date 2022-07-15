import { MetadataLike } from '../types/types'
import { validateVersion } from './versions'

export class Parser {
	public name: string

	public version: string

	constructor(version: string) {
		validateVersion(version)

		const [name, version] = version.split('_')
		this.name = name
		this.version = version
	}

	/**
	 * Parses the JSON string
	 *
	 * @param json
	 */
	public parse(json: string): MetadataLike {
		const parsed: MetadataLike = JSON.parse(json)
		return parsed
	}
}
