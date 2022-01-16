import { useApi, useInterval } from '@hooks'
import { Dropdown, Avatar } from '@components'
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
					<div className='max-w-7xl px-8 py-4 w-full flex items-center justify-start gap-2'>
						<img src='/icons/alert.svg' className='invert w-5' />
						<p className='font-bold text-sm'>{health}</p>
					</div>
				</div>
			)}
			<nav className='bg-[#f3f4f6] z-40 fixed inset-0 h-14 mb-12 border-b border-gray-200 w-full'>
				<div className='max-w-7xl px-8 flex items-center h-full justify-between mx-auto'>
					<div className='flex items-center justify-between gap-6'>
						<div className='flex items-center justify-between gap-1 text-sm'>
							{process.env.NEXT_PUBLIC_LOGO_URL && (
								<a href='/'>
									<div className='border-r border-gray-200 mr-2 pr-4 hover:opacity-40 transition'>
										<img className='h-6' src={process.env.NEXT_PUBLIC_LOGO_URL} />
									</div>
								</a>
							)}
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
						<Avatar name={user && user.name} image={user && user.avatar} />
					</Dropdown>
				</div>
			</nav>
		</>
	)
}
