import React, {type ReactNode} from 'react';
import AskLauncher from '@site/src/components/ui/AskLauncher';
import ClickSpark from '@site/src/components/vendor/reactbits/ClickSpark';
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
          {/* Wraps the page rather than sitting beside it: the canvas is sized by
              this element, so as a sibling it collapsed to nothing. */}
          <ClickSpark
            sparkColor="var(--tm-accent)"
            sparkSize={8}
            sparkRadius={18}
            sparkCount={7}
            duration={420}
          >
            {children}
          </ClickSpark>
        </PersonalizationGate>
      </LearnerProfileProvider>
    </TelemarkAccountProvider>
  );
}
