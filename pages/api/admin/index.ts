import prisma from '../../../lib/server/db'
import getSession from '../../../lib/server/session'
import jwt from 'jsonwebtoken'

export default async function (req, res) {
	try {
		let { admin } = await getSession(req, res)

		if (!admin) return res.status(403).send()

		if (req.method === 'GET') {
			let data = await prisma.accounts.findMany({
				include: {
					activity: true,
					certs: true,
					databases: true,
					deployments: true,
					domains: true,
					environment_variables: true,
					port_mappings: true,
					projects: {
						include: { domains: true },
					},
				},
				orderBy: { created: 'asc' },
			})
			res.json(data)
		} else if (req.method === 'POST') {
			let { action, id } = req.body

			if (!['delete_user', 'login_as'].includes(action)) return res.status(400).send()
			if (!id) return res.status(400).send()

			switch (action) {
				case 'delete_user':
					/**
					 * Todo: this will not remove anything off the server,
					 * only off the database
					 */
					await prisma.accounts.delete({
						where: { id },
					})
					return res.send()
				case 'login_as':
					let account = await prisma.accounts.findUnique({
						where: { id },
					})
					if (!account) return res.status(404).send()
					let token = jwt.sign({ sub: account.id }, process.env.SECRET, { expiresIn: '1d' })
					return res.json({ token })
			}
		} else {
			return res.status(405).send()
		}
	} catch (e) {
		if (typeof e == 'undefined') return e
		res.status(500).send()
	}
}
