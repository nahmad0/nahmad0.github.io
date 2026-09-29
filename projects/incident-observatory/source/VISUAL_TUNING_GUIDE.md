# Make the Observatory look the way you want

Your original is in `../incident-observatory`. This editable edition is in `incident-observatory-realistic`. Both are complete independent copies; changing this edition does not change the original.

## Start here: tune it without coding

1. Open **http://127.0.0.1:4174/** while this edition's server is running.
2. Click **Visual tuning** at the top.
3. Choose a starting look, then adjust one slider at a time. Changes appear immediately, including while paused.
4. Close the panel to judge the whole scene. Drag the scene to orbit and scroll to zoom. Turn off **Follow event** when you want to keep your camera position during playback.
5. Use **Export JSON** to save your look as `observatory-look.json`. **Import JSON** restores an exported look. **Reset** restores the Documentary defaults.

Your adjustments also save automatically in this browser on this port. Another browser, a private window, cleared browser data, or another port may have different settings. Export JSON for a portable backup. The export contains visual settings, not the incident timeline or camera orbit position.

## Starting looks

| Look | Best use | Appearance |
| --- | --- | --- |
| Documentary | Balanced default | Restrained lighting, light haze, hardware detail and shadows |
| Clear / classroom | Studying paths and reading labels | Brighter ambient light, little haze, stronger boundaries |
| Night operations | A darker cinematic feel | Lower ambient light and more atmospheric separation |
| Laptop / performance | Smoother interaction | Lower resolution, no shadows or decorative cabinet/room details |

Selecting a preset replaces the panel settings. Export a custom look before switching if you want to keep it.

## What each control changes

| Control | What you see | How to use it |
| --- | --- | --- |
| Exposure | Overall rendered brightness | Start around 1.2–1.5. Lower it if bright surfaces lose detail. |
| Ambient light | Brightness in shadowed areas | Raise it when rack fronts disappear into darkness. Too much flattens depth. |
| Key light | Main light and directional contrast | Raise it for clearer edges and stronger highlights. |
| Teal rim light | Colored light on the opposite side | Keep it subtle for a believable scene. |
| Atmospheric haze | Distant objects fade into the background | Small amounts suggest depth; too much hides the network. |
| Field of view | Camera lens width | Lower values magnify the scene; higher values show more surroundings. This does not move the camera. |
| Packet motion | Speed of dots along network paths | Changes visual motion only, independently of the incident playback-speed menu. |
| Boundary visibility | Opacity of the wireframe security enclosures | Raise it for teaching isolation; lower it for a cleaner hardware view. |
| Resolution scale | Maximum pixel ratio | Higher values sharpen edges at a GPU cost. It is capped by the screen's pixel ratio. |
| Asset labels | Floating names | Turn off for clean screenshots; use the asset selector to inspect systems. |
| Soft shadows | Shadows on platforms and hardware | Turn off first if performance is poor. |
| Cabinet details | Door glazing, rails, screws, vents, fans, cables, floor tiles and overhead structures | Turning this off reduces decorative geometry without removing the core systems. |

The light strips are emissive materials. They look illuminated; they do not each cast a separate dynamic light. Floor highlights and door sheen are material responses, not ray-traced reflections. All room geometry remains an illustrative reconstruction, not a claim about either organization's real facilities.

## Recipes to try

**More realistic and less colorful:** choose Documentary, set teal rim light near 0.5, haze near 0.005, exposure near 1.3, and keep shadows/details on. Set up the camera before adjusting light levels.

**Easy to read for a class presentation:** choose Clear / classroom, keep labels on, increase boundary visibility to about 0.25, and use 0.5× playback. An event's exact historical timestamp is not implied by the playback speed.

**A dramatic screenshot:** choose Night operations, hide labels, pause on an event, turn off Follow event and orbit to a lower angle. If important surfaces disappear, raise ambient light before raising exposure.

**A smoother laptop experience:** choose Laptop / performance. If needed, lower resolution scale to 0.75 and close other GPU-heavy tabs. Keep the same incident data and controls.

## Permanent defaults and deeper changes

Edit only this copy. The development server refreshes when source files change. Keep a backup or use source control before a large edit.

| File / location | Change here |
| --- | --- |
| `src/visual-settings.js` → `DEFAULTS` | The starting values for a fresh browser or Reset |
| `src/visual-settings.js` → `PRESETS` | The four preset recipes |
| `src/visual-settings.js` → `RANGES` | Slider minimum, maximum and step; imported values are clamped to these limits |
| `src/scene.js` → `COLORS` | Permitted, unexpected, affected, response and dim path colors |
| `src/scene.js` → constructor lights | Light colors and positions |
| `src/scene.js` → `box()` | Metalness, roughness and rounded edges |
| `src/scene.js` → `makeNode()` | Cabinets, server bays, door glazing, LEDs and selection rings |
| `src/scene.js` → `roomDetails()` | Raised floor, overhead structures and organization labels |
| `src/scene.js` → `zone()` | Trust enclosures and platform sizes |
| `src/scene.js` → `overview()`, `focus()`, `setView()` | Camera targets and offsets |
| `src/style.css` → `:root` | Main text and accent variables; some component colors are also set explicitly farther down |
| `src/style.css` → `.workspace`, `#visual-surface`, `.inspector` | Panel widths, scene height and layout |
| `scripts/build-data.mjs` → systems | Asset positions and labels; regenerate the JSON afterward |

