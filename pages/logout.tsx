import { useEffect } from 'react'
import { Spinner } from '@components'
import { useRouter } from 'next/router'
import cookie from 'js-cookie'

export default function Logout() {
	const router = useRouter()

	useEffect(() => {
		cookie.remove('session')
		router.push('/auth')
	}, [])

	return (
		<div className='grid place-items-center min-h-screen'>
			<div className='w-8 m-auto'>
				<Spinner size={32} />
			</div>
		</div>
	)
}
