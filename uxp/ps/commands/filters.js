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

const { app, action } = require("photoshop");  // For app references

const {
    findLayer,
    execute,
    selectLayer
} = require("./utils");  // For the utility functions used in your code

const applyMotionBlur = async (command) => {

    let options = command.options;
    let layerId = options.layerId;

    let layer = findLayer(layerId);

    if (!layer) {
        throw new Error(
            `applyMotionBlur : Could not find layerId : ${layerId}`
        );
    }

    await execute(async () => {
        await layer.applyMotionBlur(options.angle, options.distance);
    });
};

const applyGaussianBlur = async (command) => {

    let options = command.options;
    let layerId = options.layerId;

    let layer = findLayer(layerId);

    if (!layer) {
        throw new Error(
            `applyGaussianBlur : Could not find layerId : ${layerId}`
        );
    }

    await execute(async () => {
        await layer.applyGaussianBlur(options.radius);
    });
};

const applyCameraRawFilter = async (command) => {
    let options = command.options;
    let layerId = options.layerId;

    let layer = findLayer(layerId);

    if (!layer) {
        throw new Error(
            `applyCameraRawFilter : Could not find layerId : ${layerId}`
        );
    }

    await execute(async () => {
        selectLayer(layer, true);

        // Build the Camera Raw descriptor. The settings object only includes
        // adjustments the caller specified — Photoshop's Camera Raw treats
        // omitted keys as "no change", so we don't need to populate every
        // possible slider.
        let settings = options.settings || {};
        let cameraRaw = { _obj: "Adobe Camera Raw Filter" };
        for (let key of Object.keys(settings)) {
            cameraRaw[key] = settings[key];
        }

        await action.batchPlay([cameraRaw], {});
    });
};

const applySmartSharpen = async (command) => {
    let options = command.options;
    let layerId = options.layerId;

    let layer = findLayer(layerId);

    if (!layer) {
        throw new Error(
            `applySmartSharpen : Could not find layerId : ${layerId}`
        );
    }

    await execute(async () => {
        selectLayer(layer, true);

        let commands = [
            {
                _obj: "smartSharpen",
                amount: { _unit: "percentUnit", _value: options.amount },
                radius: { _unit: "pixelsUnit", _value: options.radius },
                noiseReduction: {
                    _unit: "percentUnit",
                    _value: options.noiseReduction,
                },
                blur: {
                    _enum: "blurType",
                    _value: options.blurType || "gaussianBlur",
                },
                preset: { _enum: "preset", _value: "customPreset" },
                useLegacy: false,
            },
        ];

        await action.batchPlay(commands, {});
    });
};

const commandHandlers = {
    applyMotionBlur,
    applyGaussianBlur,
    applyCameraRawFilter,
    applySmartSharpen,
};

module.exports = {
    commandHandlers
};