export function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="text-sm text-muted-foreground text-center">
            <span>&copy; {currentYear} SDIT Ulul Albab Mataram. All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}