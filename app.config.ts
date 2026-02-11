export default defineAppConfig({
    ui: {
        colors: {
            primary: 'emerald',
            neutral: 'gray'
        },
        input: {
            slots: {
                root: 'w-full',
                base: 'bg-gray-900/50'
            }
        },
        textarea: {
            slots: {
                root: 'w-full',
                base: 'bg-gray-900/50'
            }
        },
        button: {
            slots: {
                base: 'cursor-pointer'
            }
        }
    }
})
