import ssh from '@server/ssh'
import prisma from '@server/db'
import argon2 from 'argon2'
import log from '@server/log'
import jwt from 'jsonwebtoken'

export default async function (req, res) {
	try {
		if (req.method === 'POST') {
			let { name, email, password, setup_key } = req.body

			if (!name || !email || !password) return res.status(400).send()
			if (!setup_key || setup_key !== process.env.SETUP_KEY) return res.status(401).send()
			if ((await prisma.accounts.count()) !== 0) return res.status(409).send()

			let account = await prisma.accounts.create({
				data: {
					email,
					name,
					password: await argon2.hash(password),
					admin: true,
				},
			})

			let token = jwt.sign({ sub: account.id }, process.env.SECRET, { expiresIn: '1d' })

			await log(req, account.id, `Setup completed and admin user created`)

			res.status(201).json({ token })

			await ssh('dokku', ['config:unset' 'admin', 'SETUP_KEY'])
		} else {
			return res.status(405).send()
		}
	} catch (e) {
		if (typeof e == 'undefined') return e
		res.status(500).send()
	}
}
