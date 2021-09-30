import ssh from '../../../../lib/server/ssh'
import log from '../../../../lib/server/log'
import prisma from '../../../../lib/server/db'
import getSession from '../../../../lib/server/session'

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
			delete project.accounts.password
			res.json(project)
		} else if (req.method === 'PATCH') {
			let project = await prisma.projects.update({ where: { id }, data: req.body })
			await log(req, accountId, `Project details for ${project.name} were updated`)
			res.json(project)
		} else if (req.method === 'DELETE') {
			await prisma.projects.delete({ where: { id } })
			await ssh('dokku', ['apps:destroy', project.id, '--force'])
			await log(req, accountId, `Project ${project.name} was destroyed`)
			res.status(204).send()
		} else {
			res.status(405).send()
		}
	} catch (e) {
		if (typeof e == 'undefined') return e
		res.status(500).send()
	}
}