If you edit `DEFAULTS`, click Reset in the app: saved browser settings otherwise take precedence. Exporting a look does not modify the source defaults automatically. Copy the desired numeric/boolean values into `DEFAULTS` if you want them to be the new default for everyone.

### Simple examples

To brighten the default scene, change `exposure: 1.25` to `exposure: 1.5` in `DEFAULTS`, save, then click Reset.

To slow camera transitions, find `1-Math.exp(-dt*3)` in `src/scene.js` and change `3` to `1.5`. A smaller factor approaches the camera target more slowly. Reduced-motion users skip this interpolation.

To move a cabinet, edit its `x` / `z` position in the systems array in `scripts/build-data.mjs`, then run:

```powershell
node scripts/build-data.mjs
npm test
npm run build
```

Connections follow their endpoint positions. Zone platforms and room fixtures are currently authored separately in `scene.js`, so adjust those too if you make large position changes. Do not edit generated `src/incident.json` and then regenerate it unless you have also updated the authoring helper.

## Run, compare and recover

In this directory:

```powershell
npm run dev
```

The realistic edition uses **4174**. The original uses **4173**. You can run both and compare them side by side. After copying this directory to another machine, install Node.js and run `npm ci` before starting.

For a production bundle, run `npm run build`. To serve it locally, stop this edition's dev server with Ctrl+C, then run `npm run preview`. No publishing is required.

If a look gets confusing, use Reset. If an imported JSON is invalid, the app keeps the previous look and shows a message. If a source edit breaks the app, undo that edit; the original sibling directory is still available for comparison.

## Keep visual design separate from history

The lights, floor, glass doors and fixtures are artistic reconstruction. Do not add invented historical events just to make a dramatic scene. Keep documentary source links and uncertainty labels. Packet speed, scene severity, cabinet counts and agent labels are teaching aids, not measurements from the incident.

Future refinements can add more faithful hardware assets, better organization of large clusters and more readable boundary-crossing animation. Make one improvement at a time, then compare the same event and camera angle so you can judge its effect.

## Data-driven views and SOC records
The systems shown by filtered views and their camera presets now live in `incident.views` in `scripts/build-data.mjs` (generated into `src/incident.json`). Edit `members`, `camera` and `target`, then regenerate the JSON. Camera coordinates are absolute scene positions. `Reset camera` restores the current view's preset. The earlier `setView()` source-edit advice applies to behavior; configure membership and camera coordinates in the data first.

SOC observations are declared separately in `incident.alerts`: each references an event and asset, with source/destination, sensor, workload identity, teaching category and investigation guidance. Their timestamps follow the event's date precision and presentation time. Confidence is explicitly unscored because these are synthetic examples. These records do not prove that a real detector fired at that point.

## Room layout is now incident data
Use `incident.environment` in `scripts/build-data.mjs` to change zone platform positions/sizes/colors, overhead rail x-positions, floor bounds/tile spacing, and organization label text/positions/colors. Run `node scripts/build-data.mjs` afterward. `src/scene.js` still controls the reusable visual style and fixture shapes. Omitting the optional environment removes incident-specific decoration while keeping the base floor and systems. Floor spacing must be positive; validation rejects more than 1,000 tiles to avoid accidental excessive geometry. The room layout remains synthetic.

## Individual simulated agents
Select an agent under **Inspect asset** to see its own status, objective, access, network activity and risk. These are explicit synthetic teaching roles, not recovered historical identities. Events declare `agentStates`, one record per actor; change their authoring logic in `scripts/build-data.mjs` and regenerate. The scene agent count excludes blocked and terminated agents. Seeking backwards recomputes the earlier states, so later privileges do not leak into earlier scenes. Amber cabinet indicators identify represented agent anomalies.

## Kubernetes and identity detail panels
Choose **Kubernetes View** or **Identity / Credentials**. Below the scene, dedicated cards show conceptual workload layers, intended permissions, the boundary between them and defensive controls. Cards highlight only when their linked asset is affected at the current playhead. **Focus** selects that asset in the 3D scene and inspector. These are synthetic teaching models, not the actual production inventory or roles. Customize records in `incident.drilldowns` in `scripts/build-data.mjs`; `asset` must reference an existing system. Regenerate data afterward.
