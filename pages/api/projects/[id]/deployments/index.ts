import ssh from '../../../../../lib/server/ssh'
import log from '../../../../../lib/server/log'
import prisma from '../../../../../lib/server/db'
import getSession from '../../../../../lib/server/session'

export default async function (req, res) {
	try {
		let { id } = req.query
		let { id: accountId, admin } = await getSession(req, res)

		let project = await prisma.projects.findUnique({
			where: { id },
			include: { accounts: true },
		})

		if (!project) return res.status(404).send()
		if (!admin && project.owner !== accountId) return res.status(403).send()

		if (req.method === 'GET') {
			let deployments = await prisma.deployments.findMany({
				where: {
					project: project.id,
				},
				include: {
					accounts: true,
					projects: true,
				},
				orderBy: {
					created: 'desc',
				},
			})
			deployments.forEach((i) => {
				delete i.accounts.password
			})
			res.json(deployments)
		} else if (req.method === 'POST') {
			let { origin, type, branch } = req.body

			if (!origin || !type) return res.status(400).send()
			if (!['docker', 'git'].includes(type)) return res.status(422).send()
			if (type === 'git' && !branch) return res.status(400).send()

			let currentDeployments = await prisma.deployments.count({ where: { project: project.id, status: 'BUILDING' } })
			if (currentDeployments > 0) return res.status(409).send('Concurrent builds are not available')

			let deployment = await prisma.deployments.create({
				data: {
					manual: true,
					origin,
					type,
					branch,
					status: 'BUILDING',
					projects: {
						connect: {
							id: project.id,
						},
					},
					accounts: {
						connect: {
							id: accountId,
						},
					},
				},
			})

			await log(req, accountId, `Deployment for ${project.name} was triggered for branch ${branch}`)

			res.status(202).json(deployment)

			let client: any = await ssh('', [], true)

			client
				.exec('dokku', ['git:sync', project.id, origin, branch, '--build'], {
					onStdout: async (chunk) => {
						await appendToLogs(deployment.id, chunk)
					},
					onStderr: async (chunk) => {
						await appendToLogs(deployment.id, chunk)
					},
				})
				.then(async () => {
					await updateCompleteStatus(deployment.id)
				})
				.catch(async () => {
					await updateCompleteStatus(deployment.id)
				})
		} else {
			res.status(405).send()
		}
	} catch (e) {
		if (typeof e == 'undefined') return e
		res.status(500).send()
	}
}

async function appendToLogs(id, chunk) {
	let { logs } = await prisma.deployments.findUnique({
		where: { id: id },
		select: { logs: true },
	})
	await prisma.deployments.update({
		where: { id: id },
		data: {
			logs: `${logs}\n${chunk.toString('utf8')}`,
			status: 'BUILDING',
		},
	})
}

async function updateCompleteStatus(id) {
	let { logs } = await prisma.deployments.findUnique({
		where: { id: id },
		select: { logs: true },
	})
	await prisma.deployments.update({
		where: { id: id },
		data: {
			status: logs.includes('Application deployed:') ? 'COMPLETED' : 'FAILED',
		},
	})
}
