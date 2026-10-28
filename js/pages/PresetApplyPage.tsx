// Modified by andrejem (2026): per-light timing controls and saved scenes ("My scenes", save dialog),
// editing saved scenes and brightness per light

import React, {useEffect, useMemo, useState} from "react";
import {PresetTile} from "../components/PresetTile";
import {useLocalStorage} from "../hooks/useLocalStorage";
import HaSwitch from "../components/hass/building_blocks/HaSwitch";
import {HaTargetSelector, HaTargetSelectorValue} from "../components/hass/selectors/HaTargetSelector";
import {HaNumberSelector} from "../components/hass/selectors/HaNumberSelector";
import HaIconButton from "../components/hass/building_blocks/HaIconButton";
import {Category, Preset} from "../types";
import HaDialog from "../components/hass/building_blocks/HaDialog";
import MwcButton from "../components/hass/building_blocks/MwcButton";
import {DynamicSceneTile} from "../components/DynamicSceneTile";

const DEFAULT_TUNABLE_SETTINGS = {
    shuffle: false,
    smartShuffle: false,
    customBrightness: false,
    customBrightnessValue: 128,
    customTransition: false,
    customTransitionValue: 60,

    dynamic: false,
    dynamicTransitionValue: 45,
    dynamicIntervalValue: 60,
    dynamicPerLight: false,
    dynamicIntervalMin: 20,
    dynamicIntervalMax: 60,
    dynamicTransitionMin: 5,
    dynamicTransitionMax: 15,
};

const DIALOG_BUTTON_STYLE: React.CSSProperties = {
    padding: "0.5rem 1.25rem",
    fontSize: "0.95rem",
    fontWeight: 500,
    borderRadius: "18px",
    border: "none",
    cursor: "pointer",
    background: "transparent",
    color: "var(--primary-color, #03a9f4)"
};

const DIALOG_INPUT_STYLE: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    padding: "0.75rem",
    fontSize: "1rem",
    borderRadius: "4px",
    border: "1px solid var(--divider-color, #888)",
    background: "var(--card-background-color, transparent)",
    color: "var(--primary-text-color, inherit)"
};

const DYNAMIC_SCENE_REFRESH_INTERVAL = 30*1000;

export const Switch :React.FunctionComponent<{
    label: string,
    value: boolean,
    setValue: (newValue: boolean) => void
}> = ({
    label,
    value,
    setValue
}): React.JSX.Element => {
    return (
        <label
            style={{
                lineHeight: "3rem"
            }}
        >
            <span style={{marginRight: "0.5rem"}}>{label}</span>
            <HaSwitch
                value={value}
                onValueChanged={(value) => {
                    setValue(value);
                }}
            />
        </label>
    );
};


export const OptionalNumberSelector :React.FunctionComponent<{
    label: string,
    enabled: boolean,
    setEnabled: (newValue: boolean) => void,
    value: number,
    setValue: (newValue: number) => void,
    minValue: number,
    maxValue: number,
    hass: any,
    extraSelectorProps?: any
}> = ({
    label,
    enabled,
    setEnabled,
    value,
    setValue,
    minValue,
    maxValue,
    hass,
    extraSelectorProps = {}
}): React.JSX.Element => {
    return (
        <label
            style={{
                lineHeight: "3rem"
            }}
        >
            <span style={{marginRight: "0.5rem"}}>{label}</span>
            <HaSwitch
                value={enabled}
                onValueChanged={(value) => {
                    setEnabled(value);
                }}
            />
            {
                enabled &&
                <div
                    style={{
                        maxWidth: "540px"
                    }}
                >
                    <HaNumberSelector
                        hass={hass}
                        selector={{
                            "number": {
                                "min": minValue,
                                "max": maxValue,

                                ...extraSelectorProps
                            }
                        }}
                        value={value}
                        onValueChanged={(value: number) => {
                            setValue(value);
                        }}
                    />
                </div>
            }
        </label>
    );
};

export const NumberSelector :React.FunctionComponent<{
    label: string,
    value: number,
    setValue: (newValue: number) => void,
    minValue: number,
    maxValue: number,
    hass: any,
    extraSelectorProps?: any
}> = ({
    label,
    value,
    setValue,
    minValue,
    maxValue,
    hass,
    extraSelectorProps = {}
}): React.JSX.Element => {
    return (
        <label
            style={{
                lineHeight: "3rem"
            }}
        >
            <span style={{marginRight: "0.5rem"}}>{label}</span>

            <div
                style={{
                    maxWidth: "540px"
                }}
            >
                <HaNumberSelector
                    hass={hass}
                    selector={{
                        "number": {
                            "min": minValue,
                            "max": maxValue,

                            ...extraSelectorProps
                        }
                    }}
                    value={value}
                    onValueChanged={(value: number) => {
                        setValue(value);
                    }}
                />
            </div>
        </label>
    );
};



