import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SessionProvider } from '@/components/platform/SessionProvider';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default async function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  const cs = await cookies();
  if (!cs.get('nexus_session')?.value) {
    redirect('/login');
  }
  return (
    <SessionProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </SessionProvider>
  );
}