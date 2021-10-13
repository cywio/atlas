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
			let { schedule, bucket, aws_access_key, aws_secret_key, password } = req.body
			if (!schedule || !bucket || !aws_access_key || !aws_secret_key) return res.status(400).send()

			await ssh('dokku', [`${database.type}:backup-auth`, database.id, aws_access_key, aws_secret_key])
			await ssh('dokku', [`${database.type}:backup-schedule`, database.id, `"${schedule}"`, bucket])
			if (password) await ssh('dokku', [`${database.type}:backup-set-encryption`, database.id, password])

			await prisma.databases.update({
				where: { id },
				data: {
					backup: JSON.stringify({
						schedule,
						bucket,
						initialized: new Date(),
						password: password ? true : false,
					}),
				},
			})

			await log(req, accountId, `New backup created for ${database.name} to bucket ${bucket}`)

			res.status(200).send({
				schedule,
				bucket,
			})
		} else if (req.method === 'DELETE') {
			await ssh('dokku', [`${database.type}:backup-unset-encryption`, database.id])
			await ssh('dokku', [`${database.type}:backup-unschedule`, database.id])
			await ssh('dokku', [`${database.type}:backup-deauth`, database.id])

			await prisma.databases.update({
				where: { id },
				data: {
					backup: null,
				},
			})

			await log(req, accountId, `Backup schedule for ${database.name} was removed`)

			res.status(204).send()
		} else {
			res.status(405).send()
		}
	} catch (e) {
		if (typeof e == 'undefined') return e
		res.status(500).send()
	}
}
