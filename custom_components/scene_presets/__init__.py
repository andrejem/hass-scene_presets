# Modified by andrejem (2026): start_dynamic_scene accepts optional per-light
# interval/transition ranges (interval_min/max, transition_min/max).
# Saved scenes: save/delete/activate services and a scene platform.
# Optional exclude list and keep_groups for apply_preset, start_dynamic_scene and saved scenes.

import voluptuous as vol
import homeassistant.helpers.config_validation as cv
import logging
from homeassistant.core import HomeAssistant, SupportsResponse
from homeassistant.config_entries import ConfigEntry
from .const import *

from .dynamic_scenes import DynamicScene, DynamicSceneManager
from .presets import apply_preset
from .view import async_setup_view, async_remove_view
from .util import ensure_list, resolve_targets, filter_targets, resolve_entity_ids
from .websocket_api import async_setup_websocket_api
from .saved_scenes import SavedSceneStore, build_service_call

PLATFORMS = ["scene"]

CONFIG_SCHEMA = cv.empty_config_schema(DOMAIN)

APPLY_PRESET_SCHEMA = vol.Schema({
    vol.Required(ATTR_SCENE_PRESET_ID): cv.string,
    vol.Required(ATTR_TARGETS): vol.Any(dict),
    vol.Optional(ATTR_BRIGHTNESS): vol.Coerce(int),
    vol.Optional(ATTR_TRANSITION, default=1): vol.Coerce(int),
    vol.Optional(ATTR_SHUFFLE, default=False): cv.boolean,
    vol.Optional(ATTR_SMART_SHUFFLE, default=False): cv.boolean,
    vol.Optional(ATTR_EXCLUDE): cv.entity_ids,
    vol.Optional(ATTR_KEEP_GROUPS): cv.entity_ids,
})

START_DYNAMIC_SCENE_SCHEMA = vol.Schema({
    vol.Required(ATTR_SCENE_PRESET_ID): cv.string,
    vol.Required(ATTR_TARGETS): vol.Any(dict),
    vol.Optional(ATTR_INTERVAL, default=60): vol.Coerce(int),
    vol.Optional(ATTR_BRIGHTNESS): vol.Coerce(int),
    vol.Optional(ATTR_TRANSITION, default=1): vol.Coerce(int),
    vol.Optional(ATTR_INTERVAL_MIN): vol.All(vol.Coerce(float), vol.Range(min=1)),
    vol.Optional(ATTR_INTERVAL_MAX): vol.All(vol.Coerce(float), vol.Range(min=1)),
    vol.Optional(ATTR_TRANSITION_MIN): vol.All(vol.Coerce(float), vol.Range(min=0)),
    vol.Optional(ATTR_TRANSITION_MAX): vol.All(vol.Coerce(float), vol.Range(min=0)),
    vol.Optional(ATTR_EXCLUDE): cv.entity_ids,
    vol.Optional(ATTR_KEEP_GROUPS): cv.entity_ids,
})


def _build_range(data, attr_min, attr_max, fallback):
    low = data.get(attr_min, fallback)
    high = data.get(attr_max, fallback)
    if low > high:
        raise vol.Invalid(f"'{attr_min}' must not be greater than '{attr_max}'.")
    return [low, high]

STOP_DYNAMIC_SCENE_SCHEMA = vol.Schema({
    vol.Required(ATTR_DYNAMIC_SCENE_ID): cv.string,
})

SAVE_SCENE_SCHEMA = vol.Schema({
    vol.Optional(ATTR_DYNAMIC_SCENE_ID): cv.string,
    vol.Required(ATTR_NAME): vol.All(cv.string, vol.Length(min=1)),
    vol.Required(ATTR_SCENE_PRESET_ID): cv.string,
    vol.Required(ATTR_TARGETS): vol.Any(dict),
    vol.Optional(ATTR_DYNAMIC, default=False): cv.boolean,
    vol.Optional(ATTR_BRIGHTNESS): vol.Coerce(int),
    vol.Optional(ATTR_TRANSITION): vol.Coerce(int),
    vol.Optional(ATTR_SHUFFLE): cv.boolean,
    vol.Optional(ATTR_SMART_SHUFFLE): cv.boolean,
    vol.Optional(ATTR_INTERVAL): vol.Coerce(int),
    vol.Optional(ATTR_INTERVAL_MIN): vol.All(vol.Coerce(float), vol.Range(min=1)),
    vol.Optional(ATTR_INTERVAL_MAX): vol.All(vol.Coerce(float), vol.Range(min=1)),
    vol.Optional(ATTR_TRANSITION_MIN): vol.All(vol.Coerce(float), vol.Range(min=0)),
    vol.Optional(ATTR_TRANSITION_MAX): vol.All(vol.Coerce(float), vol.Range(min=0)),
    vol.Optional(ATTR_EXCLUDE): cv.entity_ids,
    vol.Optional(ATTR_KEEP_GROUPS): cv.entity_ids,
})

