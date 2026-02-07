export default defineAppConfig({
    ui: {
        primary: 'emerald',
        notifications: {
            position: 'top-0 bottom-auto'
        },
        table: {
            divide: 'divide-y divide-gray-800',
            thead: '',
            tbody: 'divide-y divide-gray-800',
            tr: {
                base: 'hover:bg-gray-800/50',
            },
            th: {
                color: 'text-emerald-500',
                font: 'font-normal',
                padding: 'py-2 px-3',
            },
            td: {
                color: 'text-emerald-100',
                padding: 'py-2 px-3',
            },
        },
    }
})
