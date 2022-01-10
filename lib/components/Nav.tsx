import { useApi, useInterval } from '@hooks'
import { Dropdown } from '@components'
import { useEffect, useState } from 'react'

export function Nav({ active }) {
	const [user, setUser] = useState(null)
	const [health, setHealth] = useState('')

	useEffect(() => {
		const hydrate = async () => {
			try {
				setUser(await useApi('/api/auth'))
				await getHealthData()
			} catch {
				window.location.href = '/logout'
			}
		}
		hydrate()
	}, [])

	useInterval(async () => await getHealthData(), 60000)

	async function getHealthData() {
		try {
			setHealth(await useApi('/api/health'))
		} catch (e) {
			setHealth(e.response.data)
		}
	}

	let activeTab = 'bg-black py-1 px-2 rounded-md text-white text-md hover:opacity-40 transition'
	let inactiveTab = 'py-1 px-2 rounded-md text-md hover:opacity-40 transition'

	return (
		<>
			{health && health !== 'OK' && (
				<div className='fixed left-0 bottom-0 bg-red-600 z-20 text-white grid place-items-center w-full'>
					<div className='max-w-6xl px-8 py-4 w-full flex items-center justify-start gap-2'>
						<img src='/icons/alert.svg' className='invert w-5' />
						<p className='font-bold text-sm'>{health}</p>
					</div>
				</div>
			)}
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
				<Dropdown
					items={[
						{ text: 'New App', action: { href: '/create' } },
						{ text: 'New Database', action: { href: '/create/database' }, seperate: true },
						...(user && user.admin ? [{ text: 'Admin', action: { href: '/admin' } }] : []),
						{ text: 'Settings', action: { href: '/settings' } },
						{ text: 'Logout', action: { href: '/logout' } },
					]}
				>
					<div
						className='bg-gray-200 rounded-full w-10 h-10 border hover:opacity-80'
						style={{
							backgroundSize: 'cover',
							backgroundPosition: 'center',
							backgroundImage: `url(${user && user.avatar})`,
						}}
					/>
				</Dropdown>
			</nav>
		</>
	)
}
