'use client';

import { IntegrationsSpace } from '@/components/projects/IntegrationsSpace';

export default function IntegrationsPage() {
  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-lg font-bold">Integrations</h1>
        <p className="text-xs text-gray-500 mt-0.5">The connected space — one line for your channels, one line for the AI engine. Channel handshakes are honest simulations (no external side effects); connecting stores a token for this workspace. AI providers go live when an API key is configured in Settings → AI provider.</p>
      </div>
      <IntegrationsSpace />
    </div>
  );
}