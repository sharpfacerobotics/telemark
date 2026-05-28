import React from 'react';
import Admonition from '@theme/Admonition';
import useBaseUrl from '@docusaurus/useBaseUrl';

type LessonKey =
  | 'imu-initialization'
  | 'yaw-data'
  | 'field-centric'
  | 'pitch-roll'
  | 'imu-turn';

const LESSON_PATH: Record<LessonKey, string> = {
  'imu-initialization': '/simulator/unit12.1.html',
  'yaw-data': '/simulator/unit12.2.html',
  'field-centric': '/simulator/unit12.3.html',
  'pitch-roll': '/simulator/unit12.4.html',
  'imu-turn': '/simulator/unit12.5.html',
};

type Unit12SimulatorProps = {
  lesson: LessonKey;
};

export default function Unit12Simulator({lesson}: Unit12SimulatorProps): React.JSX.Element {
  const simulatorSrc = useBaseUrl(LESSON_PATH[lesson]);

  return (
    <>
      <div className="simulator-wrapper unit12-simulator-wrapper">
        <iframe
          src={simulatorSrc}
          className="telemark-simulator unit12-telemark-simulator"
          title="Unit 12 simulator"
          loading="lazy"
        />
      </div>

      <Admonition type="info" title="Unit 12 simulator">
        <div>Loads the lesson-specific Telemark IMU challenge with incomplete starter code for students to complete.</div>
        <div>Includes a large 3D viewport, heading feedback, telemetry checks, and validation for each IMU concept.</div>
      </Admonition>

      <style>{`
        .unit12-simulator-wrapper {
          position: relative;
          width: 100%;
          margin: 1.5rem 0;
        }
        .unit12-telemark-simulator {
          width: 100%;
          height: 900px;
          min-height: 700px;
          border: none;
          border-radius: 8px;
          background: #111;
        }
        @media (min-width: 997px) {
          .unit12-telemark-simulator {
            height: 920px;
            max-height: 88vh;
          }
        }
        @media (max-width: 640px) {
          .unit12-telemark-simulator {
            height: 720px;
            min-height: 620px;
          }
        }
      `}</style>
    </>
  );
}
