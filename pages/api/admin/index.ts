import prisma from '@server/db'
import getSession from '@server/session'
import jwt from 'jsonwebtoken'
import argon2 from 'argon2'

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
				orderBy: { created: 'desc' },
			})

			data.forEach((i) => {
				i['mfa_enabled'] = !!i.otp_secret
				delete i.otp_secret
				delete i.password
			})

			res.json(data)
		} else if (req.method === 'POST') {
			let { action, id } = req.body

			if (!['delete_user', 'login_as', 'make_admin', 'create_user'].includes(action)) return res.status(400).send()
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
					return res.status(204).send()
				case 'login_as':
					let account = await prisma.accounts.findUnique({
						where: { id },
					})
					if (!account) return res.status(404).send()
					let token = jwt.sign({ sub: account.id }, process.env.SECRET, { expiresIn: '1d' })
					return res.json({ token })
				case 'make_admin':
					await prisma.accounts.update({
						where: { id },
						data: { admin: true },
					})
					return res.status(204).send()
				case 'create_user':
					let { data } = req.body
					let newAccount = await prisma.accounts.create({
						data: {
							name: data.name,
							email: data.email,
							admin: !!data.admin,
							password: await argon2.hash(data.password),
						},
					})
					return res.status(201).json(newAccount)
			}
		} else {
			return res.status(405).send()
		}
	} catch (e) {
		console.log(e)
		if (typeof e == 'undefined') return e
		res.status(500).send()
	}
}
