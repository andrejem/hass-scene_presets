# Modified by andrejem (2026): added scene_presets/get_saved_scenes and
# scene_presets/resolve_targets (lights of a scene, for brightness per light) commands

import voluptuous as vol
from homeassistant.components import websocket_api
import homeassistant.helpers.config_validation as cv

from .optional_lights import split_optional
from .util import ensure_list, filter_targets, resolve_targets

def async_setup_websocket_api(_hass, dynamic_scene_manager, saved_scene_store=None) -> None:
    @websocket_api.websocket_command(
        {
            vol.Required("type"): "scene_presets/get_dynamic_scenes",
        }
    )
    def ws_get_dynamic_scenes(
            hass, connection, msg
    ) -> None:
        connection.send_result(msg["id"], dynamic_scene_manager.get_all_as_dict())


    websocket_api.async_register_command(_hass, ws_get_dynamic_scenes)

    @websocket_api.websocket_command(
        {
            vol.Required("type"): "scene_presets/get_saved_scenes",
        }
    )
    def ws_get_saved_scenes(
            hass, connection, msg
    ) -> None:
        scenes = saved_scene_store.get_all() if saved_scene_store is not None else []
        connection.send_result(msg["id"], {"saved_scenes": scenes})

    websocket_api.async_register_command(_hass, ws_get_saved_scenes)

    @websocket_api.websocket_command(
        {
            vol.Required("type"): "scene_presets/resolve_targets",
            vol.Required("targets"): dict,
            vol.Optional("exclude"): cv.entity_ids,
            vol.Optional("keep_groups"): cv.entity_ids,
            vol.Optional("optional"): cv.entity_ids,
        }
    )
    def ws_resolve_targets(
            hass, connection, msg
    ) -> None:
        """The lights a scene with these targets controls (same rules as the services)."""
        targets = msg["targets"]
        entity_ids = ensure_list(targets.get("entity_id"))
        lights = filter_targets(
            hass,
            resolve_targets(
                hass,
                entity_ids,
                ensure_list(targets.get("device_id")),
                ensure_list(targets.get("area_id")),
                ensure_list(targets.get("floor_id")),
                ensure_list(targets.get("label_id")),
            ),
            entity_ids,
            msg.get("exclude"),
            msg.get("keep_groups"),
        )
        base, _on, optional_ids = split_optional(hass, lights, msg.get("optional"), msg.get("keep_groups"))
        result = []
        for entity_id in base + optional_ids:
            state = hass.states.get(entity_id)
            result.append({
                "entity_id": entity_id,
                "name": state.name if state else entity_id,
                "optional": entity_id in optional_ids,
            })
        result.sort(key=lambda light: light["name"].lower())
        connection.send_result(msg["id"], {"lights": result})

    websocket_api.async_register_command(_hass, ws_resolve_targets)
