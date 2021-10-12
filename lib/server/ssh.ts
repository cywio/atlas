import { NodeSSH } from 'node-ssh'
import fs from 'fs'

export default async function ssh(cmd, args = [], clientOnly = false) {
	const ssh = new NodeSSH()
	try {
		let client = await ssh.connect({
			host: process.env.SERVER_IP,
			username: cmd === 'dokku' ? 'dokku' : process.env.DOCKER_USER,
			privateKey: cmd === 'dokku' ? fs.readFileSync('/keys/dokku', 'utf8') : fs.readFileSync('/keys/docker', 'utf8'),
		})
		if (clientOnly) return client
		if (cmd === 'dokku') {
			cmd = args[0]
			args.shift()
		}
		return await client.exec(cmd, args, {
			onStdout: (chunk) => chunk.toString('utf8'),
			onStderr: (chunk) => chunk.toString('utf8'),
		})
	} catch {
		return null
	}
}
