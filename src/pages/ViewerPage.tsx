import { useParams } from 'react-router-dom'
import ViewerContent from '@/components/ViewerContent'

export default function ViewerPage() {
  const { projectId } = useParams<{ projectId: string }>()
  
  return <ViewerContent projectId={projectId} />
}
