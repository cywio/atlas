import axios from 'axios'
import getSession from '../../lib/server/session'

export default async function (req, res) {
	try {
		await getSession(req, res)
		if (req.method === 'GET') {
			let { image, tag } = req.query
			let data = await axios.get(`https://hub.docker.com/v2/repositories/library/${image}/tags/${tag}`, {
				validateStatus: () => true,
			})
			res.json({ valid: data.status !== 404 })
		} else {
			return res.status(405).send()
		}
	} catch (e) {
		console.log(e)
		if (typeof e == 'undefined') return e
		res.status(500).send()
	}
}
