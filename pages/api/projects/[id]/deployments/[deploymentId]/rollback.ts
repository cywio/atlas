import log from '@server/log'
import prisma from '@server/db'
import getSession from '@server/session'
import build from '@server/build'
import github from '@server/github'

export default async function (req, res) {
	try {
		let { id, deploymentId } = req.query
		let { id: accountId, admin } = await getSession(req, res)

		let project = await prisma.projects.findUnique({
			where: { id },
			include: { accounts: true },
		})

		let rollback: any = await prisma.deployments.findFirst({
			where: { id: deploymentId, project: project.id },
			include: { accounts: true },
		})

		if (!project) return res.status(404).send()
		if (!admin && project.owner !== accountId) return res.status(403).send()

		if (req.method === 'POST') {
			let currentDeployments = await prisma.deployments.count({ where: { project: project.id, status: 'BUILDING' } })
			if (currentDeployments > 0) return res.status(409).send('Concurrent builds are not available')

			if (rollback.type === 'github') {
				let { access_token } = await github(req, res, accountId)
				rollback.authedOrigin = String(rollback.origin).replace('[REDACTED]', access_token)
			}

			let deployment = await prisma.deployments.create({
				data: {
					manual: true,
					rollback: true,
					origin: rollback.origin,
					type: rollback.type,
					branch: rollback.branch,
					commit: rollback.commit,
					message: rollback.message,
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

			await build(project.id, deployment.id, rollback.authedOrigin, rollback.commit)
		} else {
			res.status(405).send()
		}
	} catch (e) {
		if (typeof e == 'undefined') return e
		res.status(500).send()
	}
}
