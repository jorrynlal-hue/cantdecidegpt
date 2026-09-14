import { ThemeScope } from '@/lib/theme';
import LiveDashboardPreview from '@/components/demo/LiveDashboardPreview';

export default function DemoFramePage() {
  return (
    <ThemeScope>
      <div className="min-h-[110vh] bg-[#03040a] p-6 sm:p-10">
        <div className="mx-auto max-w-6xl">
          <LiveDashboardPreview />
        </div>
      </div>
    </ThemeScope>
  );
}