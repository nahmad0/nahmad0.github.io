# Asset pipeline

All shipped gameplay geometry is created locally from deterministic Three.js primitives or height-field data. The hero truck is custom procedural geometry based on the user sketch; it is not an imported asset-store model. Runtime assets have no dependency on Higgsfield, a CDN, or a generation service.

| Asset                    | Authoring source            | Optimization                                       |
| ------------------------ | --------------------------- | -------------------------------------------------- |
| Terrain and trails       | `src/world/Terrain.ts`      | Shared visible/collision topology; one mesh        |
| Truck body               | `src/vehicle/TruckModel.ts` | Static boxes merged per material                   |
| Wheels                   | Same                        | Shared tire/rim meshes; instanced tread blocks     |
| Pines                    | `src/world/World.ts`        | Instanced trunks and three foliage tiers           |
| Rocks                    | Same                        | Instancing for common rocks; simple physics shapes |
| Mine, cave, camps, tower | Same                        | Low polygon primitives and batching                |
| Labels and truck number  | Runtime CanvasTexture       | Small local canvases, no network images            |
| Fonts                    | Fontsource npm packages     | Local WOFF/WOFF2, OFL licensing in packages        |
| Sounds                   | `src/audio/AudioManager.ts` | Web Audio synthesis, no audio downloads            |

`reference/original-sketch.jpg` is a copy of the user's source inspiration and is not loaded by the game. The screenshots under `tests/` are actual browser renders, not generated artwork.

## Future GLB integration

No GLB files ship in this version. Before importing one, establish metre units, Y-up orientation, Z-forward truck direction, wheel pivot naming, and a 1.06 m wheel radius reference. Keep wheels separate from the body. Use portable PBR materials, reuse textures, and verify silhouettes and material appearance in Three.js.

Recommended initial budgets, not achieved external-asset claims: hero vehicle under 25k triangles, a unique landmark under 15k, textures at 1–2K. Optimize with glTF Transform, mesh compression, and KTX2 only when the runtime decoder path is added and tested. Use simple physics colliders independently of the display geometry. Keep the procedural model as a fallback until both loading and collision tests pass.
