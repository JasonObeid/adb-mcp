const { app, constants, action } = require("photoshop");
const { 
    findLayer, 
    execute, 
    parseColor, 
    selectLayer 
} = require("./utils");

const {hasActiveSelection} = require("./utils")

const clearSelection = async () => {
    // The earlier shape called `selection.selectRectangle(...)` with
    // empty bounds — which (a) the modern UXP API rejects with a "Could
    // not find layerId" error path, and (b) leaves a degenerate 1px
    // selection rather than a true deselect. The standard PS deselect
    // descriptor is the same shape menu Edit > Deselect emits.
    await execute(async () => {
        await action.batchPlay(
            [
                {
                    _obj: "set",
                    _target: [{ _property: "selection", _ref: "channel" }],
                    to: { _enum: "ordinal", _value: "none" },
                },
            ],
            {},
        );
    });
};

const createMaskFromSelection = async (command) => {

    let options = command.options;
    let layerId = options.layerId;

    let layer = findLayer(layerId);

    if (!layer) {
        throw new Error(
            `createMaskFromSelection : Could not find layerId : ${layerId}`
        );
    }

    await execute(async () => {
        selectLayer(layer, true);

        let commands = [
            {
                _obj: "make",
                at: {
                    _enum: "channel",
                    _ref: "channel",
                    _value: "mask",
                },
                new: {
                    _class: "channel",
                },
                using: {
                    _enum: "userMaskEnabled",
                    _value: "revealSelection",
                },
            },
        ];

        await action.batchPlay(commands, {});
    });
};

const selectSubject = async (command) => {

    let options = command.options;
    let layerId = options.layerId;

    let layer = findLayer(layerId);

    if (!layer) {
        throw new Error(
            `selectSubject : Could not find layerId : ${layerId}`
        );
    }

    return await execute(async () => {
        selectLayer(layer, true);

        let commands = [
            // Select Subject
            {
                _obj: "autoCutout",
                sampleAllLayers: false,
            },
        ];

        await action.batchPlay(commands, {});
    });
};

const selectSky = async (command) => {

    let options = command.options;
    let layerId = options.layerId;

    let layer = findLayer(layerId);

    if (!layer) {
        throw new Error(`selectSky : Could not find layerId : ${layerId}`);
    }

    return await execute(async () => {
        selectLayer(layer, true);

        let commands = [
            // Select Sky
            {
                _obj: "selectSky",
                sampleAllLayers: false,
            },
        ];

        await action.batchPlay(commands, {});

    });
};

const cutSelectionToClipboard = async (command) => {

    let options = command.options;
    let layerId = options.layerId;

    let layer = findLayer(layerId);

    if (!layer) {
        throw new Error(
            `cutSelectionToClipboard : Could not find layerId : ${layerId}`
        );
    }

    if (!hasActiveSelection()) {
        throw new Error(
            "cutSelectionToClipboard : Requires an active selection"
        );
    }

    return await execute(async () => {
        selectLayer(layer, true);

        let commands = [
            {
                _obj: "cut",
            },
        ];

        await action.batchPlay(commands, {});
    });
};

const copyMergedSelectionToClipboard = async (command) => {

    let options = command.options;

    if (!hasActiveSelection()) {
        throw new Error(
            "copySelectionToClipboard : Requires an active selection"
        );
    }

    return await execute(async () => {
        let commands = [{
            _obj: "copyMerged",
        }];

        await action.batchPlay(commands, {});
    });
};

const copySelectionToClipboard = async (command) => {

    let options = command.options;
    let layerId = options.layerId;

    let layer = findLayer(layerId);

    if (!layer) {
        throw new Error(
            `copySelectionToClipboard : Could not find layerId : ${layerId}`
        );
    }

    if (!hasActiveSelection()) {
        throw new Error(
            "copySelectionToClipboard : Requires an active selection"
        );
    }

    return await execute(async () => {
        selectLayer(layer, true);

        let commands = [{
            _obj: "copyEvent",
            copyHint: "pixels",
        }];

        await action.batchPlay(commands, {});
    });
};

const pasteFromClipboard = async (command) => {

    let options = command.options;
    let layerId = options.layerId;

    let layer = findLayer(layerId);

    if (!layer) {
        throw new Error(
            `pasteFromClipboard : Could not find layerId : ${layerId}`
        );
    }

    return await execute(async () => {
        selectLayer(layer, true);

        let pasteInPlace = options.pasteInPlace;

        let commands = [
            {
                _obj: "paste",
                antiAlias: {
                    _enum: "antiAliasType",
                    _value: "antiAliasNone",
                },
                as: {
                    _class: "pixel",
                },
                inPlace: pasteInPlace,
            },
        ];

        await action.batchPlay(commands, {});
    });
};

