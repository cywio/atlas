import { buildQueue } from '@server/queues'
import getSession from '@server/session'
import prisma from '@server/db'

export default async function (req, res) {
	try {
		let account = await getSession(req, res)
		if (req.method === 'GET') {
			let currentBuilds = buildQueue.getQueue()

			let queuedBuilds = await prisma.deployments.findMany({
				where: {
					id: {
						in: currentBuilds.map((i) => i.deploymentId),
					},
					owner: account.id,
				},
				include: {
					accounts: true,
					projects: true,
				},
			})

			let activeBuilds = await prisma.deployments.findMany({
				where: {
					status: 'BUILDING',
					owner: account.id,
				},
				include: {
					accounts: true,
					projects: true,
				},
			})

			res.send([...activeBuilds, ...queuedBuilds])
		} else {
			return res.status(405).send()
		}
	} catch (e) {
		if (typeof e == 'undefined') return e
		res.status(500).send()
	}
}
