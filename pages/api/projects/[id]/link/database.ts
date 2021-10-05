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
			include: {
				domains: true,
				accounts: true,
			},
		})

		if (!project) return res.status(404).send()
		if (!admin && project.owner !== accountId) return res.status(403).send()

		if (req.method === 'GET') {
			let links = await prisma.links.findMany({
				where: { project: project.id },
				include: {
					projects: true,
					databases: true,
				},
			})

			res.json(links)
		} else if (req.method === 'POST') {
			let { database_id } = req.body

			if (!database_id) return res.status(400).send()

			let database = await prisma.databases.findUnique({ where: { id: database_id } })

			await ssh('dokku', [`${database.type}:link`, database.id, project.id])

			await prisma.links.create({
				data: {
					projects: {
						connect: {
							id: project.id,
						},
					},
					databases: {
						connect: {
							id: database.id,
						},
					},
				},
			})
			await log(req, accountId, `Database ${database.name} was linked to project ${project.name}}`)

			res.send()
		} else if (req.method === 'DELETE') {
			let { database_id } = req.body

			if (!database_id) return res.status(400).send()

			let database = await prisma.databases.findUnique({ where: { id: database_id } })

			await ssh('dokku', [`${database.type}:unlink`, database.id, project.id])

			await prisma.links.deleteMany({
				where: {
					project: project.id,
					database: database.id,
				},
			})

			await log(req, accountId, `Database ${database.name} was unlinked from project ${project.name}}`)

			res.send()
		} else {
			res.status(405).send()
		}
	} catch (e) {
		if (typeof e == 'undefined') return e
		res.status(500).send()
	}
}