SAVED_SCENE_ID_SCHEMA = vol.Schema({
    vol.Required(ATTR_DYNAMIC_SCENE_ID): cv.string,
})

ACTIVATE_SAVED_SCENE_SCHEMA = vol.Schema({
    vol.Required(ATTR_DYNAMIC_SCENE_ID): cv.string,
    vol.Optional(ATTR_DYNAMIC): cv.boolean,
})

STOP_DYNAMIC_SCENES_FOR_TARGETS_SCHEMA = vol.Schema({
    vol.Required(ATTR_TARGETS): vol.Any(dict),
})


_LOGGER = logging.getLogger(__name__)

dynamic_scene_manager = DynamicSceneManager()


async def async_setup(hass, config):
    saved_scene_store = SavedSceneStore(hass)
    await saved_scene_store.async_load()
    hass.data.setdefault(DOMAIN, {})["saved_scenes"] = saved_scene_store

    async def apply_preset_service(call):
        preset_id = call.data.get(ATTR_SCENE_PRESET_ID)
        targets = call.data.get(ATTR_TARGETS)
        brightness_override = call.data.get(ATTR_BRIGHTNESS)
        transition = call.data.get(ATTR_TRANSITION, 1)
        shuffle = call.data.get(ATTR_SHUFFLE, False)
        smart_shuffle = call.data.get(ATTR_SMART_SHUFFLE, False)

        entity_ids = ensure_list(targets.get("entity_id"))
        device_ids = ensure_list(targets.get("device_id"))
        area_ids = ensure_list(targets.get("area_id"))
        floor_ids = ensure_list(targets.get("floor_id"))
        label_ids = ensure_list(targets.get("label_id"))


        light_entity_ids = filter_targets(
            hass,
            resolve_targets(hass, entity_ids, device_ids, area_ids, floor_ids, label_ids),
            entity_ids,
            call.data.get(ATTR_EXCLUDE),
            call.data.get(ATTR_KEEP_GROUPS),
        )

        await apply_preset(
            hass,
            preset_id,
            light_entity_ids,
            transition,
            shuffle,
            smart_shuffle,
            brightness_override
        )


    async def start_dynamic_scene(call):
        # always stop any existing actions first
        await stop_dynamic_scenes_for_targets(call)

        preset_id = call.data.get(ATTR_SCENE_PRESET_ID)
        targets = call.data.get(ATTR_TARGETS)
        interval = call.data.get(ATTR_INTERVAL)

        brightness_override = call.data.get(ATTR_BRIGHTNESS)
        transition = call.data.get(ATTR_TRANSITION, 1)
        shuffle = True

        entity_ids = ensure_list(targets.get("entity_id"))
        device_ids = ensure_list(targets.get("device_id"))
        area_ids = ensure_list(targets.get("area_id"))
        floor_ids = ensure_list(targets.get("floor_id"))
        label_ids = ensure_list(targets.get("label_id"))

        light_entity_ids = filter_targets(
            hass,
            resolve_targets(hass, entity_ids, device_ids, area_ids, floor_ids, label_ids),
            entity_ids,
            call.data.get(ATTR_EXCLUDE),
            call.data.get(ATTR_KEEP_GROUPS),
        )

        parameters = {
            "preset_id": preset_id,
            "light_entity_ids": light_entity_ids,
            "brightness": brightness_override,
            "transition": transition,
            "shuffle": shuffle
        }

        range_attrs = (ATTR_INTERVAL_MIN, ATTR_INTERVAL_MAX, ATTR_TRANSITION_MIN, ATTR_TRANSITION_MAX)
        if any(attr in call.data for attr in range_attrs):
            # Every light gets its own schedule with randomized interval and transition
            parameters[ATTR_PER_LIGHT] = True
            parameters[ATTR_INTERVAL_RANGE] = _build_range(call.data, ATTR_INTERVAL_MIN, ATTR_INTERVAL_MAX, interval)
            parameters[ATTR_TRANSITION_RANGE] = _build_range(call.data, ATTR_TRANSITION_MIN, ATTR_TRANSITION_MAX, transition)

        return dynamic_scene_manager.create_new(hass, parameters, interval)

    async def stop_dynamic_scene(call):
        scene_id = call.data.get(ATTR_DYNAMIC_SCENE_ID)

        dynamic_scene_manager.delete_by_id(scene_id)

    async def stop_dynamic_scenes_for_targets(call):
        targets = call.data.get(ATTR_TARGETS)

        entity_ids = ensure_list(targets.get("entity_id"))
        device_ids = ensure_list(targets.get("device_id"))
        area_ids = ensure_list(targets.get("area_id"))
        floor_ids = ensure_list(targets.get("floor_id"))
        label_ids = ensure_list(targets.get("label_id"))

        light_entity_ids = filter_targets(
            hass,
            resolve_targets(hass, entity_ids, device_ids, area_ids, floor_ids, label_ids),
            entity_ids,
            call.data.get(ATTR_EXCLUDE),
            call.data.get(ATTR_KEEP_GROUPS),
        )

        # A dynamic scene may control a group as one light, so compare on member level too
        target_ids = set(light_entity_ids)
        for target_id in light_entity_ids:
            target_ids.update(resolve_entity_ids(hass, target_id))
        for scene in list(dynamic_scene_manager.get_all()):
            scene_ids = set(scene.parameters.get("light_entity_ids", []))
            for scene_light_id in list(scene_ids):
                scene_ids.update(resolve_entity_ids(hass, scene_light_id))
            if scene_ids & target_ids:
                dynamic_scene_manager.delete_by_id(scene.id)

        return True

    async def stop_all_dynamic_scenes(call):
        dynamic_scene_manager.stop_all()

    async def get_dynamic_scenes(call):
        return dynamic_scene_manager.get_all_as_dict()

    async def save_scene(call):
        scene = await saved_scene_store.async_save_scene(dict(call.data))
        return {"scene": scene}

    async def delete_saved_scene(call):
        scene_id = call.data.get(ATTR_DYNAMIC_SCENE_ID)
        if not await saved_scene_store.async_delete_scene(scene_id):
            raise vol.Invalid(f"Saved scene '{scene_id}' not found.")

    async def activate_saved_scene(call):
        scene_id = call.data.get(ATTR_DYNAMIC_SCENE_ID)
        scene = saved_scene_store.get(scene_id)
        if scene is None:
            raise vol.Invalid(f"Saved scene '{scene_id}' not found.")

        service, service_data = build_service_call(scene, call.data.get(ATTR_DYNAMIC))
        if service == SERVICE_APPLY_PRESET:
            # A running dynamic scene on these lights would immediately override the static one
            await hass.services.async_call(
                DOMAIN, SERVICE_STOP_DYNAMIC_SCENES_FOR_TARGETS,
                {ATTR_TARGETS: service_data[ATTR_TARGETS]}, blocking=True,
            )
        await hass.services.async_call(DOMAIN, service, service_data, blocking=True)


    hass.services.async_register(
        DOMAIN,
        SERVICE_APPLY_PRESET,
        apply_preset_service,
        schema=APPLY_PRESET_SCHEMA,
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_GET_DYNAMIC_SCENES,
        get_dynamic_scenes,
        supports_response=SupportsResponse.ONLY
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_START_DYNAMIC_SCENE,
        start_dynamic_scene,
        schema=START_DYNAMIC_SCENE_SCHEMA,
        supports_response=SupportsResponse.OPTIONAL
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_STOP_DYNAMIC_SCENE,
        stop_dynamic_scene,
        schema=STOP_DYNAMIC_SCENE_SCHEMA
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_STOP_DYNAMIC_SCENES_FOR_TARGETS,
        stop_dynamic_scenes_for_targets,
        schema=STOP_DYNAMIC_SCENES_FOR_TARGETS_SCHEMA
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_STOP_ALL_DYNAMIC_SCENES,
        stop_all_dynamic_scenes,
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_SAVE_SCENE,
        save_scene,
        schema=SAVE_SCENE_SCHEMA,
        supports_response=SupportsResponse.OPTIONAL
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_DELETE_SAVED_SCENE,
        delete_saved_scene,
        schema=SAVED_SCENE_ID_SCHEMA
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_ACTIVATE_SAVED_SCENE,
        activate_saved_scene,
        schema=ACTIVATE_SAVED_SCENE_SCHEMA
    )


    return True

async def async_setup_entry(
    hass: HomeAssistant, entry: ConfigEntry
) -> bool:
    hass.data.setdefault(DOMAIN, {})

    await async_setup_view(hass)

    async_setup_websocket_api(hass, dynamic_scene_manager, hass.data[DOMAIN]["saved_scenes"])

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    return True

async def async_unload_entry(
    hass: HomeAssistant, entry: ConfigEntry
) -> bool:
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)

async def async_remove_entry(
    hass: HomeAssistant, entry: ConfigEntry
) -> None:

    await async_remove_view(hass)
