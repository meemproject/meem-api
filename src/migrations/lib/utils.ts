export async function tryPromise(promise: Promise<any>): Promise<any> {
	try {
		await promise
	} catch (e) {
		// eslint-disable-next-line no-console
		console.log(promise)
	}
}
