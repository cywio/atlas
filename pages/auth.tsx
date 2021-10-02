import { useState } from 'react'
import { Input, Button } from '@components'
import { useApi } from '@hooks'
import toast from 'react-hot-toast'
import cookie from 'js-cookie'

export default function Auth() {
	const [form, setForm] = useState({ email: null, password: null, mfa: null })
	const [loading, setLoading] = useState(false)
	const [mfa, setMfa] = useState(false)

	async function login() {
		setLoading(true)
		try {
			let { token } = await useApi('/api/auth', 'POST', form)
			if (token === 'mfa') {
				setMfa(true)
				setLoading(false)
			} else {
				cookie.set('session', token)
				window.location.href = '/'
			}
		} catch {
			setLoading(false)
			toast.error('Incorrect credentials')
		}
	}

	return (
		<div className='grid place-items-center min-h-screen'>
			<div className='w-96 p-7'>
				{mfa ? (
					<div className='flex flex-col gap-5'>
						<p>Enter the one time password from your authenticator app</p>
						<Input
							type='text'
							disabled={loading}
							label='Code'
							onChange={({ target }) => setForm({ ...form, mfa: target.value })}
						/>
					</div>
				) : (
					<>
						<Input
							type='email'
							disabled={loading}
							label='Email'
							onChange={({ target }) => setForm({ ...form, email: target.value })}
						/>
						<Input
							type='password'
							disabled={loading}
							label='Password'
							onChange={({ target }) => setForm({ ...form, password: target.value })}
						/>
					</>
				)}
				<div className='mt-6'>
					<Button
						className='w-full'
						loading={loading}
						disabled={loading || !form.email || !form.password}
						onClick={() => login()}
					>
						Login
					</Button>
				</div>
			</div>
		</div>
	)
}
