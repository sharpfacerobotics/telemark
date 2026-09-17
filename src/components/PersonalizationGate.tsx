import React, {useEffect, useState, type ReactNode} from 'react';
import {useHistory, useLocation} from '@docusaurus/router';
import {useAuth} from '@site/src/telemark/useAuth';
import {useLearnerProfile} from '@site/src/telemark/useLearnerProfile';
import {useTelemarkAccount} from '@site/src/telemark/useTelemarkAccount';
import {useBasePath} from '@site/src/telemark/useBasePath';
import {signOut} from 'firebase/auth';
import {auth} from '@site/src/telemark/firebase';
import styles from './PersonalizationGate.module.css';

const EXEMPT_ROUTES = ['/admin', '/login', '/personalize'];
const CURRICULUM_ROUTES = ['/docs', '/blocks', '/mechanical', '/simulator', '/dashboard'];

function withoutTrailingSlash(pathname: string): string {
  return pathname.replace(/\/+$/, '') || '/';
}

export function isCurriculumRoute(pathname: string, baseRoot: string): boolean {
  const path = withoutTrailingSlash(pathname);
  const root = withoutTrailingSlash(baseRoot);
  const relativePath = root !== '/' && (path === root || path.startsWith(`${root}/`))
    ? path.slice(root.length) || '/'
    : path;
  return CURRICULUM_ROUTES.some((route) =>
    relativePath === route || relativePath.startsWith(`${route}/`),
  );
}

export default function PersonalizationGate({children}: {children: ReactNode}): React.JSX.Element {
  const {user, loading: authLoading} = useAuth();
  const {status: profileStatus, error: profileError, refresh: refreshProfile} = useLearnerProfile();
  const {
    status: accountStatus,
    error: accountError,
    refresh: refreshAccount,
  } = useTelemarkAccount();
  const [dismissedError, setDismissedError] = useState(false);
  const location = useLocation();
  const history = useHistory();
  const basePath = useBasePath();

  useEffect(() => {
    if (authLoading || !user) return;
    if (profileStatus === 'loading' || accountStatus === 'loading') return;
    if (profileStatus !== 'absent' && accountStatus !== 'absent') return;
    if (withoutTrailingSlash(location.pathname) === withoutTrailingSlash(basePath('/'))) return;
    if (EXEMPT_ROUTES.some((route) => location.pathname.endsWith(route))) return;
    if (!isCurriculumRoute(location.pathname, basePath('/'))) return;
    const next = `${location.pathname}${location.search}${location.hash}`;
    history.replace(basePath(`/personalize?next=${encodeURIComponent(next)}`));
  }, [
    accountStatus,
    authLoading,
    basePath,
    history,
    location,
    profileStatus,
    user,
  ]);

  const setupError = accountError ?? profileError;
  const hasSetupError = accountStatus === 'error' || profileStatus === 'error';

  async function retrySetup() {
    await Promise.all([refreshAccount(), refreshProfile()]);
  }

  return (
    <>
      {user && hasSetupError && !dismissedError && (
        <aside className={styles.notice} role="status">
          <span>{setupError ?? 'Your account setup could not be loaded.'} Public lessons and local progress are still available.</span>
          <span className={styles.actions}>
            <button type="button" onClick={() => void retrySetup()}>Retry</button>
            <button type="button" onClick={() => setDismissedError(true)}>Continue to public lessons</button>
            <button type="button" onClick={() => void signOut(auth)}>Sign out</button>
          </span>
        </aside>
      )}
      {children}
    </>
  );
}
