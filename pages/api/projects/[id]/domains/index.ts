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
			let domains = await prisma.domains.findMany({
				where: { project: project.id },
				include: {
					certs: {
						orderBy: {
							created: 'desc',
						},
					},
				},
			})
			res.json(domains)
		} else if (req.method === 'POST') {
			let { domain } = req.body

			if (!domain) return res.status(400).send()

			let domains = await prisma.domains.create({
				data: {
					domain,
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
			await ssh('dokku', ['domains:add', project.id, domain])
			await log(req, accountId, `Domain ${domain} was added to project ${project.id}`)
			res.json(domains)
		} else {
			res.status(405).send()
		}
	} catch (e) {
		if (typeof e == 'undefined') return e
		res.status(500).send()
	}
}
