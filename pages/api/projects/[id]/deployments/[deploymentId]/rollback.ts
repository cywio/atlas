import ssh from '../../../../../../lib/server/ssh'
import log from '../../../../../../lib/server/log'
import prisma from '../../../../../../lib/server/db'
import getSession from '../../../../../../lib/server/session'

export default async function (req, res) {
	try {
		let { id, deploymentId } = req.query
		let { id: accountId, admin } = await getSession(req, res)

		let project = await prisma.projects.findUnique({
			where: { id },
			include: { accounts: true },
		})

		let rollback = await prisma.deployments.findFirst({
			where: { id: deploymentId, project: project.id },
			include: { accounts: true },
		})

		if (!project) return res.status(404).send()
		if (!admin && project.owner !== accountId) return res.status(403).send()

		if (req.method === 'POST') {
			let currentDeployments = await prisma.deployments.count({ where: { project: project.id, status: 'BUILDING' } })
			if (currentDeployments > 0) return res.status(409).send('Concurrent builds are not available')

			let deployment = await prisma.deployments.create({
				data: {
					manual: true,
					rollback: true,
					origin: rollback.origin,
					type: rollback.type,
					branch: rollback.branch,
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

			await log(req, accountId, `Rollback to ${rollback.id} for ${project.name} was triggered`)

			res.status(202).json(deployment)

			let client: any = await ssh('', [], true)

			client
				.exec('dokku', ['git:sync', project.id, rollback.origin, rollback.branch, '--build'], {
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
