export function ProjectSidebar({ id, title, active }) {
	let activeTab = 'px-3 py-2 -mx-3 bg-gray-200 rounded-md transition font-bold'
	let inactiveTab = 'px-3 py-2 -mx-3 hover:bg-gray-200 rounded transition text-gray-500'
	return (
		<nav className='sticky top-0 flex flex-col w-40 h-full max-h-screen px-2 py-3 text-sm lg:w-60 mr-8'>
			<h1>{title}</h1>
			<div className='flex flex-col w-full gap-1 my-3 md:my-10'>
				<a className={active === 'overview' ? activeTab : inactiveTab} href={`/project/${id}`}>
					<div className='w-full h-full flex items-center justify-center'></div>
					<span className='hidden md:inline-block'>Overview</span>
				</a>
				<a className={active === 'deployments' ? activeTab : inactiveTab} href={`/project/${id}/deployments`}>
					<div className='w-full h-full flex items-center justify-center'></div>
					<span className='hidden md:inline-block'>Deployments</span>
				</a>
				<a className={active === 'env' ? activeTab : inactiveTab} href={`/project/${id}/env`}>
					<div className='w-full h-full flex items-center justify-center'></div>
					<span className='hidden md:inline-block'>Environment</span>
				</a>
				<a className={active === 'realtime' ? activeTab : inactiveTab} href={`/project/${id}/realtime`}>
					<div className='w-full h-full flex items-center justify-center'></div>
					<span className='hidden md:inline-block'>Realtime</span>
				</a>
				<a className={active === 'settings' ? activeTab : inactiveTab} href={`/project/${id}/settings`}>
					<div className='w-full h-full flex items-center justify-center'></div>
					<span className='hidden md:inline-block'>Settings</span>
				</a>
			</div>
		</nav>
	)
}
