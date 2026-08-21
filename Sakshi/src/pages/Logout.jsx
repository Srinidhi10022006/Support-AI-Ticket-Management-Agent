import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { logoutUser } from '../auth/authStorage.js'

export default function Logout() {
  const navigate = useNavigate()

  useEffect(() => {
    logoutUser()
    navigate('/login', { replace: true })
  }, [navigate])

  return null
}

