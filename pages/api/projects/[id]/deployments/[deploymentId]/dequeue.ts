import { buildQueue } from '@server/queues'
import getSession from '@server/session'
import prisma from '@server/db'
import log from '@server/log'

export default async function (req, res) {
	try {
		let { id, deploymentId } = req.query
		let { id: accountId, admin } = await getSession(req, res)

		let project = await prisma.projects.findUnique({
			where: { id },
			include: { accounts: true },
		})

		if (!project) return res.status(404).send()
		if (!admin && project.owner !== accountId) return res.status(403).send()

		if (req.method === 'POST') {
			let queue = buildQueue.getQueue()
			queue = queue.filter((i) => i.deploymentId !== deploymentId)
			buildQueue.killAndDrain()
			await Promise.all(queue.map((i) => buildQueue.push(i)))

			await prisma.deployments.update({
				where: { id: deploymentId },
				data: { status: 'CANCELED' },
			})

			await log(req, accountId, `Deployment ${deploymentId} was removed from the queue`)

			res.status(204).end()
		} else {
			res.status(405).send()
		}
	} catch (e) {
		if (typeof e == 'undefined') return e
		res.status(500).send()
	}
}
