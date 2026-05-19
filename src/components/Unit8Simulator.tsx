import React from 'react';
import Admonition from '@theme/Admonition';
import useBaseUrl from '@docusaurus/useBaseUrl';

type LessonKey =
  | 'set-power'
  | 'set-direction'
  | 'zero-power-behavior'
  | 'coast-vs-stop'
  | 'linear-slide-challenge';

const LESSON_PATH: Record<LessonKey, string> = {
  'set-power': '/simulator/unit8.1.html',
  'set-direction': '/simulator/unit8.2.html',
  'zero-power-behavior': '/simulator/unit8.3.html',
  'coast-vs-stop': '/simulator/unit8.4.html',
  'linear-slide-challenge': '/simulator/unit8.5.html',
};

type Unit8SimulatorProps = {
  lesson: LessonKey;
};

export default function Unit8Simulator({lesson}: Unit8SimulatorProps): React.JSX.Element {
  const simulatorSrc = useBaseUrl(LESSON_PATH[lesson]);

  return (
    <>
      <div className="simulator-wrapper">
        <iframe
          src={simulatorSrc}
          className="telemark-simulator"
          title="Unit 8 simulator"
          loading="lazy"
        />
      </div>

      <Admonition type="info" title="Unit 8 simulator">
        <div>Loads the lesson-specific Telemark motor challenge with starter code instead of a completed solution.</div>
        <div>Includes live hardware feedback, telemetry checks, and gamepad input for each motor-control concept.</div>
        <div>Best for practicing power, direction, braking, stopping behavior, and limit-switch safety in context.</div>
      </Admonition>

      <style>{`
        .simulator-wrapper {
          position: relative;
          width: 100%;
          margin: 1.5rem 0;
        }
        .telemark-simulator {
          width: 100%;
          height: 720px;
          min-height: 540px;
          border: none;
          border-radius: 8px;
          background: #111;
        }
        @media (min-width: 997px) {
          .telemark-simulator {
            height: 780px;
            max-height: 80vh;
          }
        }
        @media (max-width: 640px) {
          .telemark-simulator {
            height: 560px;
            min-height: 480px;
          }
        }
      `}</style>
    </>
  );
}
