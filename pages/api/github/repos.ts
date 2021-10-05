import getSession from '@server/session'
import github from '@server/github'
import axios from 'axios'

export default async function (req, res) {
	try {
		let { id: accountId } = await getSession(req, res)
		let { access_token } = await github(req, res, accountId)

		if (!access_token) return res.status(403).send()

		if (req.method === 'GET') {
			let { data } = await axios.get(`https://api.github.com/user/repos`, {
				headers: {
					Authorization: `token ${access_token}`,
				},
			})
			res.json(
				data.map((i) => ({
					id: i.id,
					name: i.full_name,
					default_branch: i.default_branch,
					private: i.private,
					fork: i.fork,
					language: i.language,
				}))
			)
		} else {
			return res.status(405).send()
		}
	} catch (e) {
		if (typeof e == 'undefined') return e
		res.status(500).send()
	}
}
