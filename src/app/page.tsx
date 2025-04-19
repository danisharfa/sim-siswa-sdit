import { LandingHeader } from '@/components/landing-page/landing-header';
import { LandingContent } from '@/components/landing-page/landing-content';
import { LandingFooter } from '@/components/landing-page/landing-footer';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      <LandingHeader />
      <LandingContent />
      <LandingFooter />
    </main>
  );
}
