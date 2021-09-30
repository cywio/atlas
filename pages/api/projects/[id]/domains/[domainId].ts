import ssh from '../../../../../lib/server/ssh'
import log from '../../../../../lib/server/log'
import prisma from '../../../../../lib/server/db'
import getSession from '../../../../../lib/server/session'

export default async function (req, res) {
	try {
		let { domainId, id: projectId } = req.query
		let { id: accountId, admin } = await getSession(req, res)

		let project = await prisma.projects.findUnique({
			where: { id: projectId },
			include: { accounts: true },
		})

		if (!project) return res.status(404).send()
		if (!admin && project.owner !== accountId) return res.status(403).send()

		let domain = await prisma.domains.findFirst({
			where: { id: domainId, project: projectId },
		})

		if (!domain) return res.status(404).send()

		if (req.method === 'GET') {
			res.json(domain)
		} else if (req.method === 'DELETE') {
			await prisma.domains.delete({ where: { id: domainId } })
			await ssh('dokku', ['domains:remove', project.id, domain.domain])
			await log(req, accountId, `Domain ${domain} was removed from project ${project.id}`)
			res.status(204).send()
		} else {
			res.status(405).send()
		}
	} catch (e) {
		if (typeof e == 'undefined') return e
		res.status(500).send()
	}
}
