# Saved scenes (fork feature)

A saved scene stores a preset together with its targets and all settings (brightness, transition,
shuffle, dynamic mode incl. per-light timing). Saved scenes are kept in Home Assistant storage
(`.storage/scene_presets.saved_scenes`) and survive restarts.

Every saved scene is also available as a **scene entity** (e.g. `scene.living_room_relax`) with the
preset image as entity picture. Turning it on (`scene.turn_on`, a dashboard tile, a voice command)
activates the saved scene. Renaming a saved scene keeps its entity ID.

## Panel

1. Select targets and tunables (Dynamic, Per-light timing, brightness, ...).
2. Click the **save** icon (floppy disk) at the top right.
3. Pick the preset (defaults to the last tapped one), enter a name and click **Save**.
   The current targets and tunables are stored with it.
4. The scene shows up under **My scenes**. Tap the tile to activate it, use the trash icon to delete it.

## Services

| Service                              | Fields                                                                                                  |
|--------------------------------------|---------------------------------------------------------------------------------------------------------|
| `scene_presets.save_scene`           | `name`, `preset_id`, `targets`, optional `id` (overwrite), `dynamic`, `exclude` and all fields of `apply_preset` / `start_dynamic_scene` |
| `scene_presets.activate_saved_scene` | `id`, optional `dynamic` (override the saved mode)                                                      |
| `scene_presets.delete_saved_scene`   | `id` (also removes the scene entity)                                                                    |

`activate_saved_scene` accepts an optional `dynamic` flag that overrides the saved mode:
`dynamic: false` applies a dynamic scene once with spread colors (and stops a dynamic scene that is
running on the same lights), `dynamic: true` starts a static scene as dynamic scene.

`save_scene` returns the stored scene (including its `id`) as response.
The websocket command `scene_presets/get_saved_scenes` lists all saved scenes.

## Areas and exclude

A scene can target a whole area (or device, floor, label) and leave single lights out with
`exclude`. Excluding a light group also excludes its members. When lights come from an area,
device, floor or label, Zigbee2MQTT/Govee segment lights (`*_segment_<n>`) are skipped
automatically, otherwise they would fight with their main light. Light groups of the area are
resolved to their members as before. Lights and groups listed explicitly in `entity_id` work as
before, a scene with a single light is fine.

New lights in the area are part of the scene automatically. `exclude` also works for
`apply_preset` and `start_dynamic_scene`.

```yaml
action: scene_presets.save_scene
data:
  name: Living room standard
  preset_id: e71b2ef3-1b15-4c4b-b036-4b3d6efe58f8
  targets:
    area_id: living_room
  exclude:
    - light.tv_ambilight
    - light.nanoleaf_shapes
```

## Example

```yaml
action: scene_presets.save_scene
data:
  name: Living room relax
  preset_id: e71b2ef3-1b15-4c4b-b036-4b3d6efe58f8
  targets:
    entity_id:
      - light.living_room_floor_lamp
      - light.living_room_govee_strip
  dynamic: true
  interval_min: 20
  interval_max: 60
  transition_min: 5
  transition_max: 15
```
