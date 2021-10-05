import ssh from '@server/ssh'
import log from '@server/log'
import prisma from '@server/db'
import getSession from '@server/session'

export default async function (req, res) {
	try {
		let { envId, id: projectId, restart } = req.query
		let { id: accountId, admin } = await getSession(req, res)

		restart = Boolean(restart)

		let project = await prisma.projects.findUnique({
			where: { id: projectId },
			include: { accounts: true },
		})

		if (!project) return res.status(404).send()
		if (!admin && project.owner !== accountId) return res.status(403).send()

		let envVar = await prisma.environment_variables.findFirst({
			where: { id: envId, project: projectId },
		})

		if (!envVar) return res.status(404).send()

		if (req.method === 'GET') {
			res.json(envVar)
		} else if (req.method === 'DELETE') {
			res.status(202).send()
			await prisma.environment_variables.delete({ where: { id: envId } })
			await ssh('dokku', ['config:unset', project.id, envVar.key, !restart ? '--no-restart' : undefined])
			await log(req, accountId, `Environment variable ${envVar.key} was deleted`)
		} else {
			res.status(405).send()
		}
	} catch (e) {
		if (typeof e == 'undefined') return e
		res.status(500).send()
	}
}
