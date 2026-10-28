# Modified by andrejem (2026): serves and auto-loads the room card (scene-presets-room-card);
# frontend URLs carry a hash of the file, so browsers load a new build without a version bump
import hashlib
from .const import NAME, DOMAIN, PANEL_URL, ROOM_CARD_URL
from .file_utils import VERSION, PRESET_DATA, BASE_PATH
from homeassistant.components.http import HomeAssistantView, StaticPathConfig
from homeassistant.components.frontend import async_remove_panel, async_register_built_in_panel

# Adapted from https://github.com/hacs/integration/blob/7d46a52de0df2466aa65e446458b952150398f4c/custom_components/hacs/frontend.py#L58
try:
    from homeassistant.components.frontend import add_extra_js_url
except ImportError:
    def add_extra_js_url(hass: HomeAssistant, url: str, es5: bool = False) -> None:
        if "frontend_extra_module_url" not in hass.data:
            hass.data["frontend_extra_module_url"] = set()
        hass.data["frontend_extra_module_url"].add(url)

class ScenePresetDataView(HomeAssistantView):
    url = f'/assets/{DOMAIN}/scene_presets.json'
    name = f'assets:{DOMAIN}:preset_data'
    requires_auth = False

    async def get(self, request):
        return self.json(
            result=PRESET_DATA,
        )

def _file_hash(path):
    try:
        with open(path, "rb") as file:
            return hashlib.sha1(file.read()).hexdigest()[:10]
    except OSError:
        return VERSION


async def async_setup_view(hass):
    panel_path = hass.config.path(f'{BASE_PATH}/frontend/scene_presets_panel.js')
    card_path = hass.config.path(f'{BASE_PATH}/frontend/scene-presets-room-card.js')
    panel_hash = await hass.async_add_executor_job(_file_hash, panel_path)
    card_hash = await hass.async_add_executor_job(_file_hash, card_path)
    static_paths = [
        StaticPathConfig(PANEL_URL, hass.config.path(f'{BASE_PATH}/frontend/scene_presets_panel.js'), True),
        StaticPathConfig(f'/assets/{DOMAIN}/iconset.js', hass.config.path(f'{BASE_PATH}/res/iconset.js'), True),
        StaticPathConfig(ROOM_CARD_URL, hass.config.path(f'{BASE_PATH}/frontend/scene-presets-room-card.js'), True),
    ]
    
    static_paths.extend(await get_preset_image_paths(hass))

    await hass.http.async_register_static_paths(static_paths)

    hass.http.register_view(ScenePresetDataView)
    add_extra_js_url(hass, f"/assets/{DOMAIN}/iconset.js?{VERSION}")
    add_extra_js_url(hass, f"{ROOM_CARD_URL}?{card_hash}")

    async_register_built_in_panel(
        hass,
        component_name="custom",
        sidebar_title=NAME,
        sidebar_icon="scene_presets:scene_presets",
        frontend_url_path="scene_presets",
        require_admin=False,
        config={
            "_panel_custom": {
                "name": "scene-presets-panel",
                "module_url": f"{PANEL_URL}?{panel_hash}"
            },
            "version": VERSION
        },
    )

async def async_remove_view(hass):
    async_remove_panel(hass, "scene_presets")

async def get_preset_image_paths(hass):
    static_paths = []

    for preset in PRESET_DATA.get("presets", []):
        img_filename = preset.get("img")
        is_custom = preset.get("custom")

        if img_filename is not None:
            path = f"{BASE_PATH}/assets/{img_filename}"
            if is_custom is not None and is_custom:
                path = f"{BASE_PATH}/userdata/custom/assets/{img_filename}"

            static_paths.append(
                StaticPathConfig(
                    f'/assets/{DOMAIN}/{img_filename}',
                    hass.config.path(path),
                    True
                )
            )

    return static_paths
