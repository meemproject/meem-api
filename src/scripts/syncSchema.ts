import path from 'path'
import fs from 'fs-extra'
import superagent from 'superagent'

const GITHUB_API_URL = 'https://api.github.com'
const REPO_OWNER = 'charlestati'
const REPO_NAME = 'schema-org-json-schemas'
const BRANCH_NAME = 'master'
const DIRECTORY_PATH = 'schemas'

async function fetchFiles() {
	const response = await superagent
		.get(
			`${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${DIRECTORY_PATH}?ref=${BRANCH_NAME}`
		)
		.set('User-Agent', 'script')
	const files = response.body
	return files.filter((file: any) => file.type === 'file')
}

async function fetchFileContent(file: any) {
	const response = await superagent.get(file.download_url)
	return response.text
}

async function writeToFile(fileName: string, content: string) {
	const filePath = path.join(process.cwd(), 'src/schemas', fileName)
	await fs.writeFile(filePath, content)
}

export async function syncSchema() {
	const files = await fetchFiles()
	await Promise.all(
		files.map(async (file: any) => {
			const content = await fetchFileContent(file)
			await writeToFile(file.name, content)
			// console.log({ name: file.name })
		})
	)
}

syncSchema()
	.then(() => {
		console.log('Schema finished syncing!')
	})
	.catch(e => {
		console.log(e)
	})
