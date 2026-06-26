import { useState, useCallback } from 'react'

export function useAuthToken() {
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('adminAuthToken') || '')

  const updateAuthToken = useCallback((token) => {
    setAuthToken(token)
    if (token) {
      localStorage.setItem('adminAuthToken', token)
    } else {
      localStorage.removeItem('adminAuthToken')
    }
  }, [])

  const getFetchOptions = useCallback((options = {}) => ({
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
      ...(options.headers || {}),
    },
  }), [authToken])

  return { authToken, setAuthToken: updateAuthToken, getFetchOptions }
}
