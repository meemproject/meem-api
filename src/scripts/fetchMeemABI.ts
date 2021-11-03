/* eslint-disable no-console */
import path from 'path'
import fs from 'fs-extra'
import request from 'superagent'

async function downloadMeemABI() {
	const { text } = await request.get(
		'https://raw.githubusercontent.com/meemproject/meem-contracts/master/types/Meem.json'
	)

	await fs.ensureDir(path.join(process.cwd(), 'src', 'abis'))
	await fs.writeFile(path.join(process.cwd(), 'src', 'abis', 'Meem.json'), text)
}

downloadMeemABI()
	.then(() => {
		console.log(`Meem ABI downloaded`)
	})
	.catch(e => {
		console.log(e)
	})