const deleteSelection = async (command) => {

    let options = command.options;
    let layerId = options.layerId;
    let layer = findLayer(layerId);

    if (!layer) {
        throw new Error(
            `deleteSelection : Could not find layerId : ${layerId}`
        );
    }

    if (!app.activeDocument.selection.bounds) {
        throw new Error(`invertSelection : Requires an active selection`);
    }

    await execute(async () => {
        selectLayer(layer, true);
        let commands = [
            {
                _obj: "delete",
            },
        ];
        await action.batchPlay(commands, {});
    });
};

const fillSelection = async (command) => {

    let options = command.options;
    let layerId = options.layerId;
    let layer = findLayer(layerId);

    if (!layer) {
        throw new Error(
            `fillSelection : Could not find layerId : ${layerId}`
        );
    }

    if (!app.activeDocument.selection.bounds) {
        throw new Error(`invertSelection : Requires an active selection`);
    }

    await execute(async () => {
        selectLayer(layer, true);

        let c = parseColor(options.color).rgb;
        let commands = [
            // Fill
            {
                _obj: "fill",
                color: {
                    _obj: "RGBColor",
                    blue: c.blue,
                    grain: c.green,
                    red: c.red,
                },
                mode: {
                    _enum: "blendMode",
                    _value: options.blendMode.toLowerCase(),
                },
                opacity: {
                    _unit: "percentUnit",
                    _value: options.opacity,
                },
                using: {
                    _enum: "fillContents",
                    _value: "color",
                },
            },
        ];
        await action.batchPlay(commands, {});
    });
};

const selectPolygon = async (command) => {

    let options = command.options;
    let layerId = options.layerId;
    let layer = findLayer(layerId);

    if (!layer) {
        throw new Error(
            `selectPolygon : Could not find layerId : ${layerId}`
        );
    }

    await execute(async () => {

        selectLayer(layer, true);

        await app.activeDocument.selection.selectPolygon(
            options.points,
            constants.SelectionType.REPLACE,
            options.feather,
            options.antiAlias
        );
    });
};

let selectEllipse = async (command) => {

    let options = command.options;
    let layerId = options.layerId;
    let layer = findLayer(layerId);

    if (!layer) {
        throw new Error(
            `selectEllipse : Could not find layerId : ${layerId}`
        );
    }

    await execute(async () => {

        selectLayer(layer, true);

        await app.activeDocument.selection.selectEllipse(
            options.bounds,
            constants.SelectionType.REPLACE,
            options.feather,
            options.antiAlias
        );
    });
};

const selectRectangle = async (command) => {
    let options = command.options;
    let layerId = options.layerId;
    let layer = findLayer(layerId);

    if (!layer) {
        throw new Error(
            `selectRectangle : Could not find layerId : ${layerId}`
        );
    }

    await execute(async () => {
        selectLayer(layer, true);

        await app.activeDocument.selection.selectRectangle(
            options.bounds,
            constants.SelectionType.REPLACE,
            options.feather,
            options.antiAlias
        );
    });
};

const invertSelection = async (command) => {

    if (!app.activeDocument.selection.bounds) {
        throw new Error(`invertSelection : Requires an active selection`);
    }

    await execute(async () => {
        let commands = [
            {
                _obj: "inverse",
            },
        ];
        await action.batchPlay(commands, {});
    });
};

const selectObject = async (command) => {
    let options = command.options;
    let layerId = options.layerId;
    let bounds = options.bounds;  // { top, left, bottom, right }

    let layer = findLayer(layerId);

    if (!layer) {
        throw new Error(
            `selectObject : Could not find layerId : ${layerId}`
        );
    }
    if (!bounds || typeof bounds.top !== "number") {
        throw new Error(
            `selectObject : bounds (top/left/bottom/right) is required`
        );
    }

    return await execute(async () => {
        selectLayer(layer, true);

        // Object Selection's "Rectangle" mode in PS 2026: provide a hint
        // rectangle and let the model find the most prominent object inside.
        let commands = [
            {
                _obj: "autoSelectInside",
                rectangle: {
                    _obj: "rectangle",
                    top: { _unit: "pixelsUnit", _value: bounds.top },
                    left: { _unit: "pixelsUnit", _value: bounds.left },
                    bottom: { _unit: "pixelsUnit", _value: bounds.bottom },
                    right: { _unit: "pixelsUnit", _value: bounds.right },
                },
                sampleAllLayers: false,
            },
        ];

        await action.batchPlay(commands, {});
    });
};

const selectAll = async (command) => {
    await execute(async () => {
        await action.batchPlay(
            [
                {
                    _obj: "set",
                    _target: [{ _property: "selection", _ref: "channel" }],
                    to: { _enum: "ordinal", _value: "allEnum" },
                },
            ],
            {},
        );
    });
};

