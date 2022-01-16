import { decrypt, encrypt } from '@server/crypto'
import getSession from '@server/session'
import ssh from '@server/ssh'
import prisma from '@server/db'
import log from '@server/log'

export default async function (req, res) {
	try {
		let { id, restart } = req.query
		let { id: accountId, admin } = await getSession(req, res)

		restart = Boolean(restart)

		let project = await prisma.projects.findUnique({
			where: { id },
			include: { accounts: true },
		})

		if (!project) return res.status(404).send()
		if (!admin && project.owner !== accountId) return res.status(403).send()

		if (req.method === 'GET') {
			let envVars = await prisma.environment_variables.findMany({
				where: { project: project.id },
			})

			envVars = envVars.map((i) => ({
				...i,
				value: decrypt(i.value),
			}))

			res.json(envVars)
		} else if (req.method === 'POST') {
			let { key, value } = req.body
			let envVars = await prisma.environment_variables.create({
				data: {
					projects: {
						connect: {
							id: project.id,
						},
					},
					key,
					value: encrypt(value),
					accounts: {
						connect: {
							id: accountId,
						},
					},
				},
			})
			res.status(202).json(envVars)
			await log(req, accountId, `Environment variable ${key} was created`)
			await ssh('dokku', ['config:set', project.id, `${key}=${value}`, !restart ? '--no-restart' : undefined])
		} else if (req.method === 'DELETE') {
			res.status(202).send()
			await prisma.environment_variables.deleteMany({ where: { project: id } })
			await ssh('dokku', ['config:clear', project.id, !restart ? '--no-restart' : undefined])
			await log(req, accountId, `All environment variables for ${project.name} were cleared`)
		} else {
			res.status(405).send()
		}
	} catch (e) {
		if (typeof e == 'undefined') return e
		res.status(500).send()
	}
}
