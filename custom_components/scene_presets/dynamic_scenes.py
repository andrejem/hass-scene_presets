# Modified by andrejem (2026): added optional per-light timing with randomized
# interval and transition ranges. Without those ranges the behavior is unchanged.

import uuid
import asyncio
import logging
import random
from .presets import apply_preset
from .const import *

_LOGGER = logging.getLogger(__name__)

INITIAL_TRANSITION = 0.5


def _pick(value_range):
    low, high = value_range
    if low >= high:
        return low
    return random.uniform(low, high)


class DynamicScene:
    def __init__(self, hass, self_destruct_callback, parameters, interval):
        self.id = str(uuid.uuid4())
        self.hass = hass
        self.interval = interval
        self._running = False
        self._task = None
        self._light_tasks = []
        self.parameters = parameters
        self.self_destruct_callback = self_destruct_callback

        self.start_loop()

    @property
    def per_light(self):
        return self.parameters.get(ATTR_PER_LIGHT, False)

    def _get_light_states(self, light_entity_ids):
        return [self.hass.states.get(x) for x in light_entity_ids]

    def _all_lights_off(self):
        states = self._get_light_states(self.parameters.get("light_entity_ids", []))
        return not any(state is not None and state.state == "on" for state in states)

    def _self_destruct(self):
        self._running = False
        self.self_destruct_callback(self.id)

    async def _loop(self):
        run_count = 0

        while self._running:
            light_entity_ids = list(self.parameters.get("light_entity_ids"))
            transition = self.parameters.get(ATTR_TRANSITION)
            smart_shuffle = True

            if run_count == 0:
                transition = INITIAL_TRANSITION
                smart_shuffle = False
            else:
                entity_states = self._get_light_states(light_entity_ids)
                lights_on = len([x for x in entity_states if x is not None and x.state == "on"])

                if lights_on == 0:
                    self._self_destruct()
                    return
                else:
                    # The user probably purposefully turned off parts of the lights, so if one is off, we ignore it
                    light_entity_ids = [
                        entity_id for entity_id, state in zip(light_entity_ids, entity_states)
                        if state and state.state == "on"
                    ]

            await apply_preset(
                self.hass,
                self.parameters.get(ATTR_SCENE_PRESET_ID),
                light_entity_ids,
                transition,
                self.parameters.get(ATTR_SHUFFLE),
                smart_shuffle,
                self.parameters.get(ATTR_BRIGHTNESS, None),
            )
            run_count += 1

            await asyncio.sleep(self.interval)

    async def _per_light_loop(self):
        light_entity_ids = list(self.parameters.get("light_entity_ids"))

        # First iteration: apply to all lights at once for instant results and to get all colors into rotation
        await apply_preset(
            self.hass,
            self.parameters.get(ATTR_SCENE_PRESET_ID),
            light_entity_ids,
            INITIAL_TRANSITION,
            True,
            False,
            self.parameters.get(ATTR_BRIGHTNESS, None),
        )

        # Afterwards, every light runs on its own schedule
        self._light_tasks = [
            self.hass.async_create_task(self._single_light_loop(entity_id))
            for entity_id in light_entity_ids
        ]

        try:
            await asyncio.gather(*self._light_tasks)
        except asyncio.CancelledError:
            pass

        if self._running:
            # All single light loops ended because their lights were turned off
            self._self_destruct()

    async def _single_light_loop(self, entity_id):
        interval_range = self.parameters.get(ATTR_INTERVAL_RANGE)
        transition_range = self.parameters.get(ATTR_TRANSITION_RANGE)

        while self._running:
            await asyncio.sleep(_pick(interval_range))

            if not self._running:
                return

            state = self.hass.states.get(entity_id)
            if state is None or state.state != "on":
                # Same as in the regular loop: lights turned off by the user are left alone
                return

            await apply_preset(
                self.hass,
                self.parameters.get(ATTR_SCENE_PRESET_ID),
                [entity_id],
                round(_pick(transition_range), 1),
                True,
                True,
                self.parameters.get(ATTR_BRIGHTNESS, None),
            )

    def start_loop(self):
        if self._running:
            return
        self._running = True

        if self.per_light:
            self._task = self.hass.async_create_task(self._per_light_loop())
        else:
            self._task = self.hass.async_create_task(self._loop())

    def stop_loop(self):
        self._running = False

        for task in self._light_tasks:
            task.cancel()
        self._light_tasks = []

        if self._task:
            self._task.cancel()

    def to_dict(self):
        return {
            "id": self.id,
            "interval": self.interval,
            "parameters": self.parameters,
            "running": self._running,
        }

    def __del__(self):
        self.stop_loop()


class DynamicSceneManager:
    def __init__(self):
        self.dynamic_scenes = {}

    def create_new(self, hass, parameters, interval):
        scene = DynamicScene(
            hass,
            lambda scene_id: self.delete_by_id(scene_id),
            parameters,
            interval
        )
        self.dynamic_scenes[scene.id] = scene
        return scene.to_dict()

    def get_by_id(self, id):
        return self.dynamic_scenes.get(id)

    def delete_by_id(self, id):
        active_scene = self.dynamic_scenes.get(id)

        if active_scene:
            active_scene.stop_loop()
            del self.dynamic_scenes[id]

    def stop_all(self):
        scenes_to_delete = []

        for scene in self.dynamic_scenes.values():
            scene.stop_loop()
            scenes_to_delete.append(scene.id)

        for scene_id in scenes_to_delete:
            del self.dynamic_scenes[scene_id]

    def stop_all_for_entity_id(self, entity_id):
        scenes_to_delete = []

        for scene in self.dynamic_scenes.values():
            entity_ids = scene.parameters.get("light_entity_ids", [])
            if entity_id in entity_ids:
                scene.stop_loop()
                scenes_to_delete.append(scene.id)

        for scene_id in scenes_to_delete:
            del self.dynamic_scenes[scene_id]

    def get_all(self):
        return list(self.dynamic_scenes.values())

    def get_all_as_dict(self):
        scenes_dict = {"dynamic_scenes": []}

        for scene in self.dynamic_scenes.values():
            scenes_dict["dynamic_scenes"].append(scene.to_dict())

        return scenes_dict
