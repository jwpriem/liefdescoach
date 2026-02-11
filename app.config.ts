export default defineAppConfig({
    ui: {
        colors: {
            primary: 'emerald',
            neutral: 'gray'
        },
        input: {
            slots: {
                root: 'w-full'
            }
        },
        textarea: {
            slots: {
                root: 'w-full'
            }
        },
        button: {
            slots: {
                base: 'cursor-pointer'
            }
        }
    }
})
