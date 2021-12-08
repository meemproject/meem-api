/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */

import path from 'path'
import fs from 'fs-extra'
import request from 'superagent'

async function downloadMeemABI() {
	const { text } = await request.get(
		'https://raw.githubusercontent.com/meemproject/meem-market-contracts/master/types/MeemMarket.json'
	)

	await fs.ensureDir(path.join(process.cwd(), 'src', 'abis'))
	await fs.writeFile(
		path.join(process.cwd(), 'src', 'abis', 'MeemMarket.json'),
		text
	)
}

downloadMeemABI()
	.then(() => {
		console.log(`Meem Market ABI downloaded`)
	})
	.catch(e => {
		console.log(e)
	})
