# Room card (fork feature)

`custom:scene-presets-room-card` shows one room (Home Assistant area) on a dashboard:

- **Room slider** – tap to switch all lights of the room on/off, drag for brightness, hold for details.
- **Scene tiles** – every `scene.*` entity assigned to the area, with the preset image for saved
  scenes. Tap activates the scene, **double tap** applies a dynamic saved scene once (static),
  hold opens the details. The active scene is outlined and checked, dynamic scenes show an icon.
- **Light rows** – light helpers (light groups) of the room as rows, expandable (›) to their member
  lights; lights that are not part of a helper get their own row. Each row works like the room
  slider (tap / drag / hold).
- **Auto chip** – the Raumlicht motion switch of the room, if Raumlicht is used.

The card is loaded by the integration automatically, no dashboard resource is needed. It is built
entirely from the area, so new scenes and lights show up without changing the dashboard.

## Configuration

```yaml
type: custom:scene-presets-room-card
area: arbeitszimmer
```

| Option        | Default | Description                                                                 |
|---------------|---------|-----------------------------------------------------------------------------|
| `area`        | –       | Area ID (required)                                                          |
| `name`        | area name | Title of the room slider                                                  |
| `columns`     | 3       | Columns of the scene tiles                                                  |
| `lights`      | auto    | Explicit list of light entities instead of all lights of the area          |
| `hide`        | –       | Entities (lights or scenes) not to show                                     |
| `master`      | auto    | Light (group) used for the room slider                                      |
| `structural`  | –       | Additional light groups that are not shown as rows (only their members)     |
| `show_lights` | true    | Show the light rows                                                         |
| `show_auto`   | true    | Show the Raumlicht motion chip                                              |

## How lights are found

- All `light.*` entities of the area (entity area or device area), except hidden ones, entities
  with an entity category and Zigbee2MQTT/Govee segment lights (`*_segment_<n>`).
- With Raumlicht, the room and ambient light groups of the room are added, so their lights belong
  to the room even if they have no area.
- The room slider uses the Raumlicht room light group, otherwise a group that contains every light
  of the room, otherwise all lights together.
- Groups that contain every light of the room and the Raumlicht room/ambient groups are
  *structural*: they are not shown as rows, the helpers and lights inside them are.

## Raumlicht

If the area has a Raumlicht room, the card reads the `scenes` attribute of its
`select.*_lichtszene` (Raumlicht 0.4.4 or newer). Scene tiles that belong to a Raumlicht scene are
switched through `room_light.set_scene`, so Raumlicht knows the current scene, and the active tile
follows the Raumlicht scene. Several scene entities of one Raumlicht scene are shown as one tile.
