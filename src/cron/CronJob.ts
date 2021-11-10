export default abstract class CronJob {
	public abstract run(): Promise<void>
}
