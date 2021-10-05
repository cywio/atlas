import ssh from '@server/ssh'
import log from '@server/log'
import prisma from '@server/db'
import getSession from '@server/session'

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
			let mappings = await prisma.port_mappings.findMany({
				where: { project: project.id },
			})
			res.json(mappings)
		} else if (req.method === 'POST') {
			let { scheme, host, container } = req.body

			if (!scheme || !host || !container) return res.status(400).send()

			let mapping = await prisma.port_mappings.create({
				data: {
					scheme,
					host,
					container,
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

			let existing = await prisma.port_mappings.findMany({
				where: { project: project.id },
			})

			let parsed_map = existing.map((i) => `${i.scheme}:${i.host}:${i.container}`)

			await ssh('dokku', ['proxy:ports-set', project.id, parsed_map.join(' ')])
			await log(req, accountId, `New port mapping set for ${project.id}`)

			res.json(mapping)
		} else {
			res.status(405).send()
		}
	} catch (e) {
		if (typeof e == 'undefined') return e
		res.status(500).send()
	}
}
