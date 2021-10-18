import ssh from '@server/ssh'
import log from '@server/log'
import prisma from '@server/db'
import getSession from '@server/session'

export default async function (req, res) {
	try {
		let { id: accountId, admin } = await getSession(req, res)

		if (req.method === 'GET') {
			let projects = await prisma.projects.findMany({
				include: {
					domains: true,
					accounts: true,
				},
				...(!admin && { where: { owner: accountId } }),
			})
			projects.forEach((i) => {
				delete i.accounts.password
				delete i.accounts.otp_secret
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
			await ssh('dokku', ['checks:enable', projects.id])
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
