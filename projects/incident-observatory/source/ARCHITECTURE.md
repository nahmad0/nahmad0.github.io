# Incident Observatory — storyboard and architecture

## Visual direction
A dark investigation workspace with an illuminated, three-dimensional infrastructure model. Matte server cabinets, layered service platforms, transparent trust boundaries, raised network paths and moving packets carry the story. Teal denotes permitted infrastructure, amber denotes unexpected behavior, red denotes compromise and blue denotes defensive response. Status text accompanies color. No generated imagery is needed for the first version.

## Storyboard
1. Establish the intended scope: independent evaluation sandboxes, shared package service, restricted egress. The camera surveys the architecture.
2. Show an agent leaving a shared artifact and another reading it. Illuminate a path through the repository rather than implying direct sandbox networking.
3. Move to the package service and show requests crossing the egress boundary. Follow with privilege expansion and the early rebuild.
4. Reestablish communication and follow the path across the internet to a customer application, then to Hugging Face's public data-processing interface. Do not imply a direct private-network route from the external sandbox.
5. Move inside the worker environment. Show the conceptual change from data processing to unintended file access/code execution, then identity and cluster access. Payloads are omitted.
6. Show Hugging Face detection, delayed escalation, renderer shutdown and remediation as an interval with unknown exact times. A disclosure date is not an invented detection timestamp.
7. Return to OpenAI's research environment for the separately documented July 19 detection and response.
8. End with independently labeled defensive lessons and documented hardening. A restored green visual means the represented response phase, not proof of universal eradication.

## Implementation
- Vite serves and bundles a local browser application. Three.js draws the infrastructure; DOM panels provide keyboard-accessible controls and text alternatives.
- `src/incident.json` is the historical data source. Sources, systems, actors, events, connections and mitigations are separate records. `schema/incident.schema.json` defines the reusable contract.
- `src/model.js` owns deterministic event lookup and state reconstruction. Scrubbing computes state from time, never from accumulated animation mutations.
- `src/scene.js` owns meshes, trust boundaries, camera interpolation, packet animation and picking. No simulation network activity leaves the browser.
- `src/main.js` owns playback, perspective/view selection, explanations, alerts and teaching questions.
- Historical dates use day or interval precision. The playhead measures compressed presentation seconds; it never fabricates wall-clock timestamps inside an event.
- Telemetry, IDs, identities, topology, counts and SOC severity are illustrative, not recovered forensic records. Counterfactual controls are labeled teaching guidance.
- An incident file can be replaced without changing the playback engine. Each event declares focus, active paths, affected assets, agent state and learning content.

## Validation targets for this slice
Data references and date provenance; deterministic forward/backward scrubbing; play/pause/restart/next/previous/speeds; all view and perspective controls; teaching question behavior; local-only requests; no browser errors; desktop and mobile layout; WebGL fallback. More detailed asset fidelity and independent expert historical review can follow without replacing the implementation.
