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

const applyUnsharpMask = async (command) => {
    let options = command.options;
    let layerId = options.layerId;

    let layer = findLayer(layerId);

    if (!layer) {
        throw new Error(`applyUnsharpMask : Could not find layerId : ${layerId}`);
    }

    let amount = typeof options.amount === "number" ? options.amount : 50;
    let radius = typeof options.radius === "number" ? options.radius : 1;
    let threshold = typeof options.threshold === "number" ? options.threshold : 0;

    await execute(async () => {
        selectLayer(layer, true);
        await action.batchPlay(
            [
                {
                    _obj: "unsharpMask",
                    amount: { _unit: "percentUnit", _value: amount },
                    radius: { _unit: "pixelsUnit", _value: radius },
                    threshold: threshold,
                },
            ],
            {},
        );
    });
};

const applySharpenEdges = async (command) => {
    let options = command.options;
    let layerId = options.layerId;

    let layer = findLayer(layerId);

    if (!layer) {
        throw new Error(`applySharpenEdges : Could not find layerId : ${layerId}`);
    }

    // Sharpen Edges takes no parameters — it auto-detects edges.
    await execute(async () => {
        selectLayer(layer, true);
        await action.batchPlay([{ _obj: "sharpenEdges" }], {});
    });
};

const applyHighPass = async (command) => {
    let options = command.options;
    let layerId = options.layerId;

    let layer = findLayer(layerId);

    if (!layer) {
        throw new Error(`applyHighPass : Could not find layerId : ${layerId}`);
    }

    let radius = typeof options.radius === "number" ? options.radius : 10;

    await execute(async () => {
        selectLayer(layer, true);
        await action.batchPlay(
            [
                {
                    _obj: "highPass",
                    radius: { _unit: "pixelsUnit", _value: radius },
                },
            ],
            {},
        );
    });
};

const applyAddNoise = async (command) => {
    let options = command.options;
    let layerId = options.layerId;

    let layer = findLayer(layerId);

    if (!layer) {
        throw new Error(`applyAddNoise : Could not find layerId : ${layerId}`);
    }

    let amount = typeof options.amount === "number" ? options.amount : 12.5;
    // PS expects 'gaussianDistribution' or 'uniformDistribution'.
    let distribution = options.distribution === "uniform"
        ? "uniformDistribution"
        : "gaussianDistribution";
    let monochromatic = options.monochromatic === true;

    await execute(async () => {
        selectLayer(layer, true);
        await action.batchPlay(
            [
                {
                    _obj: "addNoise",
                    distribution: { _enum: "distribution", _value: distribution },
                    monochromatic: monochromatic,
                    noise: { _unit: "percentUnit", _value: amount },
                },
            ],
            {},
        );
    });
};

const applyReduceNoise = async (command) => {
    let options = command.options;
    let layerId = options.layerId;

    let layer = findLayer(layerId);

    if (!layer) {
        throw new Error(`applyReduceNoise : Could not find layerId : ${layerId}`);
    }

    let strength = typeof options.strength === "number" ? options.strength : 5;
    let preserveDetails = typeof options.preserveDetails === "number" ? options.preserveDetails : 50;
    let reduceColorNoise = typeof options.reduceColorNoise === "number" ? options.reduceColorNoise : 25;
    let sharpenDetails = typeof options.sharpenDetails === "number" ? options.sharpenDetails : 25;
    let removeJpegArtifact = options.removeJpegArtifact === true;

    await execute(async () => {
        selectLayer(layer, true);
        await action.batchPlay(
            [
                {
                    _obj: "reduceNoise",
                    colorNoise: reduceColorNoise,
                    preserveDetails: preserveDetails,
                    removeJPEGArtifact: removeJpegArtifact,
                    sharpness: sharpenDetails,
                    strength: strength,
                },
            ],
            {},
        );
    });
};

