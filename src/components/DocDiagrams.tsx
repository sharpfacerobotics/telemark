import React from 'react';
import styles from './DocDiagrams.module.css';

function FlowNode({
  step,
  title,
  body,
}: {
  step: string;
  title: string;
  body: string;
}): React.JSX.Element {
  return (
    <div className={styles.node}>
      <div className={styles.badge}>{step}</div>
      <strong>{title}</strong>
      <span>{body}</span>
    </div>
  );
}

export function LifecycleDiagram(): React.JSX.Element {
  return (
    <figure className={styles.diagram}>
      <figcaption className={styles.title}>OpMode Lifecycle Flow</figcaption>
      <div className={styles.flow}>
        <FlowNode step="1" title="Init pressed" body="init() runs once for setup and hardware mapping." />
        <FlowNode step="2" title="Waiting" body="init_loop() may repeat while the robot is not started." />
        <FlowNode step="3" title="Start pressed" body="start() runs once for timers or one-time transitions." />
        <FlowNode step="4" title="Active match" body="loop() repeats: read inputs, decide, command hardware, update telemetry." />
        <FlowNode step="5" title="Stop pressed" body="stop() runs once for cleanup and safe shutdown." />
      </div>
    </figure>
  );
}

export function EncoderFlowDiagram(): React.JSX.Element {
  return (
    <figure className={styles.diagram}>
      <figcaption className={styles.title}>Encoder Measurement Flow</figcaption>
      <div className={styles.flow}>
        <FlowNode step="A" title="Shaft rotates" body="The motor output shaft turns with the mechanism." />
        <FlowNode step="B" title="Pulses generated" body="The encoder sensor produces counts as it spins." />
        <FlowNode step="C" title="Hub counts ticks" body="The Control Hub accumulates the count as an integer." />
        <FlowNode step="D" title="Code reads position" body="getCurrentPosition() returns the current tick count." />
        <FlowNode step="E" title="Robot logic uses it" body="Your code converts ticks into distance, angle, or mechanism position." />
      </div>
    </figure>
  );
}

export function RunToPositionDiagram(): React.JSX.Element {
  return (
    <figure className={styles.diagram}>
      <figcaption className={styles.title}>RUN_TO_POSITION Command Sequence</figcaption>
      <div className={styles.flow}>
        <FlowNode step="1" title="Set target" body="setTargetPosition(ticks) defines the destination." />
        <FlowNode step="2" title="Set mode" body="RUN_TO_POSITION enables position control." />
        <FlowNode step="3" title="Apply power" body="setPower() provides the movement speed limit." />
        <FlowNode step="4" title="Controller acts" body="The Hub compares current ticks against target ticks." />
        <FlowNode step="5" title="Arrive or settle" body="The mechanism stops near the target and may hold position." />
      </div>
    </figure>
  );
}

export function MotorModesDiagram(): React.JSX.Element {
  return (
    <figure className={styles.diagram}>
      <figcaption className={styles.title}>Motor Run Mode Comparison</figcaption>
      <div className={styles.modeGrid}>
        <div className={styles.modeCard}>
          <h4>RUN_WITHOUT_ENCODER</h4>
          <p>setPower() acts like a voltage fraction. Actual speed changes with battery, load, and friction.</p>
        </div>
        <div className={styles.modeCard}>
          <h4>RUN_USING_ENCODER</h4>
          <p>setPower() requests a speed target. Encoder feedback helps the Hub adjust output.</p>
        </div>
        <div className={styles.modeCard}>
          <h4>RUN_TO_POSITION</h4>
          <p>Target ticks plus power tell the Hub to move toward a position and stop or hold near it.</p>
        </div>
      </div>
    </figure>
  );
}

