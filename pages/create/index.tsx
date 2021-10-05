import { useEffect, useState } from 'react'
import { useApi, useValidSession } from '@hooks'
import { Select, Nav, Button, Input, Textarea, Spinner } from '@components'

export default function Create() {
	const [loading, setLoading] = useState(false)
	const [user, setUser] = useState(null)
	const [repos, setRepos] = useState(null)
	const [selected, setSelected] = useState('')
	const [form, setForm] = useState({
		name: null,
		description: null,
	})
	const [sourceForm, setSourceForm] = useState({
		type: null,
		origin: null,
		branch: null,
	})

	useEffect(() => {
		const hydrate = async () => {
			setUser(await useApi('/api/auth'))
		}
		hydrate()
	}, [])

	useEffect(() => {
		const hydrate = async () => {
			setRepos(await useApi('/api/github/repos'))
		}
		sourceForm.type === 'github' && !repos && hydrate()
	}, [sourceForm.type])

	async function create() {
		setLoading(true)
		try {
			if (sourceForm.type === 'git') {
				let { id } = await useApi(`/api/projects/`, 'POST', { ...form })
				await useApi(`/api/projects/${id}/deployments`, 'POST', {
					type: sourceForm.type,
					origin: sourceForm.origin,
					branch: sourceForm.branch,
				})
				window.location.href = `/project/${id}`
			} else if (sourceForm.type === 'github') {
				let { id } = await useApi(`/api/projects/`, 'POST', { ...form })
				await useApi(`/api/projects/${id}/link`, 'POST', { repo_id: selected, branch: sourceForm.branch })
				await useApi(`/api/projects/${id}/deployments`, 'POST', { type: 'github' })
				window.location.href = `/project/${id}`
			}
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
						<option selected disabled>
							Select one
						</option>
						<option value='github'>Github Account</option>
						<option value='git'>Git URL</option>
					</Select>
					{!user && <Spinner />}
					{user && sourceForm.type == 'git' && (
						<Input
							label='Git Repo'
							placeholder='Git Repo URL'
							onChange={({ target }) => setSourceForm({ ...sourceForm, origin: target.value })}
							value={sourceForm.origin}
						/>
					)}
					{user && sourceForm.origin ? (
						<Input
							label='Branch'
							placeholder='master'
							onChange={({ target }) => setSourceForm({ ...sourceForm, branch: target.value })}
							value={sourceForm.branch}
						/>
					) : null}
					{user && sourceForm.type == 'github' && (
						<div className='flex flex-col gap-2'>
							{repos ? (
								repos.map((i) => {
									return (
										<div
											key={i}
											className={`flex justify-between gap-4 bg-white py-3.5 px-5 border rounded-lg items-center hover:bg-gray-50 hover:border-gray-300 hover:cursor-pointer transition ${
												selected === i.id && `bg-gray-50 border-gray-400`
											}`}
											onClick={() => {
												setSelected(i.id)
												setSourceForm({ ...sourceForm, branch: i.default_branch })
											}}
										>
											<div className='flex flex-col gap-3 w-full'>
												<div className='flex items-center justify-between gap-1'>
													<div className='flex items-center'>
														<img src={`/icons/github.svg`} className='w-8 mr-6' />
														<div className='flex gap-2'>
															<p>{i.name}</p>
															{i.private ? <img src={`/icons/lock.svg`} className='opacity-40 w-4' /> : null}
															{i.fork ? <img src={`/icons/fork.svg`} className='opacity-40 w-4' /> : null}
														</div>
													</div>
													<small className='opacity-40'>{i.language}</small>
												</div>
												{selected === i.id && (
													<Input
														label='Branch'
														value={sourceForm.branch}
														onChange={({ target }) => setSourceForm({ ...sourceForm, branch: target.value })}
													/>
												)}
											</div>
										</div>
									)
								})
							) : (
								<Spinner size={24} />
							)}
						</div>
					)}

					<Button
						loading={loading}
						disabled={
							loading ||
							!form.name ||
							!sourceForm.branch ||
							(sourceForm.type === 'git' && !sourceForm.origin) ||
							(sourceForm.type === 'github' && !selected)
						}
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
