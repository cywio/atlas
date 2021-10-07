import axios from 'axios'
import cookie from 'js-cookie'

export async function useApi(url, method = 'GET', body = {}) {
	let { data } = await axios(url, {
		//@ts-ignore
		method,
		validateStatus: () => true,
		headers: {
			authorization: cookie.get('session') ? `Bearer ${cookie.get('session')}` : undefined,
		},
		...(method !== 'GET' && { data: body }),
	})
	return data
}
