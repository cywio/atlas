import { useState } from 'react'
import { Input, Button, Nothing } from '@components'
import { useApi } from '@hooks'
import { toast } from 'react-hot-toast'
import prisma from '@server/db'
import cookie from 'js-cookie'

export default function Setup({ setup_key }) {
	const [form, setForm] = useState({
		name: null,
		email: null,
		password: null,
		setup_key,
	})
	const [loading, setLoading] = useState(false)

	async function complete() {
		setLoading(true)
		try {
			let { token } = await useApi('/api/setup', 'POST', form)
			cookie.set('session', token)
			window.location.href = '/'
		} catch {
			setLoading(false)
			toast.error('Something went wrong, try again')
		}
	}

	return (
		<div className='grid place-items-center min-h-screen'>
			<div className='w-96 p-7'>
				{!setup_key ? (
					<Nothing className='border-none' text='Invalid setup key' />
				) : (
					<>
						<>
							<div className='flex flex-col gap-3 mb-6'>
								<h1>👋 Hello</h1>
								<p>Please fill out this form to create your account and get started.</p>
							</div>
							<Input
								type='text'
								label='Display Name'
								disabled={loading}
								onChange={({ target }) => setForm({ ...form, name: target.value })}
							/>
							<Input
								type='email'
								label='Email'
								disabled={loading}
								onChange={({ target }) => setForm({ ...form, email: target.value })}
							/>
							<Input
								type='password'
								label='Password'
								disabled={loading}
								onChange={({ target }) => setForm({ ...form, password: target.value })}
							/>
						</>
						<div className='mt-6'>
							<Button
								onClick={() => complete()}
								loading={loading}
								disabled={!form.name || !form.email || !form.password}
								className='w-full'
							>
								Complete Setup
							</Button>
						</div>
					</>
				)}
			</div>
		</div>
	)
}

export async function getServerSideProps(context) {
	let { key } = context.query
	let exists = await prisma.accounts.count()
	return {
		props: {
			setup_key: key && key === process.env.SETUP_KEY && !!!exists ? key : null,
		},
	}
}
