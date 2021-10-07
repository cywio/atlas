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
			let bucket = JSON.parse(database.backup).bucket
			if (!bucket) return res.status(409).send()

			await log(req, accountId, `Manual backup created for ${database.name} to bucket ${bucket}`)

			res.status(202).send()

			await ssh('dokku', [`${database.type}:backup`, database.id, bucket])
		} else {
			res.status(405).send()
		}
	} catch (e) {
		if (typeof e == 'undefined') return e
		res.status(500).send()
	}
}
