import prisma from '../../../lib/server/db'
import getSession from '../../../lib/server/session'
import log from '../../../lib/server/log'
import argon2 from 'argon2'

export default async function (req, res) {
	try {
		if (req.method === 'POST') {
			let account = await getSession(req, res)

			let { old_password, new_password } = req.body

			if (!old_password || !new_password) return res.status(400).send()

			if (!(await argon2.verify(account.password, old_password))) return res.status(401).send()

			await prisma.accounts.update({
				where: { id: account.id },
				data: {
					password: await argon2.hash(new_password),
				},
			})

			await log(req, account.id, `User password was changed`)

			res.status(204).send()
		}
	} catch (e) {
		if (typeof e == 'undefined') return e
		res.status(500).send()
	}
}
