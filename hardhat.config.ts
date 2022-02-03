/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable import/no-extraneous-dependencies */
import dotenv from 'dotenv'
import { HardhatUserConfig } from 'hardhat/config'
import '@nomiclabs/hardhat-waffle'
import './tasks'

dotenv.config()

const config: HardhatUserConfig = {
	solidity: {
		version: '0.8.4',
		settings: {
			optimizer: {
				enabled: true,
				runs: 10_000
			}
		}
	},
	defaultNetwork: 'local',
	networks: {
		local: {
			url: 'http://127.0.0.1:8545',
			accounts: process.env.LOCAL_MNEMONIC
				? { mnemonic: process.env.LOCAL_MNEMONIC }
				: [process.env.LOCAL_WALLET_PRIVATE_KEY!].filter(Boolean)
		}
	},
	mocha: {
		timeout: 60_000
	},
	paths: {
		sources: './contracts/meem',
		tests: './src/tests',
		cache: './contracts/cache',
		artifacts: './contracts/artifacts'
	}
}
export default config
