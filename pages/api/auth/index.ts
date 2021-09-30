import prisma from '../../../lib/server/db'
import getSession from '../../../lib/server/session'
import log from '../../../lib/server/log'
import argon2 from 'argon2'
import jwt from 'jsonwebtoken'

export default async function (req, res) {
	try {
		if (req.method === 'GET') {
			let account = await getSession(req, res)
			delete account.password
			res.json(account)
		}
		if (req.method === 'POST') {
			let { email, password } = req.body

			if (!email || !password) return res.status(400).send()

			let account = await prisma.accounts.findUnique({ where: { email } })

			if (!account) return res.status(401).send()

			if (!(await argon2.verify(account.password, password))) return res.status(401).send()

			let token = jwt.sign({ sub: account.id }, process.env.SECRET, { expiresIn: '1d' })

			await log(req, account.id, `User logged in`)

			res.json({ token })
		}
	} catch (e) {
		if (typeof e == 'undefined') return e
		res.status(500).send()
	}
}
