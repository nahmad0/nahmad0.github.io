# Known issues and remaining work

## Current limitations

- **Art:** custom procedural low-poly geometry rather than the requested fully polished stylized-realistic finish. The truck cabin, vegetation, cave, waterfall, and mining props need a substantial art pass. No optimized imported or Higgsfield-generated GLB is present.
- **Physics:** wheels use rays, so vertical sidewall impacts and small ledges are less convincing than physical tires. Suspension struts extend and compress but are not coil-spring simulations. Steering and brake feel need human tuning; high-speed rough-terrain rollovers remain possible.
- **Damage:** one shared integrity value with landing and collision damage. There are no body dents, individual punctures, separate suspension failures, or repair animations. Suspension upgrades modify landing tolerance and stiffness; they do not add more travel.
- **Camera:** obstruction rays and height clamps reduce clipping but do not prove clearance against every possible tree, cave corner, or mesh edge. Only chase terrain clearance was audited along the full route. Orbit is automatic, not mouse-controlled. No landing-specific cinematic shot or boost camera shake.
- **Winch:** automatically chooses an eligible anchor. There is no manual target preview, rope collision, tension solver, or winch upgrade track. Its pull is deliberately gentle and can be weak across adverse side slopes.
- **World:** the upper winding ascent is not a full hairpin switchback sequence. There is one uniquely named cave secret and two side-trail regions, rather than several fully developed secret locations. The minimap shows the main trail only. Waterfall and river are simple meshes; currents are zone forces rather than fluid simulation.
- **Events/effects:** rockslide and bridge collapse work. Rain/fog are selected in settings, not a full weather cycle. No wildlife, rolling logs, persistent tire tracks, deformable mud, vegetation wind, dynamic sunlight cycle, or elaborate exhaust/speed streaks.
- **Audio:** procedural engine, rolling/terrain noise, impacts and checkpoint tones. No production recordings, music, rich spatial forest ambience, or full separate sound-bank assets. Audio synthesis executes, but perceived quality has not been auditioned in a listening session.
- **Input:** keyboard browser tests pass. Standard gamepad axes/buttons are implemented but no physical controller was tested. No touch driving, full controller menu navigation, rebinding, or accessibility driving assists.
- **Saves/settings:** saves are browser-local and checkpoint-based. Settings reset on reload. Starting a new expedition replaces the single save slot. No cloud saves or saved transient obstacle positions.
- **Performance:** geometry instancing, pooling, shadow bounds, and material batching are implemented; normal desktop 60 FPS is a target, not a verified result. No distance LOD or chunk streaming yet. Software-WebGL tests run slower than real GPU rendering. Rapier embeds a large WASM payload, producing Vite's large-chunk warning.
- **Presentation:** layout resizes, but keyboard/desktop is the intended platform. At small heights some HUD hints are dense. The initial WASM startup can briefly show only the background before the loading UI is constructed.

## Next best improvements

1. Human driving/playability tests and GPU profiling on representative machines.
2. A more detailed hero truck and distinctive summit/mining landmarks with verified GLBs.
3. Manual winch targeting, stronger route signposting, and a genuine switchback section.
4. Better spatial audio, wheel-side collisions, landing effects, and richer water/mud feedback.
5. Physical gamepad testing, touch/controller UI, settings persistence, and additional secrets.

No commercial-finish, 60 FPS, imported-model, or hardware-controller completion claim is made.
