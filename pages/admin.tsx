import { useState, useEffect } from 'react'
import { useApi, useValidSession } from '@hooks'
import { Disclosure } from '@headlessui/react'
import { Button, Nav, Input, Select } from '@components'
import { useRouter } from 'next/router'
import * as timeago from 'timeago.js'
import toast from 'react-hot-toast'
import cookie from 'js-cookie'

export default function Admin() {
	const [user, setUser] = useState<any>(null)
	const [admin, setAdmin] = useState<any>(null)
	const [createUserForm, setCreateUserForm] = useState<any>({
		name: '',
		email: '',
		password: '',
		admin: false,
		show: false,
	})

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

	async function makeAdmin(id) {
		await toast.promise(useApi('/api/admin', 'POST', { action: 'make_admin', id }), {
			loading: 'Please wait...',
			success: () => {
				hydrate()
				return 'Success'
			},
			error: 'Error, try again',
		})
	}

	async function deleteUser(id) {
		await toast.promise(useApi('/api/admin', 'POST', { action: 'delete_user', id }), {
			loading: 'Please wait...',
			success: () => {
				hydrate()
				return 'Deleted successfully'
			},
			error: 'Error, try again',
		})
	}

	async function createUser() {
		await toast.promise(useApi('/api/admin', 'POST', { action: 'create_user', id: '0', data: createUserForm }), {
			loading: 'Please wait...',
			success: () => {
				setCreateUserForm({ name: '', email: '', password: '', admin: false, show: false })
				hydrate()
				return 'Created successfully'
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
					<div className='mb-8'>
						<div className='mb-4'>
							<div className='flex items-center gap-4'>
								<b>Accounts</b>
								<Button className='mt-0' onClick={() => setCreateUserForm({ ...createUserForm, show: true })}>
									Create
								</Button>
							</div>
						</div>
						{createUserForm.show ? (
							<div className='w-96 my-4'>
								<Input
									label='Name'
									value={createUserForm.name}
									onChange={({ target }) => setCreateUserForm({ ...createUserForm, name: target.value })}
								/>
								<Input
									label='Email'
									value={createUserForm.email}
									type='email'
									onChange={({ target }) => setCreateUserForm({ ...createUserForm, email: target.value })}
								/>
								<Input
									label='Password'
									value={createUserForm.password}
									type='password'
									onChange={({ target }) => setCreateUserForm({ ...createUserForm, password: target.value })}
								/>
								<Select
									label='Admin'
									value={createUserForm.admin}
									onChange={({ target }) => setCreateUserForm({ ...createUserForm, admin: target.value })}
								>
									<option value='false'>No</option>
									<option value='true'>Yes</option>
								</Select>
								<Button
									disabled={!createUserForm.name || !createUserForm.email || !createUserForm.password}
									className='w-full'
									onClick={() => createUser()}
								>
									Add
								</Button>
							</div>
						) : null}
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
														backgroundImage: `url(${i.avatar || '/icons/avatar-default.png'})`,
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
												{i.id !== user.id && (
													<div className='my-4 flex items-center gap-2'>
														<Button onClick={() => loginAs(i.id, i.name)}>Login as {i.name}</Button>
														<Button onClick={() => makeAdmin(i.id)}>Make Admin</Button>
														<Button onClick={() => deleteUser(i.id)}>Delete User</Button>
													</div>
												)}
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
