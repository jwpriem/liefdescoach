export type Student = {
  $id?: string
  email?: string
  name?: string
}

export const useOnBehalfOf = () => {
  const onBehalfOf = useState<Student | null>('onBehalfOf', () => null)

  function set(user: Student) {
    onBehalfOf.value = user
  }

  function clear() {
    onBehalfOf.value = null
  }

  return { onBehalfOf, set, clear }
}
