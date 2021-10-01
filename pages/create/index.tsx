import { useState } from 'react'
import { useApi, useValidSession } from '@hooks'
import { Select, Nav, Button, Input, Textarea } from '@components'

export default function Create() {
	const [loading, setLoading] = useState(false)
	const [form, setForm] = useState({
		name: null,
		description: null,
	})
	const [sourceForm, setSourceForm] = useState({
		type: 'git',
		origin: null,
		branch: null,
	})

	async function create() {
		setLoading(true)
		try {
			let { id } = await useApi(`/api/projects/`, 'POST', { ...form })
			await useApi(`/api/projects/${id}/deployments`, 'POST', {
				type: sourceForm.type,
				origin: sourceForm.origin,
				branch: sourceForm.branch,
			})
			window.location.href = `/project/${id}`
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className='max-w-6xl m-auto p-8'>
			<Nav active={null} />
			<div className='max-w-md m-auto'>
				<b>Create Project</b>
				<div className='mt-8 flex flex-col gap-3 mb-8'>
					<Input
						label='Project Name'
						placeholder='My Project'
						onChange={({ target }) => setForm({ ...form, name: target.value })}
						value={form.name}
					/>
					<Textarea
						label='Description (Optional)'
						placeholder='Describe your project'
						onChange={({ target }) => setForm({ ...form, description: target.value })}
						value={form.description}
					/>
					<Select label='Source Type' onChange={({ target }) => setSourceForm({ ...sourceForm, type: target.value })}>
						<option value='git'>Git URL</option>
					</Select>
					<Input
						label='Git Repo'
						placeholder='Git Repo URL'
						onChange={({ target }) => setSourceForm({ ...sourceForm, origin: target.value })}
						value={sourceForm.origin}
					/>
					{sourceForm.origin ? (
						<Input
							label='Branch'
							placeholder='master'
							onChange={({ target }) => setSourceForm({ ...sourceForm, branch: target.value })}
							value={sourceForm.branch}
						/>
					) : null}
					<Button
						loading={loading}
						disabled={loading || !form.name || !sourceForm.branch || !sourceForm.origin}
						onClick={() => create()}
					>
						Create Project
					</Button>
				</div>
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
