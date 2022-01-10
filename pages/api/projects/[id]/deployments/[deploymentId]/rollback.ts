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
			let deployment = await prisma.deployments.create({
				data: {
					manual: true,
					rollback: true,
					origin: rollback.origin,
					type: rollback.type,
					branch: rollback.branch,
					commit: rollback.commit,
					message: rollback.message,
					status: 'QUEUED',
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

			if (rollback.type === 'github') {
				let { access_token } = await github(req, res, accountId)
				rollback.origin = String(rollback.origin).replace('[REDACTED]', access_token)
			}

			await log(req, accountId, `Rollback to ${rollback.id} for ${project.name} was triggered`)

			res.status(202).json(deployment)

			await build(project.id, deployment.id, rollback.origin, rollback.commit || rollback.branch)
		} else {
			res.status(405).send()
		}
	} catch (e) {
		if (typeof e == 'undefined') return e
		res.status(500).send()
	}
}
