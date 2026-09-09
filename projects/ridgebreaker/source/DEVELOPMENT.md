# Development record

## Delivered scope

One locally runnable browser vertical slice, implemented from an initially empty workspace. The original oversized-wheel sketch informed the truck silhouette and wilderness traversal. TypeScript, Vite, Three.js and Rapier follow the requested stack. No hosted service or API credential is needed.

## Implementation sequence

1. Inspected the request, drawing, empty directory, and callable Higgsfield capabilities.
2. Installed the rendering/physics stack and built shared terrain topology, a rigid-body truck, four-wheel suspension, controls, camera, and recovery.
3. Built the route, six camps, salvage, boost, menu, and HUD; compiled and ran in Edge.
4. Used real physics stepping to audit the route, corrected keyboard steering direction, tuned braking, and verified summit progression.
5. Added and tested advanced systems: winch, dynamic bridge/rocks, upgrades, saved progress, damage, weather/effects, synthesized audio, and summit results.
6. Corrected a hard-landing damage blind spot, bridge reset transform capture, pause handling, and transient-obstacle restart behavior. Batched static geometry, bundled fonts locally, and improved menu framing.
7. Ran the complete acceptance suite and production build, then wrote these documents.

## Tested evidence

The five Playwright tests passed in headless local Microsoft Edge with software WebGL. A subsequent controls/console check also passed after final presentation cleanup.

| Check                                              | Evidence                                                                                               |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Start, forward drive, left steer, braking, reverse | Actual keyboard inputs feed the physics controller; displacement, signed speed and rotation assertions |
| Wheels and terrain                                 | Four-wheel contact, differing suspension lengths, successful whole-route drive                         |
| Boost and reset                                    | Charge reduction, higher speed, R returns to last camp                                                 |
| Summit reachability                                | No-teleport driving test activates all five subsequent camps in ~87.5 simulated seconds                |
| Jump and landing                                   | Separate boosted ramp test reports 47 airborne fixed steps and subsequent contact                      |
| Damage                                             | 20 m drop produces approximately 72 integrity                                                          |
| Dynamic obstacles                                  | Thirteen bridge slabs collapse; recovery restores original fixed transforms; rockslide triggers        |
| Winch                                              | Cable attaches and physical distance to the selected anchor decreases                                  |
| Progression                                        | Salvage, cave secret, upgrade purchase, sequential checkpoint gating, save validation and Continue     |
| UI                                                 | Controls/settings dialogs, volume/rain/quality inputs, pause/resume, upgrade menu and 800×600 resize   |
| Cameras                                            | C cycles modes; whole-route chase-camera terrain clearance stays above 6 m in this run                 |
| Failure handling                                   | Simulated unavailable WebGL produces a retry screen                                                    |
| Console                                            | No normal-gameplay JavaScript or console errors in the final controls check                            |

Screenshots: `tests/menu.png`, `tests/driving.png`, `tests/summit.png`, `tests/resize.png`. The machine-readable traversal report is `tests/route-report.json`.

The deterministic tests advance the actual simulation rapidly within a browser evaluation. Their simulated completion time does not measure real-time GPU throughput or human driving difficulty. Systems tests reposition the truck to isolate mechanics; only the complete-route test is evidence of continuous traversability. The jump uses a dedicated boosted run; the cautious route run remains grounded.

## Important decisions and limits

- Native raycast wheels were chosen over four separate wheel bodies for stable, inexpensive arcade driving.
- The terrain collider and render geometry share a grid; navigation is authored around a height function for reproducibility.
- Static boxes are batched without merging moving parts. Representative scenes report roughly 60–100 draw calls, varying by view.
- Rapier's compatibility bundle embeds WASM. Vite reports a large chunk (~3.45 MB raw / 1.25 MB gzipped JavaScript). This is not a build failure; splitting WASM and adding a richer progress loader are future optimizations.
- Hardware 60 FPS has not been certified. Software-rendered automated tests are unsuitable for that claim.
- Real controller hardware, listening quality, and extended human fun/balance testing remain unverified.
- Higgsfield scene editing could not proceed because the required query capability was absent. See its dedicated asset record.

## Reproduce checks

```sh
npm install
npm run build
npm test
```

Use a normal hardware-accelerated browser for play. The test configuration automatically starts Vite if no server is running and uses the locally installed Edge on Windows. Tests elsewhere require the Playwright Chromium browser installation.
