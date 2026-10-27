# Roadmap (fork)

## Phase 1 - Per-light random timing  *(in progress)*

- [x] `start_dynamic_scene` accepts optional `interval_min`, `interval_max`,
      `transition_min`, `transition_max`
- [x] When set, every light runs on its own schedule with a random interval and transition
      per color change; without them the behavior is unchanged
- [x] Manual test in Home Assistant (Zigbee2MQTT acoustic panels, HA 2026.10.3)
- [ ] Optionally offer as pull request upstream

## Phase 2 - Saved scenes

- [ ] Store scenes (preset, targets, brightness, timing) in Home Assistant storage
- [ ] Services to save, delete and activate saved scenes
- [ ] One `scene.*` entity per saved scene (usable in automations, dashboards and Raumlicht)

## Phase 3 - Panel

- [ ] "My scenes" section with image tiles
- [ ] "Save current selection" button
- [ ] Inputs for per-light min/max timing
