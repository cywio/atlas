import axios from 'axios'
import prisma from './db'

export default async function (req, res, accountId) {
	try {
		let account = await prisma.accounts.findUnique({ where: { id: accountId } })

		if (Date.now() < (account.tokens as any).github.granted + (account.tokens as any).github.expires_in * 1000)
			return (account.tokens as any).github

		const { data: credentials } = await axios.post(
			'https://github.com/login/oauth/access_token',
			{
				client_id: process.env.GH_CLIENT_ID,
				client_secret: process.env.GH_CLIENT_SECRET,
				refresh_token: (account.tokens as { github: any }).github.refresh_token,
				grant_type: 'refresh_token',
			},
			{
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
			}
		)

		if (!credentials.refresh_token) throw 'Error'

		await prisma.accounts.update({
			data: {
				tokens: {
					github: {
						...credentials,
						granted: Date.now(),
					},
				},
			},
			where: {
				id: accountId,
			},
		})

		return credentials
	} catch (e) {
		throw res.status(403).send()
	}
}
