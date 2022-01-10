import ssh from '@server/ssh'

export default async function (req, res) {
	let dokku = !!(await ssh('dokku', ['version']))
	if (!dokku) res.status(500).send('Unable to connect to instance')
	res.send('OK')
}
