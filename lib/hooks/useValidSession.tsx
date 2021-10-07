import requestIp from 'request-ip'

export function useValidSession(context) {
	let sessionExists = 'session' in context.req.cookies
	let ipAllowed =
		process.env.ALLOWED_IPS != undefined
			? String(process.env.ALLOWED_IPS).split(',').includes(requestIp.getClientIp(context.req))
			: true

	return sessionExists && ipAllowed
		? {}
		: {
				redirect: {
					destination: '/auth',
				},
		  }
}
