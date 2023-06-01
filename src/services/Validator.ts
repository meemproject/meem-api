import { promises as fs } from 'fs'
import path from 'path'
import globby from 'globby'
import { Validator as JsonValidator, ValidatorResult } from 'jsonschema'

export default class Validator {
	public static shouldInitialize = true

	public jsonValidator: JsonValidator

	public schemas: {
		[schemaName: string]: Record<string, any>
	} = {}

	public constructor() {
		this.jsonValidator = new JsonValidator()
		this.loadSchemas()
	}

	// public validate(options: { schema: string; data: any }): ValidatorResult {
	// 	const { schema, data } = options
	// 	console.log(this.schemas)
	// 	return this.jsonValidator.validate(data, this.schemas[schema])
	// }

	public validate(options: { schemaName: string; data: any }): ValidatorResult {
		const { schemaName, data } = options
		// const jsonValidator = new JsonValidator()
		// const schema = require(path.join(
		// 	process.cwd(),
		// 	'src/schemas',
		// 	`/${schemaName}.schema.json`
		// ))
		const schema = this.schemas[schemaName]
		// const id = schema.$id
		// delete schema.$id
		// jsonValidator.addSchema(schema)
		// function importNextSchema() {
		// 	const nextSchema = jsonValidator.unresolvedRefs.shift()
		// 	if (!nextSchema) {
		// 		return
		// 	}
		// 	// const s = require(`../schemas${nextSchema}`)
		// 	console.log({ nextSchema })
		// 	const s = require(path.join(
		// 		process.cwd(),
		// 		'src/schemas',
		// 		`${nextSchema}`
		// 	))
		// 	jsonValidator.addSchema(s)
		// }
		// for (let i = 0; i < jsonValidator.unresolvedRefs.length; i += 1) {
		// 	importNextSchema()
		// }
		return this.jsonValidator.validate(data, schema, {
			nestedErrors: true,
			required: true,
			allowUnknownAttributes: false,
			skipAttributes: ['$comment']
		})
	}

	private async loadSchemas() {
		const schemaPaths = await globby(
			path.join(process.cwd(), 'src/schemas/*.json')
		)
		const schemas = await Promise.all(
			schemaPaths.map(async p => {
				const schema = await fs.readFile(p, 'utf-8')
				const name = p.split('/').pop()?.split('.')[0] ?? ''
				return {
					name,
					schema: JSON.parse(schema)
				}
			})
		)
		Object.values(schemas).forEach(s => {
			const id = s.schema.$id
			delete s.schema.$id
			delete s.schema.$comment
			const newSchema = { ...s.schema, id }
			this.schemas[s.name] = newSchema
			this.jsonValidator.addSchema(newSchema, id.toLowerCase())
		})
	}
}
