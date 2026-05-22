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

const commandHandlers = {
    addAdjustmentLayerBlackAndWhite,
    addBrightnessContrastAdjustmentLayer,
    addAdjustmentLayerVibrance,
    addColorBalanceAdjustmentLayer,
    addSolidColorFillLayer,
    addSelectiveColorAdjustmentLayer,
}

module.exports = {
    commandHandlers
};