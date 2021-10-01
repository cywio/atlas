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
		} else if (req.method === 'POST') {
			let { email, password } = req.body

			if (!email || !password) return res.status(400).send()

			let account = await prisma.accounts.findUnique({ where: { email } })

			if (!account) return res.status(401).send()

			if (!(await argon2.verify(account.password, password))) return res.status(401).send()

			let token = jwt.sign({ sub: account.id }, process.env.SECRET, { expiresIn: '1d' })

			await log(req, account.id, `User logged in`)

			res.json({ token })
		} else if (req.method === 'PATCH') {
			let account = await getSession(req, res)

			let { name, email, avatar } = req.body

			if (!email || !name) return res.status(400).send()

			let updated = await prisma.accounts.update({ where: { id: account.id }, data: { name, email, avatar } })

			await log(req, account.id, `User updated account info`)

			res.json(updated)
		} else {
			res.status(405).send()
		}
	} catch (e) {
		if (typeof e == 'undefined') return e
		res.status(500).send()
	}
}
