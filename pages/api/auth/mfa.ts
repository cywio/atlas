import prisma from '../../../lib/server/db'
import getSession from '../../../lib/server/session'
import log from '../../../lib/server/log'
import { authenticator } from 'otplib'

export default async function (req, res) {
	try {
		let account = await getSession(req, res)
		if (req.method === 'POST') {
			if (account.otp_secret) return res.status(409).send()

			let secret = authenticator.generateSecret()
			let uri = authenticator.keyuri(String(req.headers['host']).replace(/:/g, ''), 'Server', secret)

			await prisma.accounts.update({
				where: { id: account.id },
				data: {
					otp_secret: secret,
				},
			})

			await log(req, account.id, `User enabled two factor authentication`)

			res.json({ secret, uri })
		} else if (req.method === 'DELETE') {
			await prisma.accounts.update({
				where: { id: account.id },
				data: {
					otp_secret: null,
				},
			})

			await log(req, account.id, `User disabled two factor authentication`)

			res.status(204).send()
		}
	} catch (e) {
		console.log(e)
		if (typeof e == 'undefined') return e
		res.status(500).send()
	}
}
