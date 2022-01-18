import type Puppeteer from 'puppeteer-extra'

export default class ScraperService {
	public static shouldInitialize = true

	public puppeteer!: typeof Puppeteer

	public constructor() {
		if (!config.ENABLE_PUPPETEER) {
			log.debug('Puppeteer is disabled')
			return
		}
		// eslint-disable-next-line
		this.puppeteer = require('puppeteer-extra')
		// eslint-disable-next-line
		const StealthPlugin = require('puppeteer-extra-plugin-stealth')
		this.puppeteer.use(StealthPlugin())
		// eslint-disable-next-line
		const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker')
		this.puppeteer.use(AdblockerPlugin({ blockTrackers: true }))
	}

	public getInstance() {
		return this.puppeteer
	}
}
