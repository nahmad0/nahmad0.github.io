# Architecture

## Startup and loop

`src/main.ts` initializes Rapier before constructing `Game`. Initialization failures produce a retry screen. `Game` owns a fixed 1/60-second physics accumulator and a requestAnimationFrame render loop. Frame deltas are capped at 80 ms to prevent runaway catch-up after stalls. This slows simulation under extreme rendering stalls rather than integrating a dangerously large physics step.

Paused dialogs suspend gameplay stepping. Visibility loss pauses. Keyboard state clears on focus loss, pause, and resume. Web Audio starts only after the user's start/continue gesture.

## Physics

`Terrain.ts` generates a height grid and uses the same vertices and indices for the visible terrain and Rapier triangle mesh. Obstacles use primitive fixed or dynamic colliders. The truck uses CCD and a compound rigid-body chassis. Rapier's native DynamicRayCastVehicleController supplies suspension and wheel contact impulses. Wheels are raycasts, not separate articulated rigid bodies.

Order: compute engine/brake/steering and terrain modifiers; update wheel forces; apply auxiliary winch/drag/anti-roll impulses; step Rapier; synchronize body/wheel visuals; evaluate impacts, world events, and progression. Gravity is -16 m/s² for a weighty arcade feel.

## Rendering

Three.js WebGLRenderer uses ACES tone mapping, hemisphere lighting, a warm directional shadow light, and distance fog. The light's bounded shadow camera follows the truck. Instanced foliage and rocks share geometry; compatible static boxes are merged by material. The truck's dynamic wheels and bridge slabs remain individually addressable. Distant mountains have no physics.

`Effects` preallocates 240 contact particles and 500 rain points. Static geometry batching lives in `assets/GeometryBatch.ts`. There is no runtime model fetch or GLB loader in this version.

## Vehicle and cameras

`Vehicle` owns the rigid body, controller, health, boost, heat, upgrades, and winch state. `TruckModel` owns the visible body and four steering/spinning groups. Wheel translations follow measured suspension length.

`CameraRig` implements chase, cinematic, hood, side, and automatic orbit views. Chase distance changes with speed and FOV responds to boost. The desired position is checked against terrain and a Rapier obstruction ray excluding the truck; the interpolated position is also kept above the analytical height field.

## World and progression

`World` owns forest, rocks, bridges, structures, anchors, camps, and dynamic updates. Bridge slabs change from fixed to dynamic after a short proximity delay. Recovery reconstructs the bridge. A new/continued expedition restores loose rocks and clears spawned rockslide debris.

`Expedition` owns ordered checkpoints, item visibility, parts, upgrades, and win state. Saves are versioned and validated before use. Saves contain camp, parts, item IDs, upgrade levels, and elapsed time. They do not contain transient rigid-body positions, damage, weather, or settings. Saves occur on camps, salvage, upgrades, and returning to the menu; this is local browser storage, not cloud sync.

## UI and test boundary

`UI` renders menus and HUD using DOM elements over the real 3D canvas. The HUD updates every third render frame. A minimap is a small 2D route diagram, not gameplay rendering.

Only Vite development builds with `?test` expose `window.__game`. Browser tests use that hook to advance real physics deterministically. The complete-route test never sets truck position after starting; isolated systems tests deliberately place the truck near a specific fixture and are described as such. Production builds do not expose the hook.