export const PresetApplyPage: React.FunctionComponent<{
    hass: any,
    categories: Array<Category>,
    presets: Array<Preset>,
}> = ({
    hass,
    categories,
    presets
}): React.JSX.Element => {
    const [targets, setTargets] = useLocalStorage<HaTargetSelectorValue>("scene_presets_apply_page_targets", {});

    const [shuffle, setShuffle] = useLocalStorage<boolean>("scene_presets_apply_page_shuffle", DEFAULT_TUNABLE_SETTINGS.shuffle);
    const [smartShuffle, setSmartShuffle] = useLocalStorage<boolean>("scene_presets_apply_page_smart_shuffle", DEFAULT_TUNABLE_SETTINGS.smartShuffle);
    const [customBrightness, setCustomBrightness] = useLocalStorage<boolean>("scene_presets_apply_page_custom_brightness", DEFAULT_TUNABLE_SETTINGS.customBrightness);
    const [customBrightnessValue, setCustomBrightnessValue] = useLocalStorage<number>("scene_presets_apply_page_custom_brightness_value", DEFAULT_TUNABLE_SETTINGS.customBrightnessValue);
    const [customTransition, setCustomTransition] = useLocalStorage<boolean>("scene_presets_apply_page_custom_transition", DEFAULT_TUNABLE_SETTINGS.customTransition);
    const [customTransitionValue, setCustomTransitionValue] = useLocalStorage<number>("scene_presets_apply_page_custom_transition_value", DEFAULT_TUNABLE_SETTINGS.customTransitionValue);

    const [dynamic, setDynamic] = useLocalStorage<boolean>("scene_presets_apply_page_dynamic", DEFAULT_TUNABLE_SETTINGS.dynamic);
    const [dynamicTransitionValue, setDynamicTransitionValue] = useLocalStorage<number>("scene_presets_apply_page_dynamic_transition_value", DEFAULT_TUNABLE_SETTINGS.dynamicTransitionValue);
    const [dynamicIntervalValue, setDynamicIntervalValue] = useLocalStorage<number>("scene_presets_apply_page_dynamic_interval_value", DEFAULT_TUNABLE_SETTINGS.dynamicIntervalValue);
    const [dynamicPerLight, setDynamicPerLight] = useLocalStorage<boolean>("scene_presets_apply_page_dynamic_per_light", DEFAULT_TUNABLE_SETTINGS.dynamicPerLight);
    const [dynamicIntervalMin, setDynamicIntervalMin] = useLocalStorage<number>("scene_presets_apply_page_dynamic_interval_min", DEFAULT_TUNABLE_SETTINGS.dynamicIntervalMin);
    const [dynamicIntervalMax, setDynamicIntervalMax] = useLocalStorage<number>("scene_presets_apply_page_dynamic_interval_max", DEFAULT_TUNABLE_SETTINGS.dynamicIntervalMax);
    const [dynamicTransitionMin, setDynamicTransitionMin] = useLocalStorage<number>("scene_presets_apply_page_dynamic_transition_min", DEFAULT_TUNABLE_SETTINGS.dynamicTransitionMin);
    const [dynamicTransitionMax, setDynamicTransitionMax] = useLocalStorage<number>("scene_presets_apply_page_dynamic_transition_max", DEFAULT_TUNABLE_SETTINGS.dynamicTransitionMax);

    const [lastDynamicSceneRefresh, setLastDynamicSceneRefresh] = useState(0);

    const [dynamicSceneIds, setDynamicSceneIds] = useState<Array<string>>([]); // Does this make sense or is this a useless attempt at optimization?
    const [dynamicScenes, setDynamicScenes] = useState<any>({});
    const memoizedDynamicSceneIds = useMemo(() => dynamicSceneIds, [dynamicSceneIds]); // Does this make sense or is this a useless attempt at optimization?


    const [favoritePresets, setFavoritePresets] = useLocalStorage<Array<string>>("scene_presets_apply_page_favorite_presets", []);

    const [automationDialogOpen, setAutomationDialogOpen] = useState<boolean>(false);

    const [savedScenes, setSavedScenes] = useState<Array<any>>([]);
    const [saveDialogOpen, setSaveDialogOpen] = useState<boolean>(false);
    const [saveSceneName, setSaveSceneName] = useState<string>("");
    const [saveSceneError, setSaveSceneError] = useState<string>("");
    const [savePresetId, setSavePresetId] = useState<string>("");
    const [editingScene, setEditingScene] = useState<any>(null);
    const [lightBrightness, setLightBrightness] = useState<{[entityId: string]: number}>({});
    const [sceneLights, setSceneLights] = useState<Array<{entity_id: string, name: string, optional: boolean}>>([]);
    const [lastActionPayload, setLastActionPayload] = useState<any>({});
    const [prettyLastActionPayload, setPrettyLastActionPayload] = useState<string>("");

    const fetchActiveDynamicScenes = React.useCallback(() => {
        hass.callWS({
            type: "scene_presets/get_dynamic_scenes",
        }).then(result => {
            const ids: Array<string> = [];
            const scenes: any = {};

            result?.dynamic_scenes?.forEach(s => {
                ids.push(s.id);
                scenes[s.id] = {
                    preset_id: s.parameters.preset_id,
                    interval: s.interval,
                    transition: s.parameters.transition,
                    interval_range: s.parameters.interval_range,
                    transition_range: s.parameters.transition_range
                };
            });

            setDynamicScenes(scenes);
            setDynamicSceneIds(ids);
        }).catch(() => {
            /* intentional */
        }).finally(() => {
            setLastDynamicSceneRefresh(Date.now());
        });
    }, [
        hass,
        setLastDynamicSceneRefresh,

        setDynamicSceneIds
    ]);

    const buildAction = React.useCallback(
        (id: string): {service: string, payload: any} => {
            let payload: any = {
                preset_id: id,
                targets: targets,

                brightness: customBrightness ? customBrightnessValue : undefined,
            };
            let service: string;

            if (dynamic) {
                if (dynamicPerLight) {
                    payload = {
                        ...payload,
                        interval_min: Math.min(dynamicIntervalMin, dynamicIntervalMax),
                        interval_max: Math.max(dynamicIntervalMin, dynamicIntervalMax),
                        transition_min: Math.min(dynamicTransitionMin, dynamicTransitionMax),
                        transition_max: Math.max(dynamicTransitionMin, dynamicTransitionMax)
                    };
                } else {
                    payload = {
                        ...payload,
                        transition: dynamicTransitionValue,
                        interval: dynamicIntervalValue
                    };
                }

                service = "start_dynamic_scene";
            } else {
                payload = {
                    ...payload,
                    shuffle: shuffle,
                    smart_shuffle: smartShuffle,
                    transition: customTransition ? customTransitionValue : undefined,
                };

                service = "apply_preset";
            }

            return {service, payload};
        },
        [
            targets, shuffle, smartShuffle,
            customBrightness, customBrightnessValue,
            customTransition, customTransitionValue,

            dynamic, dynamicIntervalValue, dynamicTransitionValue,
            dynamicPerLight, dynamicIntervalMin, dynamicIntervalMax,
            dynamicTransitionMin, dynamicTransitionMax
        ]
    );

    const hasTargets = React.useMemo(() => {
        return Object.values(targets ?? {}).some((v: any) => Array.isArray(v) ? v.length > 0 : !!v);
    }, [targets]);

    const fetchSavedScenes = React.useCallback(() => {
        hass.callWS({
            type: "scene_presets/get_saved_scenes",
        }).then(result => {
            setSavedScenes(result?.saved_scenes ?? []);
        }).catch(() => {
            /* intentional */
        });
    }, [hass, setSavedScenes]);

    const handleSaveScene = React.useCallback((asNew = false) => {
        const name = saveSceneName.trim();
        if (!name || !savePresetId || !hasTargets) {
            return;
        }

        const {service, payload: actionPayload} = buildAction(savePresetId);
        const payload: any = {
            ...actionPayload,
            name: name,
            dynamic: service === "start_dynamic_scene"
        };
        if (editingScene) {
            if (!asNew) {
                payload.id = editingScene.id;
            }
            // Settings the panel does not show are kept as they are
            ["exclude", "keep_groups", "optional"].forEach(key => {
                if (editingScene[key] !== undefined) {
                    payload[key] = editingScene[key];
                }
            });
        }
        const perLight: {[entityId: string]: number} = {};
        Object.entries(lightBrightness).forEach(([entityId, value]) => {
            if (typeof value === "number" && value >= 1 && value <= 100) {
                perLight[entityId] = Math.round(value);
            }
        });
        if (Object.keys(perLight).length > 0) {
            payload.light_brightness = perLight;
        }
        Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

        hass.callService("scene_presets", "save_scene", payload).then(() => {
            setSaveDialogOpen(false);
            setSaveSceneName("");
            setSaveSceneError("");
            setEditingScene(null);
            setLightBrightness({});
            fetchSavedScenes();
        }).catch(err => {
            setSaveSceneError(err?.message ?? String(err));
        });
    }, [hass, saveSceneName, savePresetId, hasTargets, buildAction, fetchSavedScenes, editingScene, lightBrightness]);

    const handleSavedSceneEdit = React.useCallback((id: string) => {
        const scene = savedScenes.find(s => s.id === id);
        if (!scene) {
            return;
        }
        // Load the saved scene into the page: targets, tunables, preset, name, brightness per light
        setTargets(scene.targets ?? {});
        setCustomBrightness(scene.brightness !== undefined && scene.brightness !== null);
        if (scene.brightness !== undefined && scene.brightness !== null) {
            setCustomBrightnessValue(scene.brightness);
        }
        setDynamic(!!scene.dynamic);
        if (scene.dynamic) {
            const perLightTiming = ["interval_min", "interval_max", "transition_min", "transition_max"].some(k => scene[k] !== undefined);
            setDynamicPerLight(perLightTiming);
            if (perLightTiming) {
                setDynamicIntervalMin(scene.interval_min ?? DEFAULT_TUNABLE_SETTINGS.dynamicIntervalMin);
                setDynamicIntervalMax(scene.interval_max ?? DEFAULT_TUNABLE_SETTINGS.dynamicIntervalMax);
                setDynamicTransitionMin(scene.transition_min ?? DEFAULT_TUNABLE_SETTINGS.dynamicTransitionMin);
                setDynamicTransitionMax(scene.transition_max ?? DEFAULT_TUNABLE_SETTINGS.dynamicTransitionMax);
            } else {
                setDynamicIntervalValue(scene.interval ?? DEFAULT_TUNABLE_SETTINGS.dynamicIntervalValue);
                setDynamicTransitionValue(scene.transition ?? DEFAULT_TUNABLE_SETTINGS.dynamicTransitionValue);
            }
        } else {
            setShuffle(!!scene.shuffle);
            setSmartShuffle(!!scene.smart_shuffle);
            setCustomTransition(scene.transition !== undefined && scene.transition !== null);
            if (scene.transition !== undefined && scene.transition !== null) {
                setCustomTransitionValue(scene.transition);
            }
        }
        setSavePresetId(scene.preset_id);
        setSaveSceneName(scene.name);
        setLightBrightness(scene.light_brightness ?? {});
        setEditingScene(scene);
        setSaveSceneError("");
        setSaveDialogOpen(true);
    }, [
        savedScenes, setTargets, setCustomBrightness, setCustomBrightnessValue, setDynamic, setDynamicPerLight,
        setDynamicIntervalMin, setDynamicIntervalMax, setDynamicTransitionMin, setDynamicTransitionMax,
        setDynamicIntervalValue, setDynamicTransitionValue, setShuffle, setSmartShuffle,
        setCustomTransition, setCustomTransitionValue
    ]);

    const stopEditing = React.useCallback(() => {
        setEditingScene(null);
        setLightBrightness({});
        setSaveSceneName("");
    }, []);

    // Lights of the scene for "brightness per light" (resolved by the backend with the same rules)
    useEffect(() => {
        if (!saveDialogOpen || !hasTargets) {
            setSceneLights([]);
            return;
        }
        const msg: any = {type: "scene_presets/resolve_targets", targets: targets};
        ["exclude", "keep_groups", "optional"].forEach(key => {
            if (editingScene?.[key] !== undefined) {
                msg[key] = editingScene[key];
            }
        });
        hass.callWS(msg).then(result => {
            setSceneLights(result?.lights ?? []);
        }).catch(() => {
            setSceneLights([]);
        });
    }, [saveDialogOpen, targets, editingScene]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSavedSceneTap = React.useCallback((id: string) => {
        hass.callService(
            "scene_presets",
            "activate_saved_scene",
            {id: id}
        ).finally(() => {
            fetchActiveDynamicScenes();
        });
    }, [hass, fetchActiveDynamicScenes]);

    const handleSavedSceneDelete = React.useCallback((id: string) => {
        const scene = savedScenes.find(s => s.id === id);
        if (!window.confirm(`Delete saved scene "${scene?.name ?? id}"?`)) {
            return;
        }

        hass.callService(
            "scene_presets",
            "delete_saved_scene",
            {id: id}
        ).finally(() => {
            if (editingScene?.id === id) {
                setEditingScene(null);
                setLightBrightness({});
                setSaveDialogOpen(false);
            }
            fetchSavedScenes();
        });
    }, [hass, savedScenes, fetchSavedScenes, editingScene]);

    useEffect(() => {
        fetchSavedScenes();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handlePresetTap = React.useCallback(
        (id) => {
            const {service, payload} = buildAction(id);

            setLastActionPayload({
                service: `scene_presets.${service}`,
                data: payload
            });

            hass.callService(
                "scene_presets",
                service,
                payload
            ).finally(() => {
                fetchActiveDynamicScenes();
            });
        },
        [
            hass, setLastActionPayload, buildAction,
            fetchActiveDynamicScenes
        ]
    );

    const handleDynamicSceneTap = React.useCallback(
        (id: string) => {
            hass.callService(
                "scene_presets",
                "stop_dynamic_scene",
                {id: id}
            ).finally(() => {
                fetchActiveDynamicScenes();
            });
        },
        [
            hass, fetchActiveDynamicScenes
        ]
    );

    const presetsByCategories = React.useMemo(() => {
        const out = {};

        categories.forEach(category => {
            out[category.id] = presets.filter(p => p.categoryId === category.id);
        });

        return out;
    }, [categories, presets]);


    const tiles = React.useMemo(() => {
        const allTiles: {[key: string] : React.JSX.Element} = {};
        const favoriteTiles: Array<string> = [];

        presets.forEach((preset, i) => {
            const isFav = favoritePresets.includes(preset.id);

            allTiles[preset.id] = <PresetTile
                id={preset.id}
                name={preset.name}
                imgSrc={preset.img ? "/assets/scene_presets/" + preset.img : undefined}
                onClick={(id) => {
                    handlePresetTap(id);
                }}
                isFav={isFav}
                onFavClick={() => {
                    if (!favoritePresets.includes(preset.id)) {
                        setFavoritePresets([...favoritePresets, preset.id]);
                    } else {
                        setFavoritePresets(favoritePresets.filter(e => e !== preset.id));
                    }
                }}
            />;

            if (isFav) {
                favoriteTiles.push(preset.id);
            }
        });

        return {
            all: allTiles,
            favoriteIds: favoriteTiles,
        };
    }, [presets, favoritePresets, handlePresetTap, setFavoritePresets]);

    const presetMap = useMemo(() => {
        const _presetMap = {};

        presets.forEach(p => {
            _presetMap[p.id] = p;
        });

        return _presetMap;
    }, [presets]);

    /**
     * This is a hack that works around the fact that for whatever reason, componentWillUnmount never fires.
     * Possibly because using react in this setup is cursed
     */
    useEffect(() => {
        if (Date.now() - lastDynamicSceneRefresh >= DYNAMIC_SCENE_REFRESH_INTERVAL) {
            fetchActiveDynamicScenes();
        }
    }, [hass, fetchActiveDynamicScenes]); // eslint-disable-line react-hooks/exhaustive-deps 

    return (
        <div
            style={{
                padding: "1rem",
                userSelect: "none"
            }}
        >
            <div
                style={{
                    maxWidth: "1080px", //same as hass
                    marginLeft: "auto",
                    marginRight: "auto"
                }}
            >
                <ha-card>
                    <div
                        style={{
                            padding: "1rem"
                        }}
                    >
                        <span style={{
                            fontWeight: "bolder",
                            fontSize: "1.25rem"
                        }}>
                            <div style={{display: "flex"}}>
                                Targets
                                <div
                                    style={{
                                        marginTop: "-0.4rem",
                                        marginLeft: "0.5rem"
                                    }}>
                                    <HaIconButton
                                        icon={"mdi:broom"}
                                        onClick={() => setTargets({})}

                                        size={28}
                                        iconSize={24}
                                    />
                                </div>
                                <div
                                    style={{
                                        position: "absolute",
                                        top: "0.5rem",
                                        right: "1rem"
                                    }}>
                                    <HaIconButton
                                        icon={"mdi:content-save"}
                                        onClick={
                                            () => {
                                                if (!editingScene) {
                                                    setSavePresetId(lastActionPayload?.data?.preset_id ?? favoritePresets[0] ?? presets[0]?.id ?? "");
                                                }
                                                setSaveSceneError("");
                                                setSaveDialogOpen(true);
                                            }
                                        }
                                        size={28}
                                        iconSize={24}
                                    />
                                    <HaIconButton
                                        icon={"mdi:robot"}
                                        onClick={
                                            () => {
                                                setPrettyLastActionPayload(JSON.stringify(lastActionPayload, null, 2));
                                                setAutomationDialogOpen(true);
                                            }
                                        }
                                        size={28}
                                        iconSize={24}
                                    />
                                </div>
                            </div>
                        </span>
                        {
                            editingScene &&
                            <div
                                className={"editing-scene-banner"}
                                style={{
                                    marginTop: "1rem",
                                    padding: "0.5rem 0.75rem",
                                    borderRadius: "8px",
                                    background: "rgba(var(--rgb-primary-color, 3, 169, 244), 0.12)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: "0.5rem"
                                }}
                            >
                                <span>
                                    Editing <b>{editingScene.name}</b>: change targets and tunables, then click the save icon.
                                </span>
                                <button
                                    className={"editing-scene-stop"}
                                    style={DIALOG_BUTTON_STYLE}
                                    onClick={() => stopEditing()}
                                >
                                    Stop editing
                                </button>
                            </div>
                        }
                        <div
                            style={{
                                marginTop: "1rem"
                            }}
                        >
                            <HaTargetSelector
                                hass={hass}
                                selector={{
                                    "target": {
                                        "entity": {
                                            "domain": [
                                                "light",
                                                "group"
                                            ]
                                        }
                                    }
                                }}
                                value={targets}
                                onValueChanged={(value) => {
                                    setTargets(value);
                                }}
                            />
                        </div>
                        <div
                            style={{
                                fontWeight: "bolder",
                                marginTop: "1rem",
                                marginBottom: "1rem",
                                fontSize: "1.25rem"
                            }}
                        >
                            <div style={{display: "flex"}}>
                                Tunables
                                <div
                                    style={{
                                        marginTop: "-0.4rem",
                                        marginLeft: "0.5rem"
                                    }}>
                                    <HaIconButton
                                        icon={"mdi:restore"}
                                        onClick={() => {
                                            setShuffle(DEFAULT_TUNABLE_SETTINGS.shuffle);
                                            setSmartShuffle(DEFAULT_TUNABLE_SETTINGS.smartShuffle);
                                            setCustomBrightness(DEFAULT_TUNABLE_SETTINGS.customBrightness);
                                            setCustomBrightnessValue(DEFAULT_TUNABLE_SETTINGS.customBrightnessValue);
                                            setCustomTransition(DEFAULT_TUNABLE_SETTINGS.customTransition);
                                            setCustomTransitionValue(DEFAULT_TUNABLE_SETTINGS.customTransitionValue);

                                            setDynamic(DEFAULT_TUNABLE_SETTINGS.dynamic);
                                            setDynamicTransitionValue(DEFAULT_TUNABLE_SETTINGS.dynamicTransitionValue);
                                            setDynamicIntervalValue(DEFAULT_TUNABLE_SETTINGS.dynamicIntervalValue);
                                            setDynamicPerLight(DEFAULT_TUNABLE_SETTINGS.dynamicPerLight);
                                            setDynamicIntervalMin(DEFAULT_TUNABLE_SETTINGS.dynamicIntervalMin);
                                            setDynamicIntervalMax(DEFAULT_TUNABLE_SETTINGS.dynamicIntervalMax);
                                            setDynamicTransitionMin(DEFAULT_TUNABLE_SETTINGS.dynamicTransitionMin);
                                            setDynamicTransitionMax(DEFAULT_TUNABLE_SETTINGS.dynamicTransitionMax);
                                        }}

                                        size={28}
                                        iconSize={24}
                                    />
                                </div>
                            </div>
                        </div>
                        <label
                            style={{
                                lineHeight: "3rem"
                            }}
                        >
                            <Switch
                                label={"Dynamic"}
                                value={dynamic}
                                setValue={(v) => setDynamic(v)}
                            />
                        </label>
                        <br/>
                        {
                            !dynamic &&
                            <>
                                <Switch
                                    label={"Shuffle Colors"}
                                    value={shuffle}
                                    setValue={(v) => setShuffle(v)}
                                />
                                <br/>

                                {
                                    shuffle &&
                                    <>
                                        <div
                                            style={{marginLeft: "1rem"}}
                                        >
                                            <Switch
                                                label={"Smart Shuffle"}
                                                value={smartShuffle}
                                                setValue={(v) => setSmartShuffle(v)}
                                            />
                                        </div>
                                    </>
                                }
                            </>
                        }
                        {
                            dynamic &&
                            <>
                                <Switch
                                    label={"Per-light timing"}
                                    value={dynamicPerLight}
                                    setValue={(v) => setDynamicPerLight(v)}
                                />
                                <br/>
                            </>
                        }
                        {
                            dynamic && dynamicPerLight &&
                            <>
                                <NumberSelector
                                    label={"Interval min"}
                                    value={dynamicIntervalMin}
                                    setValue={(v) => setDynamicIntervalMin(v)}
                                    minValue={1}
                                    maxValue={600}
                                    hass={hass}
                                    extraSelectorProps={{"unit_of_measurement": "seconds"}}
                                />
                                <NumberSelector
                                    label={"Interval max"}
                                    value={dynamicIntervalMax}
                                    setValue={(v) => setDynamicIntervalMax(v)}
                                    minValue={1}
                                    maxValue={600}
                                    hass={hass}
                                    extraSelectorProps={{"unit_of_measurement": "seconds"}}
                                />
                                <NumberSelector
                                    label={"Transition min"}
                                    value={dynamicTransitionMin}
                                    setValue={(v) => setDynamicTransitionMin(v)}
                                    minValue={0}
                                    maxValue={300}
                                    hass={hass}
                                    extraSelectorProps={{"unit_of_measurement": "seconds"}}
                                />
                                <NumberSelector
                                    label={"Transition max"}
                                    value={dynamicTransitionMax}
                                    setValue={(v) => setDynamicTransitionMax(v)}
                                    minValue={0}
                                    maxValue={300}
                                    hass={hass}
                                    extraSelectorProps={{"unit_of_measurement": "seconds"}}
                                />
                            </>
                        }
                        {
                            dynamic && !dynamicPerLight &&
                            <>
                                <NumberSelector
                                    label={"Interval"}
                                    value={dynamicIntervalValue}
                                    setValue={(v) => setDynamicIntervalValue(v)}
                                    minValue={0}
                                    maxValue={300}
                                    hass={hass}
                                    extraSelectorProps={{"unit_of_measurement": "seconds"}}
                                />

                                <NumberSelector
                                    label={"Transition"}
                                    value={dynamicTransitionValue}
                                    setValue={(v) => setDynamicTransitionValue(v)}
                                    minValue={0}
                                    maxValue={300}
                                    hass={hass}
                                    extraSelectorProps={{"unit_of_measurement": "seconds"}}
                                />
                            </>
                        }



                        <OptionalNumberSelector
                            label={"Custom Brightness"}
                            enabled={customBrightness}
                            setEnabled={(v) => setCustomBrightness(v)}
                            value={customBrightnessValue}
                            setValue={(v) => setCustomBrightnessValue(v)}
                            minValue={0}
                            maxValue={255}
                            hass={hass}
                        />
                        {
                            !customBrightness && !dynamic &&
                            <br/>
                        }

                        {
                            !dynamic &&
                            <OptionalNumberSelector
                                label={"Custom Transition"}
                                enabled={customTransition}
                                setEnabled={(v) => setCustomTransition(v)}
                                value={customTransitionValue}
                                setValue={(v) => setCustomTransitionValue(v)}
                                minValue={0}
                                maxValue={300}
                                hass={hass}
                                extraSelectorProps={{"unit_of_measurement": "seconds"}}
                            />
                        }
                    </div>
                </ha-card>

                {
                    savedScenes.length > 0 &&
                    <div
                        key={"category_saved_scenes"}
                    >
                        <h3
                            style={{
                                fontFamily: "sans-serif"
                            }}
                        >
                            My scenes
                        </h3>
                        <div
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                justifyContent: "center"
                            }}
                        >
                            {
                                savedScenes.map(scene => {
                                    const preset = presetMap[scene.preset_id];
                                    const imgSrc = preset?.img ? "/assets/scene_presets/" + preset.img : undefined;

                                    return <PresetTile
                                        key={"saved_scene_" + scene.id}
                                        id={scene.id}
                                        name={scene.dynamic ? `${scene.name} (dynamic)` : scene.name}
                                        imgSrc={imgSrc}
                                        onClick={(id) => {
                                            handleSavedSceneTap(id);
                                        }}
                                        actionIcon={"mdi:pencil"}
                                        onActionClick={(id) => {
                                            handleSavedSceneEdit(id);
                                        }}
                                    />;
                                })
                            }
                        </div>
                    </div>
                }

                {
                    memoizedDynamicSceneIds.length > 0 &&
                    <div
                        key={"category_dynamic_scenes"}
                    >
                        <h3
                            style={{
                                fontFamily: "sans-serif"
                            }}
                        >
                            Dynamic scenes
                        </h3>
                        <div
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                justifyContent: "center"
                            }}
                        >
                            {
                                memoizedDynamicSceneIds.map(id => {
                                    const preset = presetMap[dynamicScenes[id]?.preset_id];

                                    const name = preset?.name ?? "Unknown Preset";
                                    const imgSrc = preset?.img ? "/assets/scene_presets/" + preset.img : undefined;

                                    return <DynamicSceneTile
                                        key={"active_dynamic_scene_" + id}
                                        id={id}
                                        name={name}
                                        interval={dynamicScenes[id]?.interval ?? -1}
                                        transition={dynamicScenes[id]?.transition ?? -1}
                                        intervalRange={dynamicScenes[id]?.interval_range}
                                        transitionRange={dynamicScenes[id]?.transition_range}
                                        imgSrc={imgSrc}
                                        onClick={(id) => {
                                            handleDynamicSceneTap(id);
                                        }}
                                    />;
                                })
                            }
                        </div>
                    </div>
                }

                {
                    tiles.favoriteIds.length > 0 &&
                    <div
                        key={"category_favorites"}
                    >
                        <h3
                            style={{
                                fontFamily: "sans-serif"
                            }}
                        >
                            Favorites
                        </h3>
                        <div
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                justifyContent: "center"
                            }}
                        >
                            {
                                tiles.favoriteIds.map(id => {
                                    return <React.Fragment key={"favorite_" + id}>
                                        {tiles.all[id]}
                                    </React.Fragment>;
                                })
                            }
                        </div>
                    </div>

                }

                {
                    categories.map(({name, id}) => {
                        return (
                            <div
                                key={"category_" + name}
                            >
                                <h3
                                    style={{
                                        fontFamily: "sans-serif"
                                    }}
                                >
                                    {name}
                                </h3>
                                <div
                                    style={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        justifyContent: "center"
                                    }}
                                >
                                    {presetsByCategories[id].map(p => {
                                        return <React.Fragment key={id + "_" + p.id}>
                                            {tiles.all[p.id]}
                                        </React.Fragment>;
                                    })}
                                </div>
                            </div>
                        );
                    })
                }

                <HaDialog
                    open={saveDialogOpen}
                    onClose={() => {
                        setSaveDialogOpen(false);
                    }}
                    heading={editingScene ? `Edit scene "${editingScene.name}"` : "Save scene"}
                >
                    <div>
                        Saves the selected preset together with the current targets and tunables
                        {dynamic ? (dynamicPerLight ? " (dynamic, per-light timing)" : " (dynamic)") : ""}.
                        The saved scene shows up under &quot;My scenes&quot; and as a scene entity in Home Assistant.
                        {
                            editingScene &&
                            <> The page now shows the targets and tunables of this scene: close this dialog to change
                                them, then click the save icon again.</>
                        }
                    </div>
                    {
                        editingScene && ["exclude", "keep_groups", "optional"].some(k => editingScene[k]?.length) &&
                        <div style={{marginTop: "0.5rem", fontSize: "0.9rem", opacity: 0.8}}>
                            {editingScene.exclude?.length ? <div>Excluded: {editingScene.exclude.join(", ")}</div> : null}
                            {editingScene.keep_groups?.length ? <div>As one light: {editingScene.keep_groups.join(", ")}</div> : null}
                            {editingScene.optional?.length ? <div>Only if on: {editingScene.optional.join(", ")}</div> : null}
                        </div>
                    }
                    <div style={{marginTop: "1rem"}}>
                        <select
                            className={"save-scene-preset"}
                            value={savePresetId}
                            onChange={(e) => setSavePresetId(e.target.value)}
                            style={DIALOG_INPUT_STYLE}
                        >
                            {
                                categories.map(category => {
                                    return <optgroup key={"save_cat_" + category.id} label={category.name}>
                                        {
                                            (presetsByCategories[category.id] ?? []).map(p => {
                                                return <option key={"save_opt_" + p.id} value={p.id}>{p.name}</option>;
                                            })
                                        }
                                    </optgroup>;
                                })
                            }
                        </select>
                    </div>
                    {
                        !hasTargets &&
                        <div style={{marginTop: "0.5rem", color: "var(--error-color, #db4437)"}}>
                            Select at least one target first.
                        </div>
                    }
                    <div style={{marginTop: "1rem"}}>
                        <input
                            className={"save-scene-name"}
                            type={"text"}
                            placeholder={"Name"}
                            value={saveSceneName}
                            onChange={(e) => setSaveSceneName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleSaveScene(false);
                                }
                            }}
                            style={DIALOG_INPUT_STYLE}
                        />
                    </div>
                    {
                        sceneLights.length > 0 &&
                        <div className={"save-scene-light-brightness"} style={{marginTop: "1rem"}}>
                            <div style={{fontWeight: 500, marginBottom: "0.25rem"}}>Brightness per light</div>
                            <div style={{fontSize: "0.85rem", opacity: 0.8, marginBottom: "0.5rem"}}>
                                Optional, in percent. Empty = scene brightness
                                {customBrightness ? ` (${Math.round(customBrightnessValue * 100 / 255)} %)` : ""}.
                            </div>
                            <div style={{maxHeight: "40vh", overflowY: "auto"}}>
                                {
                                    sceneLights.map(light => {
                                        const value = lightBrightness[light.entity_id];
                                        return <div
                                            key={"lb_" + light.entity_id}
                                            style={{display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.2rem 0"}}
                                        >
                                            <span style={{flex: 1}}>
                                                {light.name}{light.optional ? " (only if on)" : ""}
                                            </span>
                                            <input
                                                type={"number"}
                                                min={1}
                                                max={100}
                                                placeholder={"–"}
                                                value={value === undefined ? "" : value}
                                                onChange={(e) => {
                                                    const raw = e.target.value;
                                                    const next = {...lightBrightness};
                                                    if (raw === "") {
                                                        delete next[light.entity_id];
                                                    } else {
                                                        next[light.entity_id] = Math.max(1, Math.min(100, Number(raw)));
                                                    }
                                                    setLightBrightness(next);
                                                }}
                                                style={{...DIALOG_INPUT_STYLE, width: "5.5rem", padding: "0.4rem"}}
                                            />
                                            <span>%</span>
                                        </div>;
                                    })
                                }
                            </div>
                        </div>
                    }
                    {
                        saveSceneError &&
                        <div style={{marginTop: "0.5rem", color: "var(--error-color, #db4437)"}}>
                            {saveSceneError}
                        </div>
                    }
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: "0.5rem",
                            marginTop: "1.5rem"
                        }}
                    >
                        {
                            editingScene &&
                            <button
                                className={"save-scene-delete"}
                                style={{...DIALOG_BUTTON_STYLE, color: "var(--error-color, #db4437)", marginRight: "auto"}}
                                onClick={() => {
                                    handleSavedSceneDelete(editingScene.id);
                                }}
                            >
                                Delete
                            </button>
                        }
                        <button
                            className={"save-scene-cancel"}
                            style={DIALOG_BUTTON_STYLE}
                            onClick={() => {
                                setSaveDialogOpen(false);
                            }}
                        >
                            {editingScene ? "Close" : "Cancel"}
                        </button>
                        {
                            editingScene &&
                            <button
                                className={"save-scene-as-new"}
                                disabled={!saveSceneName.trim() || !savePresetId || !hasTargets}
                                style={DIALOG_BUTTON_STYLE}
                                onClick={() => {
                                    handleSaveScene(true);
                                }}
                            >
                                Save as new
                            </button>
                        }
                        <button
                            className={"save-scene-confirm"}
                            disabled={!saveSceneName.trim() || !savePresetId || !hasTargets}
                            style={{
                                ...DIALOG_BUTTON_STYLE,
                                background: "var(--primary-color, #03a9f4)",
                                color: "var(--text-primary-color, #fff)",
                                opacity: (!saveSceneName.trim() || !savePresetId || !hasTargets) ? 0.5 : 1
                            }}
                            onClick={() => {
                                handleSaveScene(false);
                            }}
                        >
                            Save
                        </button>
                    </div>
                </HaDialog>

                <HaDialog
                    open={automationDialogOpen}
                    onClose={() => {
                        setAutomationDialogOpen(false);
                    }}
                    heading={"Last action payload"}
                >
                    <div>
                        Here you can see the payload used by your last action that applied a preset or started a dynamic scene.
                        This can be used in automations, scripts etc.
                    </div>

                    <div style={{padding: "1rem"}}>
                        <pre
                            style={{
                                backgroundColor: "#000000",
                                padding: "1rem",
                                userSelect: "text",
                                color: "#ffffff",
                                fontFamily: "monospace",
                                fontWeight: 200,
                                whiteSpace: "pre-wrap"
                            }}
                        >
                            {prettyLastActionPayload}
                        </pre>
                    </div>

                    <MwcButton
                        label={"Close"}
                        onClick={() => {
                            setAutomationDialogOpen(false);
                        }}
                        slot={"secondaryAction"}
                    />
                </HaDialog>
            </div>

        </div>
    );
};
