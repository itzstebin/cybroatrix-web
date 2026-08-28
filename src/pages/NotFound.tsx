import { Compass } from 'lucide-react';
import { useNavigate } from '../lib/router';
import { EmptyState } from '../components/ui/EmptyState';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-[70vh] flex items-center justify-center pt-16 px-4">
      <EmptyState
        icon={Compass}
        title="Page Not Found"
        description="The page you're looking for doesn't exist or may have moved."
        action={
          <button type="button" onClick={() => navigate('/')} className="btn-outline">
            BACK TO HOME
          </button>
        }
      />
    </div>
  );
}
