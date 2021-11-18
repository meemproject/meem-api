/* eslint-disable no-console */
import path from 'path'
import fs from 'fs-extra'
import request from 'superagent'

async function downloadMeemABI() {
	const { text } = await request.get(
		'https://raw.githubusercontent.com/meemproject/meem-registry/master/meem-access.json'
	)

	await fs.ensureDir(path.join(process.cwd(), 'src', 'lib'))
	await fs.writeFile(
		path.join(process.cwd(), 'src', 'lib', 'meem-access.json'),
		text
	)
}

downloadMeemABI()
	.then(() => {
		console.log(`Meem access list downloaded`)
	})
	.catch(e => {
		console.log(e)
	})
