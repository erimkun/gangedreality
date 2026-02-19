import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import ViewerContent from '@/components/ViewerContent'

export default function ViewerPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { projectExists, isLoading } = useProjectStore()
  const [checked, setChecked] = useState(false)

  // Redirect to home if no projectId
  useEffect(() => {
    if (!projectId) {
      navigate('/', { replace: true })
    }
  }, [projectId, navigate])

  // After project load attempt, redirect to editor if project doesn't exist
  useEffect(() => {
    if (!isLoading && checked && !projectExists && projectId) {
      navigate(`/${projectId}/editor`, { replace: true })
    }
  }, [isLoading, checked, projectExists, projectId, navigate])

  // Mark that we've initiated a check after first load completes
  useEffect(() => {
    if (!isLoading && projectId) {
      // Small delay to allow loadProject (called in ViewerContent) to finish
      const timer = setTimeout(() => setChecked(true), 100)
      return () => clearTimeout(timer)
    }
  }, [isLoading, projectId])

  if (!projectId) return null

  return <ViewerContent projectId={projectId} />
}
