import ssh from '../../lib/server/ssh'

export default async function (req, res) {
	res.json({ ok: !!(await ssh('dokku')) })
}
