import ssh from '@server/ssh'
import log from '@server/log'
import prisma from '@server/db'
import getSession from '@server/session'

export default async function (req, res) {
	try {
		let { id } = req.query
		let { id: accountId, admin } = await getSession(req, res)

		let database = await prisma.databases.findUnique({
			where: { id },
			include: { accounts: true },
		})

		if (!database) return res.status(404).send()
		if (!admin && database.owner !== accountId) return res.status(403).send()

		if (req.method === 'POST') {
			let port = await ssh('dokku', [`${database.type}:expose`, database.id])
			await prisma.databases.update({ where: { id }, data: { port: String(port).split('->')[3] } })
			await log(req, accountId, `Database connection was exposed for ${database.name}`)
			res.status(204).send()
		} else if (req.method === 'DELETE') {
			await prisma.databases.update({ where: { id }, data: { port: null } })
			await ssh('dokku', [`${database.type}:unexpose`, database.id])
			await log(req, accountId, `Database connection was unexposed for ${database.name}`)
			res.status(204).send()
		} else {
			res.status(405).send()
		}
	} catch (e) {
		if (typeof e == 'undefined') return e
		res.status(500).send()
	}
}
