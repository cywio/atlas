import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'

export function Dropdown({ children, items }) {
	return (
		<Menu as='div' className='z-10 relative inline-block text-left'>
			<div>
				<Menu.Button>{children}</Menu.Button>
			</div>
			<Transition
				as={Fragment}
				enter='transition ease-out duration-100'
				enterFrom='transform opacity-0 scale-95'
				enterTo='transform opacity-100 scale-100'
				leave='transition ease-in duration-75'
				leaveFrom='transform opacity-100 scale-100'
				leaveTo='transform opacity-0 scale-95'
			>
				<Menu.Items className='origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none'>
					<div className='py-1'>
						{items.map((i) => {
							return (
								<Menu.Item>
									<>
										<a
											{...i.action}
											className='hover:bg-gray-100 hover:text-gray-900 hover:cursor-pointer text-gray-700 block px-4 py-2 text-sm'
										>
											{i.text}
										</a>
										{i.seperate && <div className='border-b mb-2 pb-2' />}
									</>
								</Menu.Item>
							)
						})}
					</div>
				</Menu.Items>
			</Transition>
		</Menu>
	)
}
