import { LandingHeader } from '@/components/landingpage/landing-header';
import { LandingContent } from '@/components/landingpage/landing-content';
import { LandingFooter } from '@/components/landingpage/landing-footer';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      <LandingHeader />
      <LandingContent />
      <LandingFooter />
    </main>
  );
}
