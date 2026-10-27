# Modified by andrejem (2026): added scene_presets/get_saved_scenes command

import voluptuous as vol
from homeassistant.components import websocket_api

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



