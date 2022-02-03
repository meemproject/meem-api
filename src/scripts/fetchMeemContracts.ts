/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
import path from 'path'
import fs from 'fs-extra'
import request from 'superagent'

async function fetchMeemContracts() {
	const { body } = await request
		.get(
			'https://api.github.com/repos/meemproject/meem-contracts/git/trees/master?recursive=1'
		)
		.set('User-Agent', 'script')

	// console.log(body)

	const tree = body.tree as {
		path: string
		mode: string
		type: string
		sha: string
		url: string
	}[]

	for (let i = 0; i < tree.length; i += 1) {
		const file = tree[i]
		if (/^contracts/.test(file.path)) {
			const filePath = path.join(process.cwd(), 'contracts', 'meem', file.path)
			if (/\.sol/.test(file.path)) {
				console.log(`Writing file: ${file.path}`)
				const { text } = await request.get(
					`https://raw.githubusercontent.com/meemproject/meem-contracts/master/${file.path}`
				)

				await fs.writeFile(filePath, text)
			} else {
				await fs.ensureDir(filePath)
			}
		}
	}

	// await fs.ensureDir(path.join(process.cwd(), 'src', 'abis'))
	// await fs.writeFile(path.join(process.cwd(), 'src', 'abis', 'Meem.json'), text)
}

fetchMeemContracts()
	.then(() => {
		console.log(`Meem Contracts downloaded`)
	})
	.catch(e => {
		console.log(e)
	})
