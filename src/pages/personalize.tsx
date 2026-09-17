import React, {useEffect, useRef, useState} from 'react';
import Link from '@docusaurus/Link';
import {useHistory} from '@docusaurus/router';
import Layout from '@theme/Layout';
import {signOut} from 'firebase/auth';
import {auth} from '@site/src/telemark/firebase';
import {useAuth} from '@site/src/telemark/useAuth';
import {useLearnerProfile} from '@site/src/telemark/useLearnerProfile';
import {
  profileDestination,
  type LearnerProfile,
  type SoftwareLevel,
} from '@site/src/telemark/profile';
import type {MainTrackId} from '@site/src/telemark/tracks';
import {BLOCKS_LESSONS} from '@site/src/telemark/blocksCurriculum';
import {useProgress} from '@site/src/telemark/useProgress';
import {trackEvent} from '@site/src/telemark/analytics';
import {useBasePath} from '@site/src/telemark/useBasePath';
import {useTelemarkAccount} from '@site/src/telemark/useTelemarkAccount';
import type {AccountRole} from '@site/src/telemark/classroom';
import styles from './personalize.module.css';

const LEVELS: Array<{id: SoftwareLevel; title: string; description: string}> = [
  {
    id: 'complete_beginner',
    title: 'Complete beginner',
    description: 'I have not built a program yet, or I do not know variables, decisions, and loops.',
  },
  {
    id: 'block_experience',
    title: 'Block coding experience',
    description: 'I have built projects with blocks and know variables, conditions, and loops.',
  },
  {
    id: 'text_experience',
    title: 'Text-code experience',
    description: 'I can write a small program in Python, JavaScript, Java, or another language.',
  },
];

