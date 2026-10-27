# Per-light timing (fork feature)

By default a dynamic scene changes **all** lights at the same moment, every `interval` seconds,
using the same `transition`. With many lights this can look synchronized.

Setting any of the following optional fields on `scene_presets.start_dynamic_scene` switches the
scene to per-light timing:

| Field            | Meaning                                                         |
|------------------|-----------------------------------------------------------------|
| `interval_min`   | Shortest wait (s) before a light changes its color again        |
| `interval_max`   | Longest wait (s)                                                 |
| `transition_min` | Shortest transition (s) of a single color change                |
| `transition_max` | Longest transition (s)                                           |

Each light then waits a random time between `interval_min` and `interval_max`, and fades to its
next (smart shuffled) color using a random transition between `transition_min` and `transition_max`.
Both values are picked again for every change.

If only one bound of a pair is given, the other one falls back to `interval` / `transition`.

The first iteration still applies the preset to all lights at once with a short transition.
Lights that are turned off are left alone; the scene stops once all its lights are off.

## Example

```yaml
action: scene_presets.start_dynamic_scene
data:
  preset_id: 19175aca-cd4d-4e3d-b144-03f96edbf412
  targets:
    entity_id:
      - light.living_room_floor_lamp
      - light.living_room_govee_strip
  interval_min: 20
  interval_max: 60
  transition_min: 5
  transition_max: 15
```
