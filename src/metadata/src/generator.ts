import { Validator } from './validator'
import { validateVersion } from './versions'

export class Generator {
	public name: string

	public version: string

	constructor(name: string, version: string) {
		validateVersion(version)

		this.name = name
		this.version = version
	}

	/**
	 * Generates valid, minfied, and ordered (alphabetized keys) schema
	 * Raises if the unordered json does not Validate against the Generator's schema
	 *
	 * @param unordered
	 */
	public generateJSON(unordered: { [key: string]: any }): string {
		// validate the schema
		const version = this.name.concat('_').concat(this.version)
		const validator = new Validator(version)
		const validated = validator.validate(unordered)
		if (!validated) {
			throw new Error(`JSON does not conform to the ${version} schema.`)
		}

		// alphabetize key
		const ordered: { [key: string]: {} } = {}
		Object.keys(unordered)
			.sort()
			.forEach(key => {
				ordered[key] = unordered[key]
			})

		return JSON.stringify(ordered) // minify
	}
}
