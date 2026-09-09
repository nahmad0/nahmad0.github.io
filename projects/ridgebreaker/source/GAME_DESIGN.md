# Game design

## Concept

The original drawing supplied the important proportions: enormous tires, a comparatively small lifted pickup, uneven ground, giant rocks, and trees. The implementation translates those into an ochre expedition truck, dark evergreen forest, pale granite, warm lighting, and a winding mountain trail. No sketch image or pre-rendered scene substitutes for gameplay.

## Loop and progression

Drive, choose a line, climb or use momentum, salvage parts, reach the next camp, repair, upgrade, and continue uphill. There is no opponent or compulsory race timer. The timer is an expedition statistic. Reset is forgiving: the truck returns to its latest camp with at least 60 integrity; collectibles and upgrades remain. Camps fully restore integrity and boost and award three parts.

Camps are sequential. Entering the summit area without activating the intermediate camps does not win. The player wins near the summit gate after all previous camps. The result dialog shows time, salvage, and integrity; exploration can continue afterward.

## Forgotten Ridge

Coordinates are metres, with increasing world Z following the expedition. The route reaches roughly 120 m elevation above the origin.

| Area                | Implemented challenge                                       |
| ------------------- | ----------------------------------------------------------- |
| Forest start        | Wide winding trail, flags, basecamp                         |
| Granite steps       | Low individual collidable rocks                             |
| Blackwater mud      | Reduced grip, drag, alternate western trail                 |
| Boulder run         | Loose rigid-body boulders and proximity-triggered rockslide |
| Knife-edge ledge    | Cliff cut beside a narrowed drivable shelf                  |
| Broken crossing     | Independent collapsing slabs; longer eastern bypass         |
| River ford          | Shallow depressed crossing, water drag/current              |
| Upper winding climb | Steeper terrain and changing approach angles                |
| Copper mine         | Cabin, rails, cave branch, abandoned prototype              |
| Final ascent        | Increasing grade, summit signal tower                       |
| Summit              | Last camp and expedition result                             |

The upper trail is a winding climb rather than a fully authored series of hairpin switchbacks. The cave is a simple accessible stone arch with a translucent waterfall plane and a prototype relic; it is not an underground dungeon. Side trails have their own salvage. One uniquely identified secret currently exists.

## Vehicle mechanics

The chassis is approximately 985 kg with a low main collider. Each 1.06 m radius wheel independently probes terrain. Suspension has 0.9 m rest length and 0.55 m travel. Four-wheel drive supplies 2,500 N per wheel before upgrades. Boost multiplies torque by 1.8, drains charge, and raises engine temperature. Regeneration and cooling occur without boost. Excess heat temporarily interrupts sustained boosting.

High-speed steering reduces automatically. The vehicle keeps real pitch, roll, and airborne motion, with modest anti-roll assistance. Health never falls below 10; low health reduces engine output. Landing damage uses descent speed so a suspension-softened impact still registers. No per-tire or suspension damage simulation is present.

Hold E to choose an eligible uphill anchor within 24 m. The winch applies force until released, too close, or beyond maximum distance. It is a force assist with a visible cable, not a simulated rope.

## Upgrades

Three levels each, available within 18 m of the latest camp. Levels cost 3, 5, and 7 parts.

- Engine: +650 N per wheel per level.
- Tires: stronger traction, with a substantial mud benefit.
- Suspension: stiffer spring response and better landing tolerance.

## Future design priorities

Human playtesting should tune traversal difficulty and winch usefulness before adding progression breadth. Further work should add stronger route identities, a manually selected anchor, more secrets, a more dramatic skyline, a clearer mine interior, and actual hairpin switchbacks.
