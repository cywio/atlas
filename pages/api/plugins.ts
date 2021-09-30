import ssh from '../../lib/server/ssh'
import getSession from '../../lib/server/session'

export default async function (req, res) {
	try {
		await getSession(req, res)
		if (req.method === 'GET') {
			let plugins: any = await ssh('dokku plugin:list')

			/**
			 * Rough implementation to get all foreign
			 * plugins that are active
			 */
			plugins = String(plugins)
				.split('\n')
				.filter((i) => !i.includes('dokku core'))
				.map((i) => i.split(' ')[2])

			res.send(plugins)
		} else {
			return res.status(405).send()
		}
	} catch (e) {
		if (typeof e == 'undefined') return e
		res.status(500).send()
	}
}
