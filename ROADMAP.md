# Roadmap (fork)

## Phase 1 - Per-light random timing  *(done)*

- [x] `start_dynamic_scene` accepts optional `interval_min`, `interval_max`,
      `transition_min`, `transition_max`
- [x] When set, every light runs on its own schedule with a random interval and transition
      per color change; without them the behavior is unchanged
- [x] Panel: "Per-light timing" switch with min/max inputs, ranges shown on active scene tiles
- [x] Manual test in Home Assistant (Zigbee2MQTT acoustic panels, HA 2026.10.3)
- [ ] Optionally offer as pull request upstream

## Phase 2 - Saved scenes  *(done)*

- [x] Store scenes (preset, targets, brightness, timing) in Home Assistant storage
- [x] Services to save, delete and activate saved scenes
- [x] One `scene.*` entity per saved scene with the preset image as entity picture
- [x] Manual test: save, activate via `scene.turn_on`, rename, survive restart, delete (no registry leftovers)

## Phase 3 - Panel  *(done)*

- [x] "My scenes" section with image tiles (tap to activate, trash icon to delete)
- [x] Save button + dialog: pick a preset, store it with the current targets and tunables
- [x] UI end-to-end test with a headless browser

- [x] README: fork features section (per-light timing, saved scenes, HA 2026.x dialog buttons)

## Phase 4 - Room card  *(done)*

- [x] `activate_saved_scene` accepts `dynamic` to override the saved mode (double tap = static)
- [x] `custom:scene-presets-room-card`: room slider, scene tiles, light helper rows with members,
      Raumlicht scene mapping and motion chip, auto-loaded by the integration
- [x] Tested in Home Assistant (dark/light, phone/desktop, tap/drag/double tap/hold)

## Phase 5 - Area scenes and card layout  *(done)*

- [x] `exclude` for `apply_preset`, `start_dynamic_scene` and saved scenes; segment lights are
      skipped for area/device/floor/label targets
- [x] Room card: groups full width, single lights and expanded members two per line
      (`light_columns`), explicit scene order (`scenes`)
- [x] `keep_groups`: control light groups as one light (also in dynamic scenes)
- [x] Stopping dynamic scenes also matches groups by their members
- [x] `optional` lights: take part only if on, join the active (static or dynamic) scene when
      turned on later
- [x] Screenshot of the room card in the README
- [x] Tested in Home Assistant (area + exclude resolution, dashboard screenshots)

## Phase 6 - Lamp modes  *(done, 2.8.0)*

- [x] `activate_saved_scene` with `targets`: apply a saved scene to other lights
- [x] Single lights leave a running dynamic scene instead of stopping it (`remove_light`)
- [x] Lights can join and leave a per-light dynamic scene while it runs
- [x] Optional lights keep their room scene when they get an own mode
- [x] Used by the Tap Dial integration: button 2/4 cycles the room scenes on one lamp
- [x] Tested in Home Assistant (Surimu panel in the living room, static and dynamic)

## Phase 7 - Edit scenes, brightness per light  *(done, 2.9.0)*

- [x] Pencil on saved scenes: load into the panel, save / save as new / delete
- [x] `light_brightness` per scene: brightness in percent for single lights (groups apply to members)
- [x] Websocket `scene_presets/resolve_targets` lists the lights of a scene for the dialog
- [x] Tested in Home Assistant (panel UI test, Govee strips at 5 % in "Wohnzimmer Ruhephase")

## Phase 8 - 0 % = off  *(done, 2.9.1)*

- [x] `light_brightness` accepts 0: the light is turned off when the scene starts (static and dynamic)
- [x] Lights with 0 % can be turned on again afterwards; optional lights and lamp modes use the scene brightness
- [x] Panel: brightness per light accepts 0
- [x] Tested in Home Assistant ("Wohnzimmer Ruhephase": Govee and Signe at 0 %, lamp mode turns Signe on)

## Ideas

- [ ] Visual card editor (area picker)
- [ ] Exclude list in the panel save dialog
- [ ] Shorter light names in narrow rows (strip common prefixes)

- [ ] Use saved scenes in the Raumlicht integration
- [ ] Replace the remaining `mwc-button` usages of upstream (no longer rendered in HA 2026.x)
