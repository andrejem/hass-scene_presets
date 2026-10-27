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
- [x] Screenshot of the room card in the README
- [x] Tested in Home Assistant (area + exclude resolution, dashboard screenshots)

## Ideas

- [ ] Visual card editor (area picker)
- [ ] Exclude list in the panel save dialog
- [ ] Shorter light names in narrow rows (strip common prefixes)

- [ ] Edit a saved scene in the panel (currently: overwrite via `save_scene` with `id`)
- [ ] Use saved scenes in the Raumlicht integration
- [ ] Replace the remaining `mwc-button` usages of upstream (no longer rendered in HA 2026.x)
