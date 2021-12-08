/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */

import path from 'path'
import fs from 'fs-extra'
import request from 'superagent'

async function downloadMeemABI() {
	const { text } = await request.get(
		'https://raw.githubusercontent.com/meemproject/meem-id-contracts/master/types/MeemID.json'
	)

	await fs.ensureDir(path.join(process.cwd(), 'src', 'abis'))
	await fs.writeFile(
		path.join(process.cwd(), 'src', 'abis', 'MeemID.json'),
		text
	)
}

downloadMeemABI()
	.then(() => {
		console.log(`Meem ID ABI downloaded`)
	})
	.catch(e => {
		console.log(e)
	})
