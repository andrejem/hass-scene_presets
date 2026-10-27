<div align="center">
    <img src="assets/logo/github_banner.svg" width="600" alt="scene_presets">
</div>
<br/>

> **Fork notice:** This is a fork of [Hypfer/hass-scene_presets](https://github.com/Hypfer/hass-scene_presets) with additional features (see [ROADMAP.md](ROADMAP.md)). Currently added: [per-light random timing](docs/Per-light%20timing.md) for dynamic scenes and [saved scenes](docs/Saved%20scenes.md) with scene entities, plus a [room card](docs/Room%20card.md) for dashboards.

This custom_component is an implementation of an idea not all too dissimilar to what the Philips Hue app calls Scenes.
Apart from that though, it has nothing to do with Hue. No bridge required.

Everything has been implemented entirely inside this custom_component, meaning that it works with every `light` entity.
No vendor restrictions. No need for special bridges.
And, most importantly, no account required :-)

## Screenshots

![ui.png](./img/ui.png)

![service.png](./img/service.png)


## Installation

1. Add the repository as a custom repository of type `integration` in HACS: https://hacs.xyz/docs/faq/custom_repositories/
2. Restart Home Assistant
3. Navigate to Settings > Devices & Services
4. Click Add integration
5. Search for Scene Presets
6. Click on it and follow the wizard 🧙

You should now have a new item in your sidebar.

## Usage

The `scene_presets` component can either be used via its UI or by calling its services in automations, scripts etc.

It is compatible with any color-capable light entity. Additionally, it will also try its best to map colors to a matching
color temperature if it encounters a light that only features tunable white capabilities.


### UI Usage

To get to know what is possible, I'd recommend opening up the UI first and playing around for a bit.<br/>
For that, simply open the Home Assistant sidebar, navigate to "Scene Presets", select your lights and then click on a preset tile to apply it.

The UI will remember your favorite presets, your last selected targets and the last state of your tunables in your browser's local storage.<br/>
This means that it is persistent but not synced across devices.

The tunables section allows you to further customize how the preset should be applied.<br/>
In normal mode, you have the following options:
- Shuffle - Whether or not the colors should be shuffled before applying them to the provided list of targets
- Smart Shuffle - Attempt to create smooth color transitions when shuffling. See [the docs](./docs/Smart%20Shuffle.md) for more info
- Custom brightness - Override the brightness specified in the preset
- Custom transition - Default transition time in normal mode is 1s

#### Dynamic Scenes

If you enable the `dynamic` toggle, you will have `Dynamic Scenes`.<br/>
These are endless loops that apply the same preset with `smart shuffled` colors every `interval` with a `transition` as specified.

`Dynamic Scenes` can be useful to e.g. have ambient lighting that constantly changes but does so mostly unnoticeable.<br/>
For that effect to work, you of course need to pick suitably long durations for `interval` and `transition`.

You can see all active dynamic scenes at the top of the UI. To stop them, just tap them.

Furthermore, you should know that<br/>
- a dynamic scene will automatically stop once you turn off all lights it was active on.
- a dynamic scene will be stopped if a second one is started that would also interact with a light that is already part of the first one.
- if you turn off parts of the lights that are part of a dynamic scene, they will not be turned back on by it.
- dynamic scenes can put a lot of strain on your zigbee network if you pick many lights and very short intervals.
- dynamic scenes may suffer from different lights having different command delays. Picking a longer transition time helps to mask that.
- dynamic scenes do not survive a restart of home assistant. This is intentional.
- dynamic scenes will on first iteration always use a transition of 0.5s and no smart shuffle for instant results and to make sure to get all colors of the selected preset into the rotation.

### Fork features

This fork adds the following on top of the original:

**Per-light timing** – In the Tunables, enable *Dynamic* and then *Per-light timing*. Instead of one
interval and transition for all lights, you set a min/max range for both. Every light then changes
on its own schedule and picks a new random interval and transition for every color change, so the
lights no longer change in sync. Active scene tiles show the ranges (e.g. `I: 20-60s, T: 5-15s`).
Details: [docs/Per-light timing.md](docs/Per-light%20timing.md)

**Saved scenes** – Select targets and tunables, click the save icon (floppy disk) at the top right,
pick a preset and give it a name. The scene is stored in Home Assistant (not in the browser) and
shows up under *My scenes* in the panel. Tap a tile to activate it, use the trash icon to delete it.
Every saved scene is also a `scene.*` entity with the preset image, so it can be used in dashboards,
automations and voice commands. Details: [docs/Saved scenes.md](docs/Saved%20scenes.md)

**Room card** – `custom:scene-presets-room-card` shows a room (area) on a dashboard: room
brightness slider, scene tiles with preset images (tap = activate, double tap = dynamic scene
once/static, hold = details), light helpers expandable to single lights and the Raumlicht motion
switch. It is built from the area automatically and loaded by the integration, no resource needed.
Details: [docs/Room card.md](docs/Room%20card.md)

**Home Assistant 2026.x** – Dialog buttons are plain buttons, because `mwc-button` is no longer
rendered by recent Home Assistant versions.

### Service usage

The UI is not the only way to use this component. In fact, it too just calls the services provided by it.

You can use the services to e.g. bind scene presets to a button on a remote or someone entering a room or maybe even a voice command.

To make this easier, you can use the UI, do the action you'd like to do and then click on the robot icon on the top right.<br/>
This will then open a dialog that looks like this with a copy-pasteable service call for easy automation:

![last_action_payload.png](./img/last_action_payload.png)

### Advanced usage

For advanced usage, use the Home Assistant DevTools and call the services provided by the custom_component directly.<br/>
Preset IDs can be found in the overview here: [assets](./custom_components/scene_presets/assets/Readme.md)

If you're a developer, you can also add your own presets by creating a json file.<br/>
Check the [docs page on that](./docs/Custom%20Presets.md) for more info.


## Docs

Check out the [./docs/](./docs) folder.

## Misc

Check out the [assets](./custom_components/scene_presets/assets/Readme.md) folder for a list with all presets available.
All of them have been manually extracted in a clean-room way by setting a group of lights to a scene and then noting the different x,y values + its name.
