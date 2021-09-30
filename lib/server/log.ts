import prisma from './db'
import requestIp from 'request-ip'

export default async function log(req, account, message) {
	try {
		await prisma.activity.create({
			data: {
				action: message,
				ip: requestIp.getClientIp(req),
				accounts: {
					connect: {
						id: account,
					},
				},
			},
		})
	} catch {
		console.log('Could not log action')
	}
}
