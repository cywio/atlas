export function ProjectSidebar({ id, title, active }) {
	let activeTab = 'px-3 py-2 -mx-3 md:bg-gray-200 rounded-md transition font-bold'
	let inactiveTab = 'px-3 py-2 -mx-3 md:hover:bg-gray-200 hover:text-black md:hover:text-gray-500 rounded transition text-gray-500'
	return (
		<nav className='md:sticky top-0 flex flex-col w-full md:w-40 h-full max-h-screen px-2 py-3 text-sm lg:w-60 mr-8'>
			<h1>{title}</h1>
			<div className='flex flex-row md:flex-col w-full gap-4 md:gap-1 my-3 md:my-10 overflow-x-auto md:overflow-visible'>
				<a className={active === 'overview' ? activeTab : inactiveTab} href={`/project/${id}`}>
					<span className='md:inline-block'>Overview</span>
				</a>
				<a className={active === 'deployments' ? activeTab : inactiveTab} href={`/project/${id}/deployments`}>
					<span className='md:inline-block'>Deployments</span>
				</a>
				<a className={active === 'env' ? activeTab : inactiveTab} href={`/project/${id}/env`}>
					<span className='md:inline-block'>Environment</span>
				</a>
				<a className={active === 'realtime' ? activeTab : inactiveTab} href={`/project/${id}/realtime`}>
					<span className='md:inline-block'>Realtime</span>
				</a>
				<a className={active === 'settings' ? activeTab : inactiveTab} href={`/project/${id}/settings`}>
					<span className='md:inline-block'>Settings</span>
				</a>
			</div>
		</nav>
	)
}
