import { NodeSSH } from 'node-ssh'

export default async function ssh(cmd, args = [], clientOnly = false) {
	const ssh = new NodeSSH()
	try {
		let client =
			cmd === 'dokku'
				? await ssh.connect({
						host: process.env.SERVER_IP,
						username: 'dokku',
						privateKey: process.env.DOKKU_SSH_KEY,
				  })
				: await ssh.connect({
						host: process.env.SERVER_IP,
						username: process.env.DOCKER_USER,
						privateKey: process.env.DOCKER_SSH_KEY,
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
