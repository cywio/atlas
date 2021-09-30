import { useApi } from '@hooks'
import { useEffect, useState } from 'react'

export function Nav({ active }) {
	const [user, setUser] = useState(null)

	useEffect(() => {
		const hydrate = async () => {
			setUser(await useApi('/api/auth'))
		}
		hydrate()
	}, [])

	let activeTab = 'bg-black py-1 px-2 rounded-md text-white text-md hover:opacity-40 transition'
	let inactiveTab = 'py-1 px-2 rounded-md text-md hover:opacity-40 transition'

	return (
		<nav className='sticky flex items-center justify-between mb-12'>
			<div className='flex items-center justify-between gap-6'>
				<div className='flex items-center justify-between gap-1 text-sm'>
					<a href='/' className={active === 'dashboard' ? activeTab : inactiveTab}>
						Dashboard
					</a>
					<a href='/activity' className={active === 'activity' ? activeTab : inactiveTab}>
						Activity
					</a>
					<a href='/settings' className={active === 'settings' ? activeTab : inactiveTab}>
						Settings
					</a>
				</div>
			</div>
			<div
				className='bg-gray-200 rounded-full w-10 h-10 border hover:opacity-80'
				style={{
					backgroundSize: 'cover',
					backgroundPosition: 'center',
					backgroundImage: `url(${user && user.avatar})`,
				}}
			/>
		</nav>
	)
}