const featherSelection = async (command) => {
    let options = command.options;
    let radius = typeof options.radius === "number" ? options.radius : 1;
    if (!hasActiveSelection()) {
        throw new Error("featherSelection : Requires an active selection");
    }
    await execute(async () => {
        await action.batchPlay(
            [
                {
                    _obj: "feather",
                    radius: { _unit: "pixelsUnit", _value: radius },
                },
            ],
            {},
        );
    });
};

const expandSelection = async (command) => {
    let options = command.options;
    let amount = typeof options.amount === "number" ? options.amount : 1;
    if (!hasActiveSelection()) {
        throw new Error("expandSelection : Requires an active selection");
    }
    await execute(async () => {
        await action.batchPlay(
            [
                {
                    _obj: "expand",
                    by: { _unit: "pixelsUnit", _value: amount },
                },
            ],
            {},
        );
    });
};

const contractSelection = async (command) => {
    let options = command.options;
    let amount = typeof options.amount === "number" ? options.amount : 1;
    if (!hasActiveSelection()) {
        throw new Error("contractSelection : Requires an active selection");
    }
    await execute(async () => {
        await action.batchPlay(
            [
                {
                    _obj: "contract",
                    by: { _unit: "pixelsUnit", _value: amount },
                },
            ],
            {},
        );
    });
};

const smoothSelection = async (command) => {
    let options = command.options;
    let radius = typeof options.radius === "number" ? options.radius : 1;
    if (!hasActiveSelection()) {
        throw new Error("smoothSelection : Requires an active selection");
    }
    await execute(async () => {
        await action.batchPlay(
            [
                {
                    _obj: "smooth",
                    radius: { _unit: "pixelsUnit", _value: radius },
                },
            ],
            {},
        );
    });
};

const borderSelection = async (command) => {
    let options = command.options;
    let width = typeof options.width === "number" ? options.width : 1;
    if (!hasActiveSelection()) {
        throw new Error("borderSelection : Requires an active selection");
    }
    await execute(async () => {
        await action.batchPlay(
            [
                {
                    _obj: "border",
                    width: { _unit: "pixelsUnit", _value: width },
                },
            ],
            {},
        );
    });
};

const growSelection = async (command) => {
    if (!hasActiveSelection()) {
        throw new Error("growSelection : Requires an active selection");
    }
    await execute(async () => {
        await action.batchPlay([{ _obj: "grow" }], {});
    });
};

const similarSelection = async (command) => {
    if (!hasActiveSelection()) {
        throw new Error("similarSelection : Requires an active selection");
    }
    await execute(async () => {
        await action.batchPlay([{ _obj: "similar" }], {});
    });
};

const applyContentAwareFill = async (command) => {
    if (!hasActiveSelection()) {
        throw new Error("applyContentAwareFill : Requires an active selection");
    }
    // PS exposes Content-Aware Fill as a fill op with `contentAware` as
    // the fill source. The dedicated workspace (Edit > Content-Aware Fill...)
    // is modal and not parametrically replayable.
    await execute(async () => {
        await action.batchPlay(
            [
                {
                    _obj: "fill",
                    mode: { _enum: "blendMode", _value: "normal" },
                    opacity: { _unit: "percentUnit", _value: 100 },
                    using: { _enum: "fillContents", _value: "contentAware" },
                },
            ],
            {},
        );
    });
};

// Select > Color Range — selects pixels near `color` within `fuzziness`
// tolerance. Document-level (no layer target). minimum === maximum samples a
// single color; Photoshop grows the selection outward by fuzziness.
// NOTE: verify the colorRange descriptor against a live Photoshop — the
// recorded form for "Sampled Colors" can vary by version.
const selectColorRange = async (command) => {
    let options = command.options;
    let color = options.color;
    let fuzziness = options.fuzziness;

    return await execute(async () => {
        let commands = [
            {
                _obj: "colorRange",
                colorModel: 0,
                fuzziness: fuzziness,
                minimum: {
                    _obj: "RGBColor",
                    blue: color.blue,
                    grain: color.green,
                    red: color.red,
                },
                maximum: {
                    _obj: "RGBColor",
                    blue: color.blue,
                    grain: color.green,
                    red: color.red,
                },
            },
        ];

        await action.batchPlay(commands, {});
    });
};

const commandHandlers = {
    selectColorRange,
    clearSelection,
    createMaskFromSelection,
    selectSubject,
    selectSky,
    selectObject,
    cutSelectionToClipboard,
    copyMergedSelectionToClipboard,
    copySelectionToClipboard,
    pasteFromClipboard,
    deleteSelection,
    fillSelection,
    selectPolygon,
    selectEllipse,
    selectRectangle,
    invertSelection,
    selectAll,
    featherSelection,
    expandSelection,
    contractSelection,
    smoothSelection,
    borderSelection,
    growSelection,
    similarSelection,
    applyContentAwareFill,
};

module.exports = {
    commandHandlers
};