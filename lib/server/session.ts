import prisma from './db'
import jwt from 'jsonwebtoken'

export default async function getSession(req, res) {
	try {
		let { authorization } = req.headers

		if (!authorization) throw res.status(401).send()

		authorization = authorization.split('Bearer ')[1]

		let { sub } = jwt.verify(authorization, process.env.SECRET)

		let account = await prisma.accounts.findUnique({ where: { id: String(sub) } })

		return account
	} catch {
		throw res.status(401).send()
	}
}
