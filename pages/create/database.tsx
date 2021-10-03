import { useState, useEffect } from 'react'
import { useApi, useValidSession } from '@hooks'
import { Spinner, Nav, Button, Input, Textarea, Select } from '@components'
import toast from 'react-hot-toast'

export default function Create() {
	let databases = [
		'mysql',
		'postgres',
		'mariadb',
		'mongo',
		'redis',
		'memcached',
		'rabbitmq',
		'couchdb',
		'rethinkdb',
		'elasticsearch',
		'clickhouse',
	]

	const [plugins, setPlugins] = useState([])
	const [selected, setSelected] = useState('')
	const [loading, setLoading] = useState(false)
	const [form, setForm] = useState({
		name: null,
		description: null,
		type: '',
		version: 'latest',
		is_custom_version: false,
	})

	useEffect(() => {
		const hydrate = async () => {
			setPlugins(await useApi('/api/plugins'))
		}
		hydrate()
	}, [])

	async function create() {
		setLoading(true)
		try {
			let { valid } = await useApi(`/api/verify_tag?image=${selected}&tag=${form.version}`)
			if (valid) {
				let { id } = await useApi(`/api/databases/`, 'POST', { ...form, type: selected })
				window.location.href = `/database/${id}`
			} else {
				toast.error(`Invalid tag for ${selected}`)
			}
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className='max-w-6xl m-auto p-8'>
			<Nav active={null} />
			<div className='max-w-md m-auto'>
				<b>Create Database</b>
				<div className='mt-8 flex flex-col gap-3'>
					<Input
						label='Database Name'
						placeholder='My Database'
						onChange={({ target }) => setForm({ ...form, name: target.value })}
						value={form.name}
					/>
					<Textarea
						label='Description (Optional)'
						placeholder='Describe your database'
						onChange={({ target }) => setForm({ ...form, description: target.value })}
						value={form.description}
					/>
					<p>Database</p>
					<div className='flex flex-col gap-2'>
						{plugins.length ? (
							plugins.map((i) => {
								return databases.includes(i) ? (
									<div
										className={`flex justify-between gap-4 bg-white py-3.5 px-5 border rounded-lg items-center hover:bg-gray-50 hover:border-gray-300 hover:cursor-pointer transition ${
											selected === i && `bg-gray-50 border-gray-400`
										}`}
										onClick={() => setSelected(i)}
									>
										<div className='flex flex-col gap-3 w-full'>
											<div className='flex items-center gap-1'>
												<img src={`/icons/${i}.svg`} className='w-8 mr-6' />
												<p className='capitalize'>{i}</p>
											</div>
											{selected === i && (
												<>
													<Select
														onChange={({ target }) =>
															setForm({
																...form,
																...(target.value === 'latest' && { version: 'latest' }),
																is_custom_version: target.value === 'custom',
															})
														}
													>
														<option value='latest'>Latest</option>
														<option selected={form.is_custom_version} value='custom'>
															Custom
														</option>
													</Select>
													{form.is_custom_version ? (
														<>
															<Input
																label='Tag'
																onChange={({ target }) => setForm({ ...form, version: target.value })}
															/>
															<small className='opacity-60'>
																Please enter the tag (version) of the image you want, do not include the
																image name.
															</small>
														</>
													) : null}
												</>
											)}
										</div>
									</div>
								) : null
							})
						) : (
							<Spinner size={24} />
						)}
						<Button loading={loading} disabled={loading || !form.name || !selected} onClick={() => create()}>
							Create Database
						</Button>
					</div>
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
