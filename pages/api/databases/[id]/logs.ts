import ssh from '../../../../lib/server/ssh'
import prisma from '../../../../lib/server/db'
import getSession from '../../../../lib/server/session'

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

		if (req.method === 'GET') {
			let logs = await ssh(`dokku`, [`${database.type}:logs`, database.id])
			res.send(logs)
		} else {
			res.status(405).send()
		}
	} catch (e) {
		if (typeof e == 'undefined') return e
		res.status(500).send()
	}
}
