import ssh from '../../../lib/server/ssh'
import log from '../../../lib/server/log'
import prisma from '../../../lib/server/db'
import getSession from '../../../lib/server/session'

export default async function (req, res) {
	try {
		let { id: accountId, admin } = await getSession(req, res)

		if (req.method === 'GET') {
			let projects = await prisma.projects.findMany({
				...(!admin && { where: { owner: accountId } }),
			})
			res.json(projects)
		} else if (req.method === 'POST') {
			let { name, description } = req.body
			if (!name) return res.status(400).send()

			let projects = await prisma.projects.create({
				data: {
					name,
					description,
					accounts: {
						connect: {
							id: accountId,
						},
					},
				},
			})
			await ssh('dokku', ['apps:create', projects.id])
			await log(req, accountId, `New project created: ${name}`)

			res.status(201).json(projects)
		} else {
			return res.status(405).send()
		}
	} catch (e) {
		if (typeof e == 'undefined') return e
		res.status(500).send()
	}
}