export function ImuAxesDiagram(): React.JSX.Element {
  return (
    <figure className={styles.diagram}>
      <figcaption className={styles.title}>Robot Orientation Axes</figcaption>
      <div className={styles.svgWrap}>
        <svg className={styles.svg} viewBox="0 0 720 320" role="img" aria-label="IMU yaw, pitch, and roll axes diagram">
          <defs>
            <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
              <path d="M0,0 L0,6 L9,3 z" fill="#39ff14" />
            </marker>
          </defs>
          <rect x="250" y="125" width="220" height="92" rx="10" fill="#0d0d1e" stroke="#00bfff" strokeWidth="2" />
          <path d="M295 170 L425 170" stroke="#39ff14" strokeWidth="4" markerEnd="url(#arrow)" />
          <path d="M360 210 L360 62" stroke="#39ff14" strokeWidth="4" markerEnd="url(#arrow)" />
          <path d="M285 210 C210 170 210 100 285 78" fill="none" stroke="#00bfff" strokeWidth="4" markerEnd="url(#arrow)" />
          <path d="M470 150 C555 150 584 204 536 252" fill="none" stroke="#00bfff" strokeWidth="4" markerEnd="url(#arrow)" />
          <text x="330" y="176" fill="#e8f4ff" fontSize="18" fontFamily="Rajdhani, sans-serif">Forward</text>
          <text x="374" y="73" fill="#39ff14" fontSize="18" fontFamily="Rajdhani, sans-serif">Z axis / yaw</text>
          <text x="145" y="103" fill="#00bfff" fontSize="18" fontFamily="Rajdhani, sans-serif">Roll</text>
          <text x="555" y="247" fill="#00bfff" fontSize="18" fontFamily="Rajdhani, sans-serif">Pitch</text>
          <text x="303" y="246" fill="rgba(232,244,255,0.72)" fontSize="16" fontFamily="Exo 2, sans-serif">Orientation setup maps Hub axes onto the robot frame.</text>
        </svg>
      </div>
    </figure>
  );
}

export function PathFollowingDiagram(): React.JSX.Element {
  return (
    <figure className={styles.diagram}>
      <figcaption className={styles.title}>Path Following Feedback Loop</figcaption>
      <div className={styles.cycle}>
        <FlowNode step="1" title="Path geometry" body="The Path or PathChain defines the desired trajectory." />
        <FlowNode step="2" title="Target pose" body="The Follower chooses where the robot should be on the path now." />
        <FlowNode step="3" title="Pose error" body="Current odometry pose is compared against the target pose." />
        <FlowNode step="4" title="Motor correction" body="Drive powers are recomputed, the robot moves, and odometry updates again." />
      </div>
    </figure>
  );
}

export function BezierComparisonDiagram(): React.JSX.Element {
  return (
    <figure className={styles.diagram}>
      <figcaption className={styles.title}>Straight Segments vs Bezier Path</figcaption>
      <div className={styles.svgWrap}>
        <svg className={styles.svg} viewBox="0 0 760 300" role="img" aria-label="Stop turn drive path compared to a Bezier curve">
          <defs>
            <marker id="cyanArrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
              <path d="M0,0 L0,6 L9,3 z" fill="#00bfff" />
            </marker>
            <marker id="greenArrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
              <path d="M0,0 L0,6 L9,3 z" fill="#39ff14" />
            </marker>
          </defs>
          <rect x="30" y="48" width="700" height="204" rx="12" fill="#0d0d1e" stroke="rgba(0,191,255,0.24)" />
          <path d="M90 195 L260 195 L260 92 L455 92 L455 160 L650 160" fill="none" stroke="#00bfff" strokeWidth="5" strokeDasharray="10 8" markerEnd="url(#cyanArrow)" />
          <path d="M90 212 C210 120 325 235 455 116 S590 128 650 92" fill="none" stroke="#39ff14" strokeWidth="6" markerEnd="url(#greenArrow)" />
          <circle cx="90" cy="195" r="9" fill="#e8f4ff" />
          <circle cx="650" cy="160" r="9" fill="#e8f4ff" />
          <text x="78" y="232" fill="#e8f4ff" fontSize="16" fontFamily="Rajdhani, sans-serif">Start</text>
          <text x="625" y="187" fill="#e8f4ff" fontSize="16" fontFamily="Rajdhani, sans-serif">Score</text>
          <text x="86" y="75" fill="#00bfff" fontSize="18" fontFamily="Rajdhani, sans-serif">Stop-turn-drive: simple, but slow at corners</text>
          <text x="86" y="270" fill="#39ff14" fontSize="18" fontFamily="Rajdhani, sans-serif">Bezier path: smoother target geometry for the follower</text>
        </svg>
      </div>
    </figure>
  );
}

export function MeetingRhythmDiagram(): React.JSX.Element {
  return (
    <figure className={styles.diagram}>
      <figcaption className={styles.title}>Suggested Weekly Learning Rhythm</figcaption>
      <div className={styles.flow}>
        <FlowNode step="1" title="Read and simulate" body="Study one lesson together, then run the simulator challenge." />
        <FlowNode step="2" title="Port to robot" body="Apply the concept to one real subsystem or drivetrain behavior." />
        <FlowNode step="3" title="Debug and document" body="Record what failed, what fixed it, and what to check first next time." />
        <FlowNode step="4" title="Integrate" body="Combine with previous units and run a driver or autonomous test." />
      </div>
    </figure>
  );
}
