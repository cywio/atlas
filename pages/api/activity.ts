import prisma from '@server/db'
import getSession from '@server/session'

export default async function (req, res) {
	try {
		let { id: accountId, admin } = await getSession(req, res)
		if (req.method === 'GET') {
			let { take } = req.query
			let activity = await prisma.activity.findMany({
				include: { accounts: true },
				orderBy: { created: 'desc' },
				...(take && { take: +take }),
				...(!admin && { where: { owner: accountId } }),
			})
			activity.forEach((i) => {
				delete i.accounts.password
				delete i.accounts.otp_secret
			})
			res.json(activity)
		} else {
			return res.status(405).send()
		}
	} catch (e) {
		if (typeof e == 'undefined') return e
		res.status(500).send()
	}
}