export default function PersonalizePage(): React.JSX.Element {
  const {user, loading: authLoading} = useAuth();
  const {profile, status, error: profileError, saveProfile} = useLearnerProfile();
  const {
    account,
    status: accountStatus,
    error: accountError,
    saveAccount,
  } = useTelemarkAccount();
  const {markManyAutoComplete, clearAutoCompleted} = useProgress(user);
  const [role, setRole] = useState<AccountRole | null>(null);
  const [username, setUsername] = useState('');
  const [tracks, setTracks] = useState<MainTrackId[]>([]);
  const [softwareLevel, setSoftwareLevel] = useState<SoftwareLevel | null>(null);
  const [blockExperienceChoice, setBlockExperienceChoice] = useState<'python' | 'java' | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialized = useRef(false);
  const accountInitialized = useRef(false);
  const history = useHistory();
  const basePath = useBasePath();

  useEffect(() => {
    if (accountInitialized.current || accountStatus !== 'ready' || !account) return;
    accountInitialized.current = true;
    setRole(account.role);
    setUsername(account.username);
  }, [account, accountStatus]);

  useEffect(() => {
    if (initialized.current || status !== 'ready' || !profile) return;
    initialized.current = true;
    setTracks(profile.selectedTracks);
    setSoftwareLevel(profile.softwareLevel ?? null);
    setBlockExperienceChoice(
      profile.softwareLevel === 'block_experience'
        && (profile.postBlocksChoice === 'python' || profile.postBlocksChoice === 'java')
        ? profile.postBlocksChoice
        : null,
    );
  }, [profile, status]);

  function toggleTrack(track: MainTrackId) {
    setTracks((current) => current.includes(track)
      ? current.filter((item) => item !== track)
      : [...current, track]);
    if (track === 'software' && tracks.includes('software')) setSoftwareLevel(null);
    setError(null);
  }

  async function save() {
    if (!user) return;
    if (!role) {
      setError('Choose whether this account belongs to a student or coach.');
      return;
    }
    if (!username.trim()) {
      setError('Choose a username so coaches and students can find the right account.');
      return;
    }
    if (tracks.length === 0) {
      setError('Choose Software, Mechanical, or both.');
      return;
    }
    if (role === 'student' && tracks.includes('software') && !softwareLevel) {
      setError('Choose the software level that best matches your current experience.');
      return;
    }
    if (role === 'student' && softwareLevel === 'block_experience' && !blockExperienceChoice) {
      setError('Choose the optional Python bridge or continue directly to FTC Java.');
      return;
    }

    const savedSoftwareLevel = role === 'coach' ? 'text_experience' : softwareLevel;

    const nextProfile: LearnerProfile = {
      version: 1,
      selectedTracks: tracks,
      ...(tracks.includes('software') ? {
        softwareLevel: savedSoftwareLevel!,
        blocksPlacement: savedSoftwareLevel === 'complete_beginner'
          ? 'required' as const
          : 'auto_completed' as const,
      } : {}),
      ...(savedSoftwareLevel === 'block_experience'
        ? {postBlocksChoice: blockExperienceChoice!}
        : profile?.postBlocksChoice ? {postBlocksChoice: profile.postBlocksChoice} : {}),
      onboardingComplete: true,
    };

    setSaving(true);
    setError(null);
    try {
      const savedAccount = await saveAccount(role, username);
      setUsername(savedAccount.username);
      const saved = await saveProfile(nextProfile);
      if (savedAccount.role === 'student') {
        const blockIds = BLOCKS_LESSONS.map((lesson) => lesson.id);
        if (saved.blocksPlacement === 'auto_completed') {
          await markManyAutoComplete(blockIds);
        } else if (saved.blocksPlacement === 'required') {
          await clearAutoCompleted(blockIds);
        }
      }
      trackEvent('personalization_complete', {
        account_role: savedAccount.role,
        tracks: saved.selectedTracks.join(','),
        software_level: saved.softwareLevel ?? 'not_selected',
        blocks_exit_choice: saved.softwareLevel === 'block_experience'
          ? saved.postBlocksChoice ?? 'not_selected'
          : 'not_applicable',
      });
      history.push(basePath(
        savedAccount.role === 'coach' ? '/dashboard' : profileDestination(saved),
      ));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not save your learning path.');
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || status === 'loading' || accountStatus === 'loading') {
    return <Layout title="Personalize · Telemark"><main className={styles.page}>Loading your account...</main></Layout>;
  }

  if (!user) {
    return (
      <Layout title="Personalize · Telemark">
        <main className={styles.page}>
          <section className={styles.card}>
            <h1>Sign in to save a learning path</h1>
            <p>The same lessons and local progress remain available without an account.</p>
            <Link className={styles.primary} to="/login">Sign in with Google</Link>
          </section>
        </main>
      </Layout>
    );
  }

  return (
    <Layout title="Your Learning Path · Telemark" description="Choose the Telemark curricula that match your role and experience.">
      <main className={styles.page}>
        <section className={styles.card}>
          <h1>{account && profile ? 'Edit your account' : 'Set up your account'}</h1>
          <p className={styles.intro}>
            Choose how you use Telemark and the work you want to learn or assign.
            Your verified Google email is <strong>{user.email}</strong>.
          </p>

          <fieldset className={styles.fieldset}>
            <legend>Who is using this account?</legend>
            <div className={styles.options}>
              {([
                ['student', 'Student', 'Track your work, join a coach’s classroom, and compare progress with classmates.'],
                ['coach', 'Coach', 'Create classrooms, invite students, and monitor accepted students’ progress.'],
              ] as const).map(([id, title, description]) => (
                <label
                  key={id}
                  className={`${styles.option} ${role === id ? styles.selected : ''} ${account ? styles.locked : ''}`}
                >
                  <input
                    type="radio"
                    name="account-role"
                    checked={role === id}
                    disabled={Boolean(account)}
                    onChange={() => { setRole(id); setError(null); }}
                  />
                  <span><strong>{title}</strong><small>{description}</small></span>
                </label>
              ))}
            </div>
            {account && (
              <p className={styles.fieldNote}>
                Account type is fixed after setup so classroom ownership and student consent stay intact.
              </p>
            )}
          </fieldset>

          <div className={styles.fieldset}>
            <label className={styles.usernameLabel} htmlFor="telemark-username">
              Username
            </label>
            <p className={styles.fieldNote}>
              Coaches invite this username. It is visible only in classrooms you accept,
              and you can change it later.
            </p>
            <div className={styles.usernameField}>
              <span aria-hidden="true">@</span>
              <input
                id="telemark-username"
                type="text"
                value={username}
                minLength={3}
                maxLength={20}
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="username"
                spellCheck={false}
                placeholder="drive_team_7"
                onChange={(event) => {
                  setUsername(event.target.value.replace(/^@/, '').toLowerCase());
                  setError(null);
                }}
              />
            </div>
            <p className={styles.fieldNote}>Use 3 to 20 lowercase letters, numbers, underscores, or hyphens.</p>
          </div>

          <fieldset className={styles.fieldset}>
            <legend>Which areas do you want to {role === 'coach' ? 'teach' : 'learn'}?</legend>
            <div className={styles.options}>
              {([
                ['software', 'Software', 'Programming, the FTC SDK, sensors, and autonomous code.'],
                ['mechanical', 'Mechanical', 'Design, CAD, fabrication, mechanisms, wiring, and testing.'],
              ] as const).map(([id, title, description]) => (
                <label key={id} className={`${styles.option} ${tracks.includes(id) ? styles.selected : ''}`}>
                  <input type="checkbox" checked={tracks.includes(id)} onChange={() => toggleTrack(id)} />
                  <span><strong>{title}</strong><small>{description}</small></span>
                </label>
              ))}
            </div>
          </fieldset>

          {role !== 'coach' && tracks.includes('software') && (
            <fieldset className={styles.fieldset}>
              <legend>What programming experience do you have?</legend>
              <div className={styles.options}>
                {LEVELS.map((level) => (
                  <label key={level.id} className={`${styles.option} ${softwareLevel === level.id ? styles.selected : ''}`}>
                    <input type="radio" name="software-level" checked={softwareLevel === level.id} onChange={() => { setSoftwareLevel(level.id); setError(null); }} />
                    <span><strong>{level.title}</strong><small>{level.description}</small></span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {role !== 'coach' && softwareLevel === 'block_experience' && (
            <fieldset className={`${styles.fieldset} ${styles.bridge}`}>
              <legend>How confident are you about moving to text code?</legend>
              <p className={styles.bridgeIntro}>Python is an optional bridge. It can make the change from blocks easier, but FTC robot programs still use Java.</p>
              <div className={styles.options}>
                <label className={`${styles.option} ${blockExperienceChoice === 'python' ? styles.selected : ''}`}>
                  <input type="radio" name="blocks-next-step" checked={blockExperienceChoice === 'python'} onChange={() => { setBlockExperienceChoice('python'); setError(null); }} />
                  <span>
                    <strong>Optional Python bridge <span className={styles.recommended}>Recommended if unsure</span></strong>
                    <small>Choose this if you understand blocks but are not completely confident typing variables, conditions, loops, and functions.</small>
                  </span>
                </label>
                <label className={`${styles.option} ${blockExperienceChoice === 'java' ? styles.selected : ''}`}>
                  <input type="radio" name="blocks-next-step" checked={blockExperienceChoice === 'java'} onChange={() => { setBlockExperienceChoice('java'); setError(null); }} />
                  <span><strong>Go directly to FTC Java</strong><small>Choose this if you are ready to learn Java syntax while building robot programs.</small></span>
                </label>
              </div>
            </fieldset>
          )}

          {(error || accountError || profileError) && (
            <p className={styles.error} role="alert">
              {error ?? accountError ?? profileError}
            </p>
          )}

          <div className={styles.actions}>
            <button type="button" className={styles.primary} onClick={() => void save()} disabled={saving}>
              {saving
                ? 'Saving...'
                : account && profile
                  ? 'Save account'
                  : role === 'coach' ? 'Open classroom' : 'Start learning'}
            </button>
            {account && profile && (
              <Link className={styles.secondary} to="/dashboard">Cancel</Link>
            )}
            <button type="button" className={styles.secondary} onClick={() => void signOut(auth)}>Sign out</button>
          </div>
        </section>
      </main>
    </Layout>
  );
}
