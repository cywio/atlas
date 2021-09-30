import ssh from '../../../../../lib/server/ssh'
import log from '../../../../../lib/server/log'
import prisma from '../../../../../lib/server/db'
import getSession from '../../../../../lib/server/session'

export default async function (req, res) {
	try {
		let { portId, id: projectId } = req.query
		let { id: accountId, admin } = await getSession(req, res)

		let project = await prisma.projects.findUnique({
			where: { id: projectId },
			include: { accounts: true },
		})

		if (!project) return res.status(404).send()
		if (!admin && project.owner !== accountId) return res.status(403).send()

		let mapping = await prisma.port_mappings.findFirst({
			where: { id: portId, project: projectId },
		})

		if (!mapping) return res.status(404).send()

		if (req.method === 'GET') {
			res.json(mapping)
		} else if (req.method === 'DELETE') {
			await prisma.port_mappings.delete({ where: { id: portId } })
			await ssh('dokku', ['proxy:ports-remove', project.id, `${mapping.scheme}:${mapping.host}:${mapping.container}`])
			await log(req, accountId, `Port mapping removed for ${project.id}`)
			res.status(204).send()
		} else {
			res.status(405).send()
		}
	} catch (e) {
		if (typeof e == 'undefined') return e
		res.status(500).send()
	}
}
