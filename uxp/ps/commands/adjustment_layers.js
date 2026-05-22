/* MIT License
 *
 * Copyright (c) 2025 Mike Chambers
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const { action } = require("photoshop");

const {
    selectLayer,
    findLayer,
    execute
} = require("./utils")

const addAdjustmentLayerBlackAndWhite = async (command) => {

    let options = command.options;
    let layerId = options.layerId;

    let layer = findLayer(layerId);

    if (!layer) {
        throw new Error(
            `addAdjustmentLayerBlackAndWhite : Could not find layerId : ${layerId}`
        );
    }

    let colors = options.colors;
    let tintColor = options.tintColor

    await execute(async () => {
        selectLayer(layer, true);

        let commands = [
            // Make adjustment layer
            {
                _obj: "make",
                _target: [
                    {
                        _ref: "adjustmentLayer",
                    },
                ],
                using: {
                    _obj: "adjustmentLayer",
                    type: {
                        _obj: "blackAndWhite",
                        blue: colors.blue,
                        cyan: colors.cyan,
                        grain: colors.green,
                        magenta: colors.magenta,
                        presetKind: {
                            _enum: "presetKindType",
                            _value: "presetKindDefault",
                        },
                        red: colors.red,
                        tintColor: {
                            _obj: "RGBColor",
                            blue: tintColor.blue,
                            grain: tintColor.green,
                            red: tintColor.red,
                        },
                        useTint: options.tint,
                        yellow: colors.yellow,
                    },
                },
            },
        ];

        await action.batchPlay(commands, {});
    });
};

const addBrightnessContrastAdjustmentLayer = async (command) => {

    let options = command.options;
    let layerId = options.layerId;

    let layer = findLayer(layerId);

    if (!layer) {
        throw new Error(
            `addBrightnessContrastAdjustmentLayer : Could not find layerId : ${layerId}`
        );
    }

    await execute(async () => {
        selectLayer(layer, true);

        let commands = [
            // Make adjustment layer
            {
                _obj: "make",
                _target: [
                    {
                        _ref: "adjustmentLayer",
                    },
                ],
                using: {
                    _obj: "adjustmentLayer",
                    type: {
                        _obj: "brightnessEvent",
                        useLegacy: false,
                    },
                },
            },
            // Set current adjustment layer
            {
                _obj: "set",
                _target: [
                    {
                        _enum: "ordinal",
                        _ref: "adjustmentLayer",
                        _value: "targetEnum",
                    },
                ],
                to: {
                    _obj: "brightnessEvent",
                    brightness: options.brightness,
                    center: options.contrast,
                    useLegacy: false,
                },
            },
        ];

        await action.batchPlay(commands, {});
    });
};

const addAdjustmentLayerVibrance = async (command) => {

    let options = command.options;
    let layerId = options.layerId;

    let layer = findLayer(layerId);

    if (!layer) {
        throw new Error(
            `addAdjustmentLayerVibrance : Could not find layerId : ${layerId}`
        );
    }

    let colors = options.colors;

    await execute(async () => {
        selectLayer(layer, true);

        let commands = [
            // Make adjustment layer
            {
                _obj: "make",
                _target: [
                    {
                        _ref: "adjustmentLayer",
                    },
                ],
                using: {
                    _obj: "adjustmentLayer",
                    type: {
                        _class: "vibrance",
                    },
                },
            },
            // Set current adjustment layer
            {
                _obj: "set",
                _target: [
                    {
                        _enum: "ordinal",
                        _ref: "adjustmentLayer",
                        _value: "targetEnum",
                    },
                ],
                to: {
                    _obj: "vibrance",
                    saturation: options.saturation,
                    vibrance: options.vibrance,
                },
            },
        ];

        await action.batchPlay(commands, {});
    });
};

const addColorBalanceAdjustmentLayer = async (command) => {

    let options = command.options;

    let layerId = options.layerId;
    let layer = findLayer(layerId);

    if (!layer) {
        throw new Error(
            `addColorBalanceAdjustmentLayer : Could not find layer named : [${layerId}]`
        );
    }

    await execute(async () => {
        let commands = [
            // Make adjustment layer
            {
                _obj: "make",
                _target: [
                    {
                        _ref: "adjustmentLayer",
                    },
                ],
                using: {
                    _obj: "adjustmentLayer",
                    type: {
                        _obj: "colorBalance",
                        highlightLevels: [0, 0, 0],
                        midtoneLevels: [0, 0, 0],
                        preserveLuminosity: true,
                        shadowLevels: [0, 0, 0],
                    },
                },
            },
            // Set current adjustment layer
            {
                _obj: "set",
                _target: [
                    {
                        _enum: "ordinal",
                        _ref: "adjustmentLayer",
                        _value: "targetEnum",
                    },
                ],
                to: {
                    _obj: "colorBalance",
                    highlightLevels: options.highlights,
                    midtoneLevels: options.midtones,
                    shadowLevels: options.shadows,
                },
            },
        ];
        await action.batchPlay(commands, {});
    });
};

const addSolidColorFillLayer = async (command) => {
    let options = command.options;
    let layerId = options.layerId;
    let color = options.color;  // { red, green, blue }

    let layer = findLayer(layerId);

    if (!layer) {
        throw new Error(
            `addSolidColorFillLayer : Could not find layerId : ${layerId}`
        );
    }

    await execute(async () => {
        selectLayer(layer, true);

        let commands = [
            {
                _obj: "make",
                _target: [{ _ref: "contentLayer" }],
                using: {
                    _obj: "contentLayer",
                    type: {
                        _obj: "solidColorLayer",
                        color: {
                            _obj: "RGBColor",
                            red: color.red,
                            grain: color.green,
                            blue: color.blue,
                        },
                    },
                },
            },
        ];

        await action.batchPlay(commands, {});
    });
};

const addSelectiveColorAdjustmentLayer = async (command) => {
    let options = command.options;
    let layerId = options.layerId;
    let corrections = options.corrections || {};
    let method = (options.method || "relative").toLowerCase();

    let layer = findLayer(layerId);

    if (!layer) {
        throw new Error(
            `addSelectiveColorAdjustmentLayer : Could not find layerId : ${layerId}`
        );
    }

    // Map color-bucket names to the descriptor `_enum: colors` value
    // Photoshop expects.
    const COLOR_ENUM = {
        reds: "red",
        yellows: "yellow",
        greens: "green",
        cyans: "cyan",
        blues: "blue",
        magentas: "magenta",
        whites: "white",
        neutrals: "neutrals",
        blacks: "black",
    };

    let colorCorrection = [];
    for (let bucket of Object.keys(corrections)) {
        let enumValue = COLOR_ENUM[bucket];
        if (!enumValue) {
            throw new Error(
                `addSelectiveColorAdjustmentLayer : unknown color bucket "${bucket}" — ` +
                `use reds | yellows | greens | cyans | blues | magentas | whites | neutrals | blacks`
            );
        }
        let v = corrections[bucket];
        colorCorrection.push({
            _obj: "colorCorrection",
            colors: { _enum: "colors", _value: enumValue },
            cyan: typeof v.cyan === "number" ? v.cyan : 0,
            magenta: typeof v.magenta === "number" ? v.magenta : 0,
            yellow: typeof v.yellow === "number" ? v.yellow : 0,
            black: typeof v.black === "number" ? v.black : 0,
        });
    }

    await execute(async () => {
        selectLayer(layer, true);

        let commands = [
            {
                _obj: "make",
                _target: [{ _ref: "adjustmentLayer" }],
                using: {
                    _obj: "adjustmentLayer",
                    type: {
                        _obj: "selectiveColor",
                        method: { _enum: "correctionMethod", _value: method },
                        colorCorrection: colorCorrection,
                    },
                },
            },
        ];

        await action.batchPlay(commands, {});
    });
};

const addCurvesAdjustmentLayer = async (command) => {
    let options = command.options;
    let layerId = options.layerId;
    let layer = findLayer(layerId);
    if (!layer) {
        throw new Error(`addCurvesAdjustmentLayer : Could not find layerId : ${layerId}`);
    }

    // Curves descriptor: adjustment[] of per-channel curves. Each curve
    // is an array of {horizontal, vertical} control points in 0-255 space.
    let channel = options.channel || "composite";
    let curvePoints = options.curvePoints || [
        { horizontal: 0, vertical: 0 },
        { horizontal: 255, vertical: 255 },
    ];

    await execute(async () => {
        selectLayer(layer, true);
        let commands = [
            {
                _obj: "make",
                _target: [{ _ref: "adjustmentLayer" }],
                using: { _obj: "adjustmentLayer", type: { _obj: "curves" } },
            },
            {
                _obj: "set",
                _target: [
                    { _enum: "ordinal", _ref: "adjustmentLayer", _value: "targetEnum" },
                ],
                to: {
                    _obj: "curves",
                    adjustment: [
                        {
                            _obj: "curvesAdjustment",
                            channel: { _enum: "channel", _ref: "channel", _value: channel },
                            curve: curvePoints.map((p) => ({
                                _obj: "paint",
                                horizontal: p.horizontal,
                                vertical: p.vertical,
                            })),
                        },
                    ],
                },
            },
        ];
        await action.batchPlay(commands, {});
    });
};

const addLevelsAdjustmentLayer = async (command) => {
    let options = command.options;
    let layerId = options.layerId;
    let layer = findLayer(layerId);
    if (!layer) {
        throw new Error(`addLevelsAdjustmentLayer : Could not find layerId : ${layerId}`);
    }

    let channel = options.channel || "composite";
    let inputLow = typeof options.inputLow === "number" ? options.inputLow : 0;
    let gamma = typeof options.gamma === "number" ? options.gamma : 1.0;
    let inputHigh = typeof options.inputHigh === "number" ? options.inputHigh : 255;
    let outputLow = typeof options.outputLow === "number" ? options.outputLow : 0;
    let outputHigh = typeof options.outputHigh === "number" ? options.outputHigh : 255;

    await execute(async () => {
        selectLayer(layer, true);
        let commands = [
            {
                _obj: "make",
                _target: [{ _ref: "adjustmentLayer" }],
                using: { _obj: "adjustmentLayer", type: { _obj: "levels" } },
            },
            {
                _obj: "set",
                _target: [
                    { _enum: "ordinal", _ref: "adjustmentLayer", _value: "targetEnum" },
                ],
                to: {
                    _obj: "levels",
                    adjustment: [
                        {
                            _obj: "levelsAdjustment",
                            channel: { _enum: "channel", _ref: "channel", _value: channel },
                            gamma: gamma,
                            input: [inputLow, inputHigh],
                            output: [outputLow, outputHigh],
                        },
                    ],
                },
            },
        ];
        await action.batchPlay(commands, {});
    });
};

const addHueSaturationAdjustmentLayer = async (command) => {
    let options = command.options;
    let layerId = options.layerId;
    let layer = findLayer(layerId);
    if (!layer) {
        throw new Error(
            `addHueSaturationAdjustmentLayer : Could not find layerId : ${layerId}`
        );
    }

    let hue = typeof options.masterHue === "number" ? options.masterHue : 0;
    let saturation = typeof options.masterSaturation === "number" ? options.masterSaturation : 0;
    let lightness = typeof options.masterLightness === "number" ? options.masterLightness : 0;
    let colorize = options.colorize === true;

    await execute(async () => {
        selectLayer(layer, true);
        let commands = [
            {
                _obj: "make",
                _target: [{ _ref: "adjustmentLayer" }],
                using: {
                    _obj: "adjustmentLayer",
                    type: { _obj: "hueSaturation", colorize: colorize },
                },
            },
            {
                _obj: "set",
                _target: [
                    { _enum: "ordinal", _ref: "adjustmentLayer", _value: "targetEnum" },
                ],
                to: {
                    _obj: "hueSaturation",
                    colorize: colorize,
                    adjustment: [
                        {
                            _obj: "hueSatAdjustmentV2",
                            hue: hue,
                            saturation: saturation,
                            lightness: lightness,
                        },
                    ],
                },
            },
        ];
        await action.batchPlay(commands, {});
    });
};

const addExposureAdjustmentLayer = async (command) => {
    let options = command.options;
    let layerId = options.layerId;
    let layer = findLayer(layerId);
    if (!layer) {
        throw new Error(`addExposureAdjustmentLayer : Could not find layerId : ${layerId}`);
    }

    let exposure = typeof options.exposure === "number" ? options.exposure : 0;
    let offset = typeof options.offset === "number" ? options.offset : 0;
    let gamma = typeof options.gamma === "number" ? options.gamma : 1.0;

    await execute(async () => {
        selectLayer(layer, true);
        let commands = [
            {
                _obj: "make",
                _target: [{ _ref: "adjustmentLayer" }],
                using: { _obj: "adjustmentLayer", type: { _obj: "exposure" } },
            },
            {
                _obj: "set",
                _target: [
                    { _enum: "ordinal", _ref: "adjustmentLayer", _value: "targetEnum" },
                ],
                to: {
                    _obj: "exposure",
                    exposure: exposure,
                    offset: offset,
                    // PS calls the gamma slider "gammaCorrection" in the descriptor.
                    gammaCorrection: gamma,
                },
            },
        ];
        await action.batchPlay(commands, {});
    });
};

const addPhotoFilterAdjustmentLayer = async (command) => {
    let options = command.options;
    let layerId = options.layerId;
    let layer = findLayer(layerId);
    if (!layer) {
        throw new Error(`addPhotoFilterAdjustmentLayer : Could not find layerId : ${layerId}`);
    }

    // Photo Filter takes either a preset filter name OR a custom RGB color.
    let density = typeof options.density === "number" ? options.density : 25;
    let preserveLuminosity = options.preserveLuminosity !== false;
    let filterShape;
    if (options.color && typeof options.color === "object") {
        filterShape = {
            color: {
                _obj: "RGBColor",
                red: options.color.red,
                grain: options.color.green,
                blue: options.color.blue,
            },
        };
    } else if (typeof options.preset === "string") {
        // Preset names: e.g. "warmingFilter85", "coolingFilter80", etc.
        filterShape = {
            filter: { _enum: "photoFilterPreset", _value: options.preset },
        };
    } else {
        filterShape = {
            filter: { _enum: "photoFilterPreset", _value: "warmingFilter85" },
        };
    }

    await execute(async () => {
        selectLayer(layer, true);
        let commands = [
            {
                _obj: "make",
                _target: [{ _ref: "adjustmentLayer" }],
                using: { _obj: "adjustmentLayer", type: { _obj: "photoFilter" } },
            },
            {
                _obj: "set",
                _target: [
                    { _enum: "ordinal", _ref: "adjustmentLayer", _value: "targetEnum" },
                ],
                to: {
                    _obj: "photoFilter",
                    ...filterShape,
                    density: density,
                    preserveLuminosity: preserveLuminosity,
                },
            },
        ];
        await action.batchPlay(commands, {});
    });
};

const addChannelMixerAdjustmentLayer = async (command) => {
    let options = command.options;
    let layerId = options.layerId;
    let layer = findLayer(layerId);
    if (!layer) {
        throw new Error(`addChannelMixerAdjustmentLayer : Could not find layerId : ${layerId}`);
    }

    let mixes = options.mixes || {};
    let monochrome = options.monochrome === true;

    let buildOutputChannel = (channelName, source) => ({
        _obj: "channelMatrix",
        channel: { _enum: "channel", _ref: "channel", _value: channelName },
        source: [
            typeof source.red === "number" ? source.red : 0,
            typeof source.green === "number" ? source.green : 0,
            typeof source.blue === "number" ? source.blue : 0,
            typeof source.constant === "number" ? source.constant : 0,
        ],
    });

    let adjustment = [];
    if (mixes.red) adjustment.push(buildOutputChannel("red", mixes.red));
    if (mixes.green) adjustment.push(buildOutputChannel("green", mixes.green));
    if (mixes.blue) adjustment.push(buildOutputChannel("blue", mixes.blue));

    await execute(async () => {
        selectLayer(layer, true);
        let commands = [
            {
                _obj: "make",
                _target: [{ _ref: "adjustmentLayer" }],
                using: {
                    _obj: "adjustmentLayer",
                    type: { _obj: "channelMixer", monochromatic: monochrome },
                },
            },
            {
                _obj: "set",
                _target: [
                    { _enum: "ordinal", _ref: "adjustmentLayer", _value: "targetEnum" },
                ],
                to: {
                    _obj: "channelMixer",
                    monochromatic: monochrome,
                    ...(adjustment.length > 0 ? { adjustment: adjustment } : {}),
                },
            },
        ];
        await action.batchPlay(commands, {});
    });
};

const addGradientMapAdjustmentLayer = async (command) => {
    let options = command.options;
    let layerId = options.layerId;
    let layer = findLayer(layerId);
    if (!layer) {
        throw new Error(`addGradientMapAdjustmentLayer : Could not find layerId : ${layerId}`);
    }

    // Caller passes UI-style 0-100 percentages for `location`; PS uses
    // 0-4096 internally. Rescale here.
    let colorStops = (options.colorStops || [
        { location: 0, midpoint: 50, color: { red: 0, green: 0, blue: 0 } },
        { location: 100, midpoint: 50, color: { red: 255, green: 255, blue: 255 } },
    ]).map((stop) => ({
        _obj: "colorStop",
        color: {
            _obj: "RGBColor",
            red: stop.color.red,
            grain: stop.color.green,
            blue: stop.color.blue,
        },
        location: Math.round((stop.location / 100) * 4096),
        midpoint: typeof stop.midpoint === "number" ? stop.midpoint : 50,
        type: { _enum: "colorStopType", _value: "userStop" },
    }));

    let reverse = options.reverse === true;
    let dither = options.dither === true;

    await execute(async () => {
        selectLayer(layer, true);
        let commands = [
            {
                _obj: "make",
                _target: [{ _ref: "adjustmentLayer" }],
                using: { _obj: "adjustmentLayer", type: { _obj: "gradientMapClass" } },
            },
            {
                _obj: "set",
                _target: [
                    { _enum: "ordinal", _ref: "adjustmentLayer", _value: "targetEnum" },
                ],
                to: {
                    _obj: "gradientMapClass",
                    gradient: {
                        _obj: "gradientClassEvent",
                        colors: colorStops,
                        gradientForm: { _enum: "gradientForm", _value: "customStops" },
                        interfaceIconFrameDimmed: 4096,
                        name: "Custom",
                    },
                    reverse: reverse,
                    dither: dither,
                },
            },
        ];
        await action.batchPlay(commands, {});
    });
};

const desaturateLayer = async (command) => {
    let options = command.options;
    let layerId = options.layerId;
    let layer = findLayer(layerId);
    if (!layer) {
        throw new Error(`desaturateLayer : Could not find layerId : ${layerId}`);
    }

    await execute(async () => {
        selectLayer(layer, true);
        await action.batchPlay([{ _obj: "desaturate" }], {});
    });
};

const invertLayer = async (command) => {
    let options = command.options;
    let layerId = options.layerId;
    let layer = findLayer(layerId);
    if (!layer) {
        throw new Error(`invertLayer : Could not find layerId : ${layerId}`);
    }

    await execute(async () => {
        selectLayer(layer, true);
        await action.batchPlay([{ _obj: "invert" }], {});
    });
};

const commandHandlers = {
    addAdjustmentLayerBlackAndWhite,
    addBrightnessContrastAdjustmentLayer,
    addAdjustmentLayerVibrance,
    addColorBalanceAdjustmentLayer,
    addSolidColorFillLayer,
    addSelectiveColorAdjustmentLayer,
    addCurvesAdjustmentLayer,
    addLevelsAdjustmentLayer,
    addHueSaturationAdjustmentLayer,
    addExposureAdjustmentLayer,
    addPhotoFilterAdjustmentLayer,
    addChannelMixerAdjustmentLayer,
    addGradientMapAdjustmentLayer,
    desaturateLayer,
    invertLayer,
}

module.exports = {
    commandHandlers
};