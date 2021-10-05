import log from '@server/log'
import prisma from '@server/db'
import getSession from '@server/session'
import argon2 from 'argon2'
import jwt from 'jsonwebtoken'
import { authenticator } from '@otplib/preset-default'

export default async function (req, res) {
	try {
		if (req.method === 'GET') {
			let account = await getSession(req, res)

			account['mfa_enabled'] = !!account.otp_secret
			delete account.password
			delete account.otp_secret

			res.json(account)
		} else if (req.method === 'POST') {
			let { email, password, mfa } = req.body

			if (!email || !password) return res.status(400).send()

			let account = await prisma.accounts.findUnique({ where: { email } })

			if (!account) return res.status(401).send()

			if (!(await argon2.verify(account.password, password))) return res.status(401).send()

			if (account.otp_secret && !mfa) return res.json({ token: 'mfa' })
			if (account.otp_secret && !authenticator.verify({ token: mfa, secret: account.otp_secret })) return res.status(401).send()

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
