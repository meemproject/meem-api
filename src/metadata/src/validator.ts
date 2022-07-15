import { Validator as JsonValidator } from 'jsonschema'
import { validateVersion } from './versions'

export class Validator {
	public name: string

	public version: string

	constructor(version: string) {
		// require version <name>_<version>
		validateVersion(version)

		const [name, version] = version.split('_')
		this.name = name
		this.version = version
	}

	/**
	 * Validates the passed json against the Validator's schema
	 *
	 * @param json
	 */
	public validate(json: { [key: string]: any }): boolean {
		const jsonValidator = new JsonValidator()
		const schema = require(`../schemas/${this.name}/${this.version}.json`)
		return jsonValidator.validate(json, schema).valid
	}
}
s
