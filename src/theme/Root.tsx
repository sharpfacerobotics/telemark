import React, {type ReactNode} from 'react';
import AskLauncher from '@site/src/components/ui/AskLauncher';
import PersonalizationGate from '@site/src/components/PersonalizationGate';
import {LearnerProfileProvider} from '@site/src/telemark/useLearnerProfile';
import {TelemarkAccountProvider} from '@site/src/telemark/useTelemarkAccount';

interface RootProps {
  children: ReactNode;
}

export default function Root({children}: RootProps): React.JSX.Element {
  return (
    <TelemarkAccountProvider>
      <LearnerProfileProvider>
        <PersonalizationGate>
          <AskLauncher />
          {children}
        </PersonalizationGate>
      </LearnerProfileProvider>
    </TelemarkAccountProvider>
  );
}
