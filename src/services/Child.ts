import { spawn, SpawnOptions } from 'child_process'
import stringArgv from 'string-argv'

export default class ChildService {
	/** Execute a shell command and get back the result */
	public static executeCommand(
		cmd: string,
		options?: {
			/** Optionally specify the arguments instead of parsing the cmd */
			args?: string[]
			/** When set to true will stream the results from the child process in real time instead of waiting to return */
			stream?: boolean
			/** Override the cwd for this command */
			cwd?: string
		}
	): Promise<{
		stdout: string
	}> {
		return new Promise((resolve, reject) => {
			const args = options?.args || stringArgv(cmd)
			const { cwd = process.cwd() } = options || {}
			log.trace(`Executing command: ${cmd}`, { cwd, args })
			const executable = options?.args ? cmd : args.shift()
			let stdout = ''
			let stderr: string | undefined
			if (executable) {
				const spawnOptions: SpawnOptions = options?.stream
					? { stdio: 'inherit' }
					: {
							cwd,
							env: {
								...process.env,
								FORCE_COLOR: '1'
							},
							shell: true
					  }

				const child = spawn(executable, args, spawnOptions)
				child.stdout?.on('data', data => {
					stdout += data
				})
				child.stderr?.on('data', data => {
					stderr += data
				})
				child.on('close', code => {
					if (code === 0) {
						resolve({ stdout })
					} else {
						reject(stderr)
					}
				})
			}
		})
	}
}
