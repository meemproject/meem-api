export default class ScraperService {
	public static async screenshotUrl(url: string): Promise<string | Buffer> {
		const puppeteer = services.puppeteer.getInstance()
		const browser = await puppeteer.launch({
			// headless: true, // debug only
			args: ['--no-sandbox']
		})

		const page = await browser.newPage()

		page.setViewport({
			width: 1024,
			height: 768
		})

		await page.goto(url, {
			waitUntil: ['load', 'networkidle0', 'domcontentloaded']
		})

		const buffer = await page.screenshot({
			fullPage: true,
			type: 'jpeg'
		})

		await browser.close()

		return buffer
	}
}
