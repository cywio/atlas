export function useValidSession(context) {
	return 'session' in context.req.cookies
		? {}
		: {
				redirect: {
					destination: '/auth',
				},
		  }
}
