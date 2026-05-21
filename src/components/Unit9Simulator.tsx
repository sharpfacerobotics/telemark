import React from 'react';
import Admonition from '@theme/Admonition';
import useBaseUrl from '@docusaurus/useBaseUrl';

type LessonKey =
  | 'set-position'
  | 'scale-range'
  | 'servo-direction'
  | 'cr-servo'
  | 'dual-servo-challenge';

const LESSON_PATH: Record<LessonKey, string> = {
  'set-position': '/simulator/unit9.1.html',
  'scale-range': '/simulator/unit9.2.html',
  'servo-direction': '/simulator/unit9.3.html',
  'cr-servo': '/simulator/unit9.4.html',
  'dual-servo-challenge': '/simulator/unit9.5.html',
};

type Unit9SimulatorProps = {
  lesson: LessonKey;
};

export default function Unit9Simulator({lesson}: Unit9SimulatorProps): React.JSX.Element {
  const simulatorSrc = useBaseUrl(LESSON_PATH[lesson]);

  return (
    <>
      <div className="simulator-wrapper unit9-simulator-wrapper">
        <iframe
          src={simulatorSrc}
          className="telemark-simulator unit9-telemark-simulator"
          title="Unit 9 simulator"
          loading="lazy"
        />
      </div>

      <Admonition type="info" title="Unit 9 simulator">
        <div>Loads the lesson-specific Telemark servo challenge with starter code for students to complete.</div>
        <div>Includes live mechanism feedback, telemetry checks, and gamepad input for each servo-control concept.</div>
      </Admonition>

      <style>{`
        .unit9-simulator-wrapper {
          position: relative;
          width: 100%;
          margin: 1.5rem 0;
        }
        .unit9-telemark-simulator {
          width: 100%;
          height: 820px;
          min-height: 620px;
          border: none;
          border-radius: 8px;
          background: #111;
        }
        @media (min-width: 997px) {
          .unit9-telemark-simulator {
            height: 860px;
            max-height: 86vh;
          }
        }
        @media (max-width: 640px) {
          .unit9-telemark-simulator {
            height: 680px;
            min-height: 560px;
          }
        }
      `}</style>
    </>
  );
}
