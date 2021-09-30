import { NodeSSH } from 'node-ssh'

export default async function ssh(cmd, args = [], clientOnly = false) {
	const ssh = new NodeSSH()
	try {
		/**
		 * Todo: Move to ssh keys later
		 */
		let client = await ssh.connect({
			host: process.env.SERVER_IP,
			username: process.env.SERVER_USER,
			password: process.env.SERVER_PASSWORD,
		})
		if (clientOnly) return client
		return await client.exec(cmd, args, {
			onStdout: (chunk) => chunk.toString('utf8'),
			onStderr: (chunk) => chunk.toString('utf8'),
		})
	} catch {
		return null
	}
}
