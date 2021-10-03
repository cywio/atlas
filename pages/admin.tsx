import { useState, useEffect } from 'react'
import { useApi, useValidSession } from '@hooks'
import { Disclosure } from '@headlessui/react'
import { Button, Nav } from '@components'
import { useRouter } from 'next/router'
import * as timeago from 'timeago.js'
import toast from 'react-hot-toast'
import cookie from 'js-cookie'

export default function Admin() {
	const [user, setUser] = useState<any>(null)
	const [admin, setAdmin] = useState<any>(null)

	const router = useRouter()

	const hydrate = async () => {
		setUser(await useApi(`/api/auth`))
		setAdmin(await useApi(`/api/admin`))
	}

	useEffect(() => {
		hydrate()
	}, [])

	if (!user) return null

	if (user && !user.admin) {
		router.push('/')
		toast.error('You are not allowed to view that page')
	}

	async function clean() {
		await toast.promise(useApi('/api/cleanup', 'POST'), {
			loading: 'Please wait...',
			success: 'Success',
			error: 'Error, try again',
		})
	}

	async function loginAs(id, name) {
		await toast.promise(useApi('/api/admin', 'POST', { action: 'login_as', id }), {
			loading: 'Please wait...',
			success: ({ token }) => {
				cookie.set('session', token)
				router.push('/')
				return `Logged in as ${name}`
			},
			error: 'Error, try again',
		})
	}

	return (
		<div className='max-w-6xl m-auto p-8'>
			<Nav active={null} />
			<div className='flex'>
				<main className='bg-white rounded-lg shadow w-full p-10'>
					<div className='mb-8 flex items-center justify-between'>
						<b>Admin</b>
					</div>
					<div className='w-96 mb-8'>
						<span>
							<b>Cleanup</b>
							<p>Cleans up exited or dead Docker containers and removes dangling images</p>
						</span>
						<Button onClick={() => clean()}>Clean</Button>
					</div>
					<div className=' mb-8'>
						<div className='mb-4'>
							<b>Accounts</b>
						</div>
						<div>
							{admin &&
								admin.map((i) => {
									return (
										<Disclosure>
											<Disclosure.Button className='flex items-center gap-4 w-full px-4 py-2 -ml-4 text-sm font-medium text-left rounded-lg'>
												<div
													className='bg-gray-200 rounded-full w-10 h-10 border hover:opacity-80'
													style={{
														backgroundSize: 'cover',
														backgroundPosition: 'center',
														backgroundImage: `url(${i.avatar})`,
													}}
												/>
												{i.name} <span className='opacity-40'>{i.email}</span>{' '}
												{i.admin && <span className='bg-gray-200 rounded-full py-1 px-2 text-xs'>Admin</span>}
											</Disclosure.Button>
											<Disclosure.Panel className='px-4 pt-4 pb-2 text-sm ml-14 w-1/2'>
												<div className='grid grid-cols-2 gap-3'>
													<p className='opacity-40'>ID</p>
													<p className='font-mono'>{i.id}</p>
													<p className='opacity-40'>Email</p>
													<p>{i.email}</p>
													<p className='opacity-40'>Has MFA Enabled</p>
													<p>{i.mfa_enabled ? 'Yes' : 'No'}</p>
													<p className='opacity-40'>Created</p>
													<p>{timeago.format(i.created)}</p>
												</div>
												<hr className='my-6' />
												<div className='grid grid-cols-2 gap-3'>
													<p className='opacity-40'>Activity</p>
													<p>{i.activity.length}</p>
													<p className='opacity-40'>Projects</p>
													<p>{i.projects.length}</p>
													<p className='opacity-40'>Deployments</p>
													<p>{i.deployments.length}</p>
													<p className='opacity-40'>Linked Domains</p>
													<p>{i.domains.length}</p>
													<p className='opacity-40'>Databases</p>
													<p>{i.databases.length}</p>
												</div>
												<div className='my-4 flex items-center gap-2'>
													<Button onClick={() => loginAs(i.id, i.name)}>Login as {i.name}</Button>
													<Button>Make Admin</Button>
													<Button>Delete User</Button>
												</div>
											</Disclosure.Panel>
										</Disclosure>
									)
								})}
						</div>
					</div>
				</main>
			</div>
		</div>
	)
}

export async function getServerSideProps(context) {
	return {
		props: {},
		...useValidSession(context),
	}
}
