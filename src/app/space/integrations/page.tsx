'use client';

import { IntegrationsSpace, SAMPLE_CHANNELS, SAMPLE_PROVIDERS, SAMPLE_STATUS } from '@/components/projects/IntegrationsSpace';

export default function SpaceIntegrationsPage() {
  return <IntegrationsSpace channels={SAMPLE_CHANNELS} providers={SAMPLE_PROVIDERS} providerStatus={SAMPLE_STATUS} />;
}