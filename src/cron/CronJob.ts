export default abstract class CronJob {
	public abstract async run(): Promise<void>
}
