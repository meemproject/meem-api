/* eslint-disable no-param-reassign */
import Cron from 'cron'
import CronJob from '../CronJob'

export default class PromptsCron extends CronJob {
	private job?: Cron.CronJob

	public start() {
		this.job = new Cron.CronJob({
			cronTime: '00 * * * * *',
			onTick: this.run,
			context: this
		})

		this.job.start()
	}

	public async run() {
		log.info('Running PromptsCron!')
		log.info(new Date())
		await services.prompts.endCurrentPrompt()
		await services.prompts.sendNextPrompt()
	}
}
