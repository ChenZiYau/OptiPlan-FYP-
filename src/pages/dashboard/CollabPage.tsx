import { Users } from 'lucide-react';

export function CollabPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 rounded-2xl bg-purple-900/20 border border-purple-500/30 flex items-center justify-center mb-4">
        <Users className="w-8 h-8 text-purple-400" />
      </div>
      <h2 className="text-xl font-display font-semibold text-white mb-2">Collaboration</h2>
      <p className="text-gray-400 text-sm max-w-md">
        Shared workspaces, team tasks, and real-time collaboration features are coming soon.
      </p>
    </div>
  );
}