const applyMedianFilter = async (command) => {
    let options = command.options;
    let layerId = options.layerId;

    let layer = findLayer(layerId);

    if (!layer) {
        throw new Error(`applyMedianFilter : Could not find layerId : ${layerId}`);
    }

    let radius = typeof options.radius === "number" ? options.radius : 2;

    await execute(async () => {
        selectLayer(layer, true);
        await action.batchPlay(
            [
                {
                    _obj: "medianFilter",
                    radius: { _unit: "pixelsUnit", _value: radius },
                },
            ],
            {},
        );
    });
};

const applyLensCorrection = async (command) => {
    let options = command.options;
    let layerId = options.layerId;

    let layer = findLayer(layerId);

    if (!layer) {
        throw new Error(`applyLensCorrection : Could not find layerId : ${layerId}`);
    }

    // Most users invoke Lens Correction in "auto" mode against the embedded
    // EXIF lens profile — the descriptor below covers that case. Manual
    // distortion / chromatic / vignette tweaks would each require their own
    // typed slider keys; surface them when we see demand in trajectories.
    let autoScale = options.autoScale !== false;
    let removeGeometricDistortion = options.removeGeometricDistortion !== false;
    let removeChromaticAberration = options.removeChromaticAberration !== false;
    let removeVignette = options.removeVignette === true;

    await execute(async () => {
        selectLayer(layer, true);
        await action.batchPlay(
            [
                {
                    _obj: "lensCorrection",
                    autoScale: autoScale,
                    autoTransform: true,
                    chromaticAberration: removeChromaticAberration,
                    geometricDistortion: removeGeometricDistortion,
                    vignette: removeVignette,
                },
            ],
            {},
        );
    });
};

const applyOilPaintFilter = async (command) => {
    let options = command.options;
    let layerId = options.layerId;

    let layer = findLayer(layerId);

    if (!layer) {
        throw new Error(`applyOilPaintFilter : Could not find layerId : ${layerId}`);
    }

    let stylization = typeof options.stylization === "number" ? options.stylization : 5;
    let cleanliness = typeof options.cleanliness === "number" ? options.cleanliness : 5;
    let scale = typeof options.scale === "number" ? options.scale : 1;
    let bristleDetail = typeof options.bristleDetail === "number" ? options.bristleDetail : 5;
    let lightingDirection = typeof options.lightingDirection === "number" ? options.lightingDirection : 0;
    let shine = typeof options.shine === "number" ? options.shine : 1;

    await execute(async () => {
        selectLayer(layer, true);
        await action.batchPlay(
            [
                {
                    _obj: "oilPaint",
                    bristleDetail: bristleDetail,
                    cleanliness: cleanliness,
                    lightingDirection: { _unit: "angleUnit", _value: lightingDirection },
                    scale: scale,
                    shine: shine,
                    stylization: stylization,
                },
            ],
            {},
        );
    });
};

const applyCloudsFilter = async (command) => {
    let options = command.options;
    let layerId = options.layerId;

    let layer = findLayer(layerId);

    if (!layer) {
        throw new Error(`applyCloudsFilter : Could not find layerId : ${layerId}`);
    }

    // 'clouds' generates fresh noise from the foreground/background colors;
    // 'differenceClouds' XORs new clouds with the existing pixels. Both
    // are parameter-free.
    let descriptor = options.difference === true ? "differenceClouds" : "clouds";

    await execute(async () => {
        selectLayer(layer, true);
        await action.batchPlay([{ _obj: descriptor }], {});
    });
};

const commandHandlers = {
    applyMotionBlur,
    applyGaussianBlur,
    applyCameraRawFilter,
    applySmartSharpen,
    applyUnsharpMask,
    applySharpenEdges,
    applyHighPass,
    applyAddNoise,
    applyReduceNoise,
    applyMedianFilter,
    applyLensCorrection,
    applyOilPaintFilter,
    applyCloudsFilter,
};

module.exports = {
    commandHandlers
};