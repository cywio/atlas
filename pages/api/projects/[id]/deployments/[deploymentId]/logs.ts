import prisma from '@server/db'
import getSession from '@server/session'

export default async function (req, res) {
	try {
		let { deploymentId, id: projectId } = req.query
		let { id: accountId, admin } = await getSession(req, res)

		let deployment = await prisma.deployments.findFirst({
			where: { id: deploymentId, project: projectId },
			include: { accounts: true },
		})

		if (!deployment) return res.status(404).send()
		if (!admin && deployment.owner !== accountId) return res.status(403).send()

		if (req.method === 'GET') {
			res.send(String(deployment.logs || ''))
		} else {
			res.status(405).send()
		}
	} catch (e) {
		if (typeof e == 'undefined') return e
		res.status(500).send()
	}
}
