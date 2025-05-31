import { LandingHeader } from '@/components/layout/landing-page/LandingHeader';
import { LandingContent } from '@/components/layout/landing-page/LandingContent';
import { LandingFooter } from '@/components/layout/landing-page/LandingFooter';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      <LandingHeader />
      <LandingContent />
      <LandingFooter />
    </main>
  );
}
