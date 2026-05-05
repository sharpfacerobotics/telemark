import React from 'react';
import Admonition from '@theme/Admonition';
import useBaseUrl from '@docusaurus/useBaseUrl';

export default function Unit2Simulator(): React.JSX.Element {
  const simulatorSrc = useBaseUrl('/simulators/unit2.html');

  return (
    <>
      <iframe
        src={simulatorSrc}
        width="100%"
        height="700px"
        style={{border: 'none'}}
        title="Unit 2 simulator"
      />

      <Admonition type="info" title="Unit 2 simulator">
        <div>Supports `init()`, `init_loop()`, `start()`, `loop()`, and `stop()`.</div>
        <div>Reads `@TeleOp`, `@Autonomous`, `@Disabled`, telemetry, and `gamepad1`.</div>
        <div>Handles local variables, simple math, `resetRuntime()`, and `getRuntime()`.</div>
        <div>Does not execute hardware, `gamepad2`, `else` blocks, or loop structures.</div>
      </Admonition>
    </>
  );
}
