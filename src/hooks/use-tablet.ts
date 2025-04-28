import * as React from 'react';

const TABLET_BREAKPOINT_MIN = 768;
const TABLET_BREAKPOINT_MAX = 1024;

export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean | undefined>(
    undefined
  );

  React.useEffect(() => {
    const mql = window.matchMedia(
      `(min-width: ${TABLET_BREAKPOINT_MIN}px) and (max-width: ${
        TABLET_BREAKPOINT_MAX - 1
      }px)`
    );
    const onChange = () => {
      setIsTablet(
        window.innerWidth >= TABLET_BREAKPOINT_MIN &&
          window.innerWidth < TABLET_BREAKPOINT_MAX
      );
    };
    mql.addEventListener('change', onChange);
    setIsTablet(
      window.innerWidth >= TABLET_BREAKPOINT_MIN &&
        window.innerWidth < TABLET_BREAKPOINT_MAX
    );
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return !!isTablet;
}
