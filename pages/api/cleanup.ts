import ssh from '@server/ssh'
import getSession from '@server/session'

export default async function (req, res) {
	try {
		await getSession(req, res)
		if (req.method === 'POST') {
			await ssh('dokku cleanup')
			res.status(200).send()
		} else {
			return res.status(405).send()
		}
	} catch (e) {
		if (typeof e == 'undefined') return e
		res.status(500).send()
	}
}
