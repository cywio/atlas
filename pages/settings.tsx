import { useState, useEffect } from 'react'
import { Input, Button, Nav } from '@components'
import { useApi, useValidSession } from '@hooks'
import toast from 'react-hot-toast'

export default function Settings() {
	const [user, setUser] = useState<any>({})
	const [ips, setIps] = useState<any>([])
	const [passwordForm, setPasswordForm] = useState<any>({
		show: false,
		old_password: '',
		new_password: '',
	})

	useEffect(() => {
		const hydrate = async () => {
			setUser(await useApi(`/api/auth`))
			setIps((await useApi(`/api/activity`)).map((i) => i.ip).filter((a, b, c) => c.indexOf(a) === b))
		}
		hydrate()
	}, [])

	async function updateUser() {
		await toast.promise(
			useApi(`/api/auth`, 'PATCH', {
				name: user.name,
				email: user.email,
				avatar: user.avatar,
			}),
			{
				loading: 'Updating...',
				success: () => {
					return 'Updated'
				},
				error: 'Error, please try again',
			}
		)
	}

	async function changePassword() {
		await toast.promise(
			useApi(`/api/auth/password`, 'POST', {
				old_password: passwordForm.old_password,
				new_password: passwordForm.new_password,
			}),
			{
				loading: 'Please wait...',
				success: () => {
					setPasswordForm({
						show: false,
						old_password: '',
						new_password: '',
					})
					return 'Password successfully changed'
				},
				error: () => {
					setPasswordForm({
						show: true,
						old_password: '',
						new_password: '',
					})
					return 'Incorrect current password, try again'
				},
			}
		)
	}

	return (
		<div className='max-w-6xl m-auto p-8'>
			<Nav active='settings' />
			<div className='flex'>
				<main className='bg-white rounded-lg shadow w-full p-10'>
					<div className='mb-8 flex items-center justify-between'>
						<b>Settings</b>
						<Button onClick={() => updateUser()}>Save Changes</Button>
					</div>
					<div className='grid grid-cols-2 grid-rows-2 gap-2 mb-12 w-full'>
						<Input label='Name' onChange={({ target }) => setUser({ ...user, name: target.value })} value={user.name} />
						<Input label='Email' onChange={({ target }) => setUser({ ...user, email: target.value })} value={user.email} />
						<Input
							label='Avatar URL'
							onChange={({ target }) => setUser({ ...user, avatar: target.value })}
							value={user.avatar}
						/>
						<Input label='Account ID' value={user.id} disabled />
					</div>
					<div className='w-96 mb-8'>
						<span>
							<b>Change Password</b>
						</span>
						{passwordForm.show ? (
							<div className='mt-4'>
								<Input
									label='Current Password'
									type='password'
									value={passwordForm.old_password}
									onChange={({ target }) => setPasswordForm({ ...passwordForm, old_password: target.value })}
								/>
								<Input
									label='New Password'
									type='password'
									value={passwordForm.new_password}
									onChange={({ target }) => setPasswordForm({ ...passwordForm, new_password: target.value })}
								/>
								<Button
									disabled={!passwordForm.old_password || !passwordForm.new_password}
									onClick={() => changePassword()}
								>
									Change
								</Button>
							</div>
						) : (
							<Button onClick={() => setPasswordForm({ ...passwordForm, show: true })}>Change Password</Button>
						)}
					</div>
					<div className='w-96 mb-8'>
						<div className='mb-4'>
							<b>Access IPs</b>
							<p>
								If you notice an IP that is not yours, take measures to secure your instance and replace your environment
								secrets.
							</p>
						</div>
						<p>{ips.join(', ')}</p>
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
