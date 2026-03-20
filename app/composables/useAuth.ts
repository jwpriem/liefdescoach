export type User = {
  $id: string
  email: string
  name: string
  phone?: string
  dateOfBirth?: string
  archived?: boolean
  reminders?: boolean
  pushNotifications?: boolean
  labels?: string[]
  registration?: string
  emailVerification?: boolean
  health?: {
    $id?: string
    injury?: string
    pregnancy?: boolean
    dueDate?: string
  } | null
}

export const useAuth = () => {
  const { data: user, refresh, status } = useAsyncData<User | null>('user', async () => {
    try {
      const me = await $fetch<User>('/api/auth/me')
      try {
        const { health, dateOfBirth, phone } = await $fetch<any>('/api/health/me')
        return { ...me, health, dateOfBirth, phone }
      } catch {
        return me
      }
    } catch {
      return null
    }
  })

  const isAdmin = computed(() => user.value?.labels?.includes('admin') ?? false)
  const pending = computed(() => status.value === 'pending')

  async function login(email: string, password: string) {
    await $fetch('/api/auth/login', { method: 'POST', body: { email, password } })
    await refresh()
    return user.value
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    clearNuxtData(['my-credits', 'my-bookings', 'admin-users', 'admin-lessons', 'lessons', 'credit-summary'])
  }

  async function sendOtp(email: string) {
    await $fetch('/api/auth/send-otp', { method: 'POST', body: { email } })
  }

  async function verifyOtp(email: string, code: string) {
    await $fetch('/api/auth/verify-otp', { method: 'POST', body: { email, code } })
    await refresh()
    return user.value
  }

  async function register(email: string, password: string, name: string, phone: string, dateOfBirth?: string | null, injury?: string | null) {
    const res = await $fetch<{ user: { $id: string; name: string; email: string } }>('/api/auth/register', {
      method: 'POST',
      body: { email, password, name, phone: phone || null, dateOfBirth }
    })
    await refresh()
    await $fetch('/api/credits/welcome', { method: 'POST', body: { studentId: res.user.$id } })
    if (injury) {
      await $fetch('/api/health/update', {
        method: 'POST',
        body: { userId: res.user.$id, injury, pregnancy: false, dueDate: null }
      })
      await refresh()
    }
    await $fetch('/api/mail/send', {
      method: 'POST',
      body: {
        type: 'new-user',
        data: { name: res.user.name, email: res.user.email, phone: phone || '', date: new Date().toLocaleDateString('nl-NL') }
      }
    })
    return user.value
  }

  async function requestEmailVerification() {
    await $fetch('/api/auth/request-verification', { method: 'POST' })
  }

  async function verifyEmail(token: string) {
    await $fetch('/api/auth/verify-email', { method: 'POST', body: { token } })
    await refresh()
  }

  async function updateProfile(data: { name?: string; email?: string; phone?: string | null; dateOfBirth?: string | null; userId?: string }) {
    if (data.email) {
      await $fetch('/api/auth/update-profile', { method: 'POST', body: { email: data.email } })
    } else {
      await $fetch('/api/students/update-profile', { method: 'POST', body: data })
    }
    await refresh()
  }

  async function updatePassword(password: string, newPassword: string) {
    await $fetch('/api/auth/update-password', { method: 'POST', body: { password, newPassword } })
    await refresh()
  }

  async function updateReminders(userId: string, reminders: boolean) {
    await $fetch('/api/updatePrefs', { method: 'POST', body: { userId, reminders } })
    await refresh()
  }

  async function updateHealth(userId: string, healthData: any) {
    await $fetch('/api/health/update', { method: 'POST', body: { userId, ...healthData } })
    await refresh()
  }

  return {
    user, isAdmin, pending, refresh,
    login, logout, sendOtp, verifyOtp, register,
    requestEmailVerification, verifyEmail,
    updateProfile, updatePassword, updateReminders, updateHealth
  }
}
