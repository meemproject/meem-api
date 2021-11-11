import path from 'path'
import fs from 'fs-extra'
import globby from 'globby'
import lintConfig from '../types/.eslintrc'

export default class TypesService {
	/** Creates the generated types file */
	public static async generateTypesFile(): Promise<void> {
		const { allTypes } = await this.getSharedTypes()
		const { allTypesPath } = this.getSharedTypesPaths()

		// Get eslint headers
		let header = ''
		Object.keys(lintConfig.rules).forEach(rule => {
			// @ts-ignore
			if (lintConfig.rules[rule] === 0) {
				header += `/* eslint-disable ${rule} */\n`
			}
		})

		await Promise.all([fs.writeFile(allTypesPath, header + allTypes)])

		await Promise.all([services.lint.fix(allTypesPath)])
	}

	/** Gets type definitions shared by the API. This can be written to a file */
	public static async getSharedTypes(): Promise<{
		allTypes: string
	}> {
		const sharedTypesGlob = path.join(process.cwd(), 'src/types/shared/**/*.ts')
		const endpointsGlob = path.join(
			process.cwd(),
			'src/types/shared/api/**/*.ts'
		)
		const eventsGlob = path.join(
			process.cwd(),
			'src/types/shared/events/**/*.ts'
		)

		const [files, endpointFiles, eventsFiles] = await Promise.all([
			globby(sharedTypesGlob, {
				ignore: [endpointsGlob, eventsGlob]
			}),
			globby(endpointsGlob),
			globby(eventsGlob)
		])

		const [types, endpointTypes, eventTypes] = await Promise.all([
			Promise.all(files.map(f => this.parseTypes(f))),
			Promise.all(endpointFiles.map(f => this.parseTypes(f))),
			Promise.all(eventsFiles.map(f => this.parseTypes(f)))
		])

		const eventDefinitions: string[] = []
		const eventNamespaces: string[] = []
		const eventListeners: string[] = []
		const generatedEventTypes: string[] = []
		eventTypes.forEach(eventType => {
			const matches = eventType.match(/namespace (\w+)/)
			if (matches && matches[1]) {
				const namespace = matches[1]
				eventNamespaces.push(namespace)
				const eventName = `${namespace
					.charAt(0)
					.toLowerCase()}${namespace.slice(1)}`
				eventDefinitions.push(`${namespace} = '${eventName}',`)
				generatedEventTypes.push(
					eventType.replace(
						/export namespace (\w+) {([.\n]*)/,
						`export namespace $1 {\nexport const eventName = MeemEvent.${namespace}\n $2`
					)
				)
			}
		})
		const subscribeTypes: string[] = []
		eventNamespaces.forEach(ns => {
			if (!['Subscribe', 'Unsubscribe'].includes(ns)) {
				subscribeTypes.push(
					`(Events.${ns}.ISubscribePayload & { type: MeemEvent.${ns} })`
				)
			}
		})

		eventNamespaces.forEach(ns => {
			if (!['Subscribe', 'Unsubscribe'].includes(ns)) {
				eventListeners.push(
					`({
						eventName: MeemEvent.${ns},
						handler: (options: {detail: Events.${ns}.IEventPayload}) => void
					})`
				)
			}
		})

		const allTypes = `export namespace MeemAPI {\n${types.join(
			'\n\n'
		)}\nexport namespace v1 {\n${endpointTypes.join(
			'\n\n'
		)}\n}\nexport enum MeemEvent {\n
			${(eventDefinitions ?? []).join('\n')}
		\n}\nexport namespace Events {\n${generatedEventTypes.join(
			'\n\n'
		)}\n}\n\nexport type SubscribeType=${subscribeTypes.join(
			' | '
		)}\n\nexport type EventListener=${eventListeners.join(' | ')}}`

		return { allTypes }
	}

	public static getSharedTypesPaths() {
		return {
			allTypesPath: path.join(process.cwd(), 'src/types/meem.generated.ts')
		}
	}

	/** Reads a file and strips out all the imports, etc. leaving just the types */
	private static async parseTypes(file: string) {
		const contents = await fs.readFile(file)

		// Strip out any imports
		const typesOnly = contents.toString().replace(/import[^]+} from.*\n/g, '')

		return typesOnly
	}
}
