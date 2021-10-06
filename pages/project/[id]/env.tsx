import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Input, Button, ProjectSidebar, Nav, Select } from '@components'
import { useApi, useValidSession, useInterval } from '@hooks'
import toast from 'react-hot-toast'

export default function Project() {
	const [project, setProject] = useState<any>({})
	const [ports, setPorts] = useState<any>([])
	const [domains, setDomains] = useState<any>([])
	const [envVar, setEnvVar] = useState<any>([])
	const [links, setLinks] = useState<any>([])
	const [databases, setDatabases] = useState<any>([])
	const [user, setUser] = useState<any>({})

	const [domainForm, setDomainForm] = useState<any>({ domain: null })
	const [envVarForm, setEnvVarForm] = useState<any>({ key: null, value: null })
	const [portsForm, setPortsForm] = useState<any>({ scheme: null, host: null, container: null })
	const [databaseSelect, setDatabaseSelect] = useState<any>('')

	const router = useRouter()
	let { id } = router.query

	const hydrate = async () => {
		if (id) setProject(await useApi(`/api/projects/${id}`))
		if (id) setDatabases(await useApi(`/api/databases`))
		if (id) setEnvVar(await useApi(`/api/projects/${id}/env`))
		if (id) setDomains(await useApi(`/api/projects/${id}/domains`))
		if (id) setPorts(await useApi(`/api/projects/${id}/ports`))
		if (id) setLinks(await useApi(`/api/projects/${id}/link/database`))
		if (id) setUser(await useApi(`/api/auth`))
	}

	useEffect(() => {
		hydrate()
	}, [id])

	useEffect(() => {
		setDatabases((databases) => [...databases.filter((a) => !links.map((b) => b.databases.id).includes(a.id))])
	}, [links])

	useInterval(
		async () => {
			if (id) setDomains(await useApi(`/api/projects/${id}/domains`))
		},
		domains.map((i) => i.certs[0] && i.certs[0].status).includes('REQUESTING') ? 3000 : null
	)

	async function addEnvVar() {
		await toast.promise(
			useApi(`/api/projects/${id}/env`, 'POST', {
				key: envVarForm.key,
				value: envVarForm.value,
			}),
			{
				loading: 'Adding...',
				success: () => {
					setEnvVarForm({
						key: '',
						value: '',
					})
					hydrate()
					return 'Added successfully'
				},
				error: 'Error, please try again',
			}
		)
	}

	async function deleteEnvVar(envId) {
		await toast.promise(useApi(`/api/projects/${id}/env/${envId}?restart=false`, 'DELETE'), {
			loading: 'Removing...',
			success: () => {
				hydrate()
				return 'Removed successfully, container was not restarted'
			},
			error: 'Error, please try again',
		})
	}

	async function addDomain() {
		setDomainForm({
			domain: '',
		})
		await toast.promise(
			useApi(`/api/projects/${id}/domains`, 'POST', {
				domain: domainForm.domain,
			}),
			{
				loading: 'Adding...',
				success: () => {
					hydrate()
					return 'Added domain successfully'
				},
				error: 'Error, please try again',
			}
		)
	}

	async function deleteDomain(domainId) {
		await toast.promise(useApi(`/api/projects/${id}/domains/${domainId}`, 'DELETE'), {
			loading: 'Removing...',
			success: () => {
				hydrate()
				return 'Domain removed successfully'
			},
			error: 'Error, please try again',
		})
	}

	async function addPortMapping() {
		setPortsForm({
			scheme: '',
			host: '',
			container: '',
		})
		await toast.promise(
			useApi(`/api/projects/${id}/ports`, 'POST', {
				scheme: portsForm.scheme,
				host: portsForm.host,
				container: portsForm.container,
			}),
			{
				loading: 'Adding...',
				success: () => {
					hydrate()
					return 'Added port successfully'
				},
				error: 'Error, please try again',
			}
		)
	}

	async function deletePortMapping(portId) {
		await toast.promise(useApi(`/api/projects/${id}/ports/${portId}`, 'DELETE'), {
			loading: 'Removing...',
			success: () => {
				hydrate()
				return 'Port removed successfully'
			},
			error: 'Error, please try again',
		})
	}

	async function issueCertificate(domainId) {
		await toast.promise(useApi(`/api/projects/${id}/domains/${domainId}/certs`, 'POST', { email: user.email }), {
			loading: 'Issuing certificate, this can take a while',
			success: () => {
				hydrate()
				return 'Issuing certificate, this can take a while.'
			},
			error: 'Error, please try again',
		})
	}

	async function maintenanceMode() {
		await toast.promise(useApi(`/api/projects/${id}/maintenance`, 'POST'), {
			loading: 'Please wait...',
			success: () => {
				hydrate()
				return `Turned ${project.maintenance ? 'off' : 'on'}`
			},
			error: 'Error, please try again',
		})
	}

	async function attachDatabase() {
		await toast.promise(useApi(`/api/projects/${project.id}/link/database`, 'POST', { database_id: databaseSelect }), {
			loading: 'Linking...',
			success: () => {
				setDatabaseSelect('')
				hydrate()
				return 'Successfully Linked'
			},
			error: 'Error, please try again',
		})
	}

	async function detachDatabase(database_id) {
		await toast.promise(useApi(`/api/projects/${project.id}/link/database`, 'DELETE', { database_id }), {
			loading: 'Unlinking...',
			success: () => {
				setDatabaseSelect('')
				hydrate()
				return 'Successfully unlinked'
			},
			error: 'Error, please try again',
		})
	}

	return (
		<div className='max-w-6xl m-auto p-8'>
			<Nav active={null} />
			<div className='flex flex-col md:flex-row'>
				<ProjectSidebar id={project.id} active='env' title={project.name} />
				<main className='bg-white rounded-lg shadow w-full p-10'>
					<div className='mb-8'>
						<h1>Environment</h1>
					</div>
					<div className='flex flex-col gap-2 mb-12 w-96'>
						<b>Ports</b>
						<div style={{ gridTemplateColumns: '4fr 4fr 4fr 1fr' }} className='grid gap-2 mt-4'>
							{ports.length === 0 ? <span className='opacity-40 text-sm'>No ports</span> : null}
							{ports.length !== 0 && (
								<>
									<>
										<p className='opacity-40'>Scheme</p>
										<p className='opacity-40'>Host</p>
										<p className='opacity-40'>Container</p>
										<p></p>
									</>
									{ports.map((i) => {
										return (
											<>
												<p>{i.scheme}</p>
												<p>{i.host}</p>
												<p>{i.container}</p>
												<a
													onClick={() => deletePortMapping(i.id)}
													className='hover:opacity-40 hover:cursor-pointer transition'
												>
													<img src='/icons/delete.svg' />
												</a>
											</>
										)
									})}
								</>
							)}
						</div>
						<div className='grid gap-2 mt-6'>
							<Input
								label='Scheme'
								onChange={({ target }) => setPortsForm({ ...portsForm, scheme: target.value })}
								value={portsForm.scheme}
							/>
							<Input
								label='Host'
								onChange={({ target }) => setPortsForm({ ...portsForm, host: target.value })}
								value={portsForm.host}
							/>
							<Input
								label='Container'
								onChange={({ target }) => setPortsForm({ ...portsForm, container: target.value })}
								value={portsForm.container}
							/>
						</div>
						<Button onClick={() => addPortMapping()} disabled={!portsForm.scheme || !portsForm.host || !portsForm.container}>
							Add
						</Button>
					</div>
					<hr className='my-8' />
					<div className='flex flex-col gap-2 mb-12 w-96'>
						<b>Domains</b>
						<div className='my-2 flex flex-col gap-4'>
							{domains &&
								domains.map((i) => {
									return (
										<div style={{ gridTemplateColumns: '7fr 5fr 1fr' }} className='grid gap-5'>
											<b>{i.domain}</b>
											<div className='flex align-items gap-1.5'>
												{i.certs && i.certs.length !== 0 ? (
													i.certs[0].status === 'ISSUED' ? (
														<span className='flex items-center gap-2'>
															<img src='/icons/lock.svg' width='16px' />
															<p className='text-xs'>Certificate Isssued</p>
														</span>
													) : (
														<span className='animate-pulse'>
															<span className='flex items-center gap-2 opacity-50'>
																<img src='/icons/lock.svg' width='16px' />
																<p className='text-xs'>Provisioning...</p>
															</span>
														</span>
													)
												) : (
													<span className='flex items-center gap-2 opacity-40 hover:opacity-100 transition hover:cursor-pointer'>
														<img src='/icons/lock.svg' width='16px' />
														<a onClick={() => issueCertificate(i.id)} className='text-xs underline'>
															Issue Certificate
														</a>
													</span>
												)}
											</div>
											<a
												onClick={() => deleteDomain(i.id)}
												className='hover:opacity-40 hover:cursor-pointer transition'
											>
												<img src='/icons/delete.svg' />
											</a>
										</div>
									)
								})}
						</div>
						<Input
							label='Domain'
							onChange={({ target }) => setDomainForm({ ...domainForm, domain: target.value })}
							value={domainForm.domain}
						/>
						<Button onClick={() => addDomain()} disabled={!domainForm.domain}>
							Add
						</Button>
						<small className='mt-4 opacity-60'>
							Issuing certificates will cause a single certificate to contain the common names of all domains on the project,
							remove any domains you don't want included in the certificate
						</small>
					</div>
					<hr className='my-8' />
					<div className='flex flex-col gap-2 mb-12 w-96'>
						<b>Environment Variables</b>
						<div style={{ gridTemplateColumns: '10fr 9fr 1fr' }} className='grid gap-2 mt-4'>
							{envVar.length === 0 ? <span className='opacity-40 text-sm'>No environment variables</span> : null}
							{envVar &&
								envVar.map((i) => {
									return (
										<>
											<p>{i.key}</p>
											<p className='blur-sm hover:blur-none'>{i.value}</p>
											<a
												onClick={() => deleteEnvVar(i.id)}
												className='hover:opacity-40 hover:cursor-pointer transition'
											>
												<img src='/icons/delete.svg' />
											</a>
										</>
									)
								})}
						</div>
						<div className='grid grid-cols-2 gap-2 mt-6'>
							<Input
								label='Key'
								onChange={({ target }) => setEnvVarForm({ ...envVarForm, key: target.value })}
								value={envVarForm.key}
							/>
							<Input
								label='Value'
								onChange={({ target }) => setEnvVarForm({ ...envVarForm, value: target.value })}
								value={envVarForm.value}
							/>
						</div>
						<Button onClick={() => addEnvVar()} disabled={!envVarForm.key || !envVarForm.value}>
							Add
						</Button>
					</div>
					<hr className='my-8' />
					<div className='flex flex-col gap-2 mb-12 w-96'>
						<b>Linked Databases</b>
						<div style={{ gridTemplateColumns: '12fr 1fr' }} className='grid gap-2 mt-4'>
							{links.length === 0 ? <span className='opacity-40 text-sm'>No linked databases</span> : null}
							{links &&
								links.map((i) => {
									return (
										<>
											<div className='flex items-center'>
												<img src={`/icons/${i.databases.type}.svg`} className='w-4 mr-3' />
												<p>{i.databases.name}</p>
											</div>
											<a
												onClick={() => detachDatabase(i.databases.id)}
												className='hover:opacity-40 hover:cursor-pointer transition'
											>
												<img src='/icons/delete.svg' />
											</a>
										</>
									)
								})}
						</div>
						<div className='mt-6'>
							{!databases.length ? <span className='opacity-40 text-sm'>No databases available to link</span> : null}
							{databases.length ? (
								<Select onChange={({ target }) => setDatabaseSelect(target.value)}>
									<option selected={databaseSelect === ''} disabled>
										Select a database
									</option>
									{databases.map((i) => {
										return <option value={i.id}>{i.name}</option>
									})}
								</Select>
							) : null}
						</div>
						<Button onClick={() => attachDatabase()} disabled={!databaseSelect}>
							Link
						</Button>
					</div>
					<hr className='my-8' />
					<div className='flex flex-col gap-2 mb-12 w-96'>
						<b>Maintenance Mode</b>
						<p>Maintenance mode will show a maintenance screen on all paths of your app until turned off</p>
						<Button onClick={() => maintenanceMode()}>Turn {project.maintenance ? 'off' : 'on'}</Button>
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
