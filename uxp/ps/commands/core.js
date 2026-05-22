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

const { app, constants, action, imaging } = require("photoshop");
const fs = require("uxp").storage.localFileSystem;

const {
    _saveDocumentAs,
    parseColor,
    getAlignmentMode,
    getNewDocumentMode,
    selectLayer,
    findLayer,
    findLayerByName,
    execute,
    tokenify,
    hasActiveSelection,
    listOpenDocuments
} = require("./utils");

const { rasterizeLayer } = require("./layers").commandHandlers;

const openFile = async (command) => {
    let options = command.options;

    await execute(async () => {
        let entry = null;
        try {
            entry = await fs.getEntryWithUrl("file:" + options.filePath);
        } catch (e) {
            throw new Error(
                "openFile: Could not create file entry. File probably does not exist."
            );
        }

        await app.open(entry);
    });
};

const placeImage = async (command) => {
    let options = command.options;
    let layerId = options.layerId;
    let layer = findLayer(layerId);

    if (!layer) {
        throw new Error(`placeImage : Could not find layerId : ${layerId}`);
    }

    await execute(async () => {
        selectLayer(layer, true);
        let layerId = layer.id;

        let imagePath = await tokenify(options.imagePath);

        let commands = [
            // Place
            {
                ID: layerId,
                _obj: "placeEvent",
                freeTransformCenterState: {
                    _enum: "quadCenterState",
                    _value: "QCSAverage",
                },
                null: {
                    _kind: "local",
                    _path: imagePath,
                },
                offset: {
                    _obj: "offset",
                    horizontal: {
                        _unit: "pixelsUnit",
                        _value: 0.0,
                    },
                    vertical: {
                        _unit: "pixelsUnit",
                        _value: 0.0,
                    },
                },
                replaceLayer: {
                    _obj: "placeEvent",
                    to: {
                        _id: layerId,
                        _ref: "layer",
                    },
                },
            },
            {
                _obj: "set",
                _target: [
                    {
                        _enum: "ordinal",
                        _ref: "layer",
                        _value: "targetEnum",
                    },
                ],
                to: {
                    _obj: "layer",
                    name: layerId,
                },
            },
        ];

        await action.batchPlay(commands, {});
        await rasterizeLayer(command);
    });
};

const getDocumentImage = async (command) => {
    let out = await execute(async () => {

        const pixelsOpt = {
            applyAlpha: true
        };

        const imgObj = await imaging.getPixels(pixelsOpt);

        const base64Data = await imaging.encodeImageData({
            imageData: imgObj.imageData,
            base64: true,
        });

        const result = {
            base64Image: base64Data,
            dataUrl: `data:image/jpeg;base64,${base64Data}`,
            width: imgObj.imageData.width,
            height: imgObj.imageData.height,
            colorSpace: imgObj.imageData.colorSpace,
            components: imgObj.imageData.components,
            format: "jpeg",
        };

        imgObj.imageData.dispose();
        return result;
    });

    return out;
};

const getDocumentInfo = async (command) => {
    let doc = app.activeDocument;
    let path = doc.path;

    let out = {
        height: doc.height,
        width: doc.width,
        colorMode: doc.mode.toString(),
        pixelAspectRatio: doc.pixelAspectRatio,
        resolution: doc.resolution,
        path: path,
        saved: path.length > 0,
        hasUnsavedChanges: !doc.saved,
    };

    return out;
};

const cropDocument = async (command) => {
    let options = command.options;

    if (!hasActiveSelection()) {
        throw new Error("cropDocument : Requires an active selection");
    }

    return await execute(async () => {
        let commands = [
            // Crop
            {
                _obj: "crop",
                delete: true,
            },
        ];

        await action.batchPlay(commands, {});
    });
};

const removeBackground = async (command) => {
    let options = command.options;
    let layerId = options.layerId;

    let layer = findLayer(layerId);

    if (!layer) {
        throw new Error(
            `removeBackground : Could not find layerId : ${layerId}`
        );
    }

    await execute(async () => {
        selectLayer(layer, true);

        let commands = [
            // Remove Background
            {
                _obj: "removeBackground",
            },
        ];

        await action.batchPlay(commands, {});
    });
};

const alignContent = async (command) => {
    let options = command.options;
    let layerId = options.layerId;

    let layer = findLayer(layerId);

    if (!layer) {
        throw new Error(
            `alignContent : Could not find layerId : ${layerId}`
        );
    }

    if (!app.activeDocument.selection.bounds) {
        throw new Error(`alignContent : Requires an active selection`);
    }

    await execute(async () => {
        let m = getAlignmentMode(options.alignmentMode);

        selectLayer(layer, true);

        let commands = [
            {
                _obj: "align",
                _target: [
                    {
                        _enum: "ordinal",
                        _ref: "layer",
                        _value: "targetEnum",
                    },
                ],
                alignToCanvas: false,
                using: {
                    _enum: "alignDistributeSelector",
                    _value: m,
                },
            },
        ];
        await action.batchPlay(commands, {});
    });
};

const generateImage = async (command) => {
    let options = command.options;

    await execute(async () => {
        let doc = app.activeDocument;

        await doc.selection.selectAll();

        let contentType = "none";
        const c = options.contentType.toLowerCase()
        if (c === "photo" || c === "art") {
            contentType = c;
        }

        let commands = [
            // Generate Image current document
            {
                _obj: "syntheticTextToImage",
                _target: [
                    {
                        _enum: "ordinal",
                        _ref: "document",
                        _value: "targetEnum",
                    },
                ],
                documentID: doc.id,
                layerID: 0,
                prompt: options.prompt,
                serviceID: "clio",
                serviceOptionsList: {
                    clio: {
                        _obj: "clio",
                        clio_advanced_options: {
                            text_to_image_styles_options: {
                                text_to_image_content_type: contentType,
                                text_to_image_effects_count: 0,
                                text_to_image_effects_list: [
                                    "none",
                                    "none",
                                    "none",
                                ],
                            },
                        },
                        dualCrop: true,
                        gentech_workflow_name: "text_to_image",
                        gi_ADVANCED: '{"enable_mts":true}',
                        gi_CONTENT_PRESERVE: 0,
                        gi_CROP: false,
                        gi_DILATE: false,
                        gi_ENABLE_PROMPT_FILTER: true,
                        gi_GUIDANCE: 6,
                        gi_MODE: "ginp",
                        gi_NUM_STEPS: -1,
                        gi_PROMPT: options.prompt,
                        gi_SEED: -1,
                        gi_SIMILARITY: 0,
                    },
                },
                workflow: "text_to_image",
                workflowType: {
                    _enum: "genWorkflow",
                    _value: "text_to_image",
                },
            },
            // Rasterize current layer
            {
                _obj: "rasterizeLayer",
                _target: [
                    {
                        _enum: "ordinal",
                        _ref: "layer",
                        _value: "targetEnum",
                    },
                ],
            },
        ];
        let o = await action.batchPlay(commands, {});
        let layerId = o[0].layerID;

        //let l = findLayerByName(options.prompt);
        let l = findLayer(layerId);
        l.name = options.layerName;
    });
};

const generativeFill = async (command) => {
    const options = command.options;
    const layerId = options.layerId;
    const prompt = options.prompt;

    const layer = findLayer(layerId);

    if (!layer) {
        throw new Error(
            `generativeFill : Could not find layerId : ${layerId}`
        );
    }

    if(!hasActiveSelection()) {
        throw new Error(
            `generativeFill : Requires an active selection.`
        ); 
    }

    await execute(async () => {
        let doc = app.activeDocument;

        let contentType = "none";
        const c = options.contentType.toLowerCase()
        if (c === "photo" || c === "art") {
            contentType = c;
        }

        let commands = [
            // Generative Fill current document
            {
                "_obj": "syntheticFill",
                "_target": [
                    {
                        "_enum": "ordinal",
                        "_ref": "document",
                        "_value": "targetEnum"
                    }
                ],
                "documentID": doc.id,
                "layerID": layerId,
                "prompt": prompt,
                "serviceID": "clio",
                "serviceOptionsList": {
                    "clio": {
                        "_obj": "clio",
                        "dualCrop": true,
                        "gi_ADVANCED": "{\"enable_mts\":true}",
                        "gi_CONTENT_PRESERVE": 0,
                        "gi_CROP": false,
                        "gi_DILATE": false,
                        "gi_ENABLE_PROMPT_FILTER": true,
                        "gi_GUIDANCE": 6,
                        "gi_MODE": "tinp",
                        "gi_NUM_STEPS": -1,
                        "gi_PROMPT": prompt,
                        "gi_SEED": -1,
                        "gi_SIMILARITY": 0,


                        clio_advanced_options: {
                            text_to_image_styles_options: {
                                text_to_image_content_type: contentType,
                                text_to_image_effects_count: 0,
                                text_to_image_effects_list: [
                                    "none",
                                    "none",
                                    "none",
                                ],
                            },
                        },

                    }
                },
                "serviceVersion": "clio3",
                "workflowType": {
                    "_enum": "genWorkflow",
                    "_value": "in_painting"
                },
                "workflow_to_active_service_identifier_map": {
                    "gen_harmonize": "clio3",
                    "generate_background": "clio3",
                    "generate_similar": "clio3",
                    "generativeUpscale": "fal_aura_sr",
                    "in_painting": "clio3",
                    "instruct_edit": "clio3",
                    "out_painting": "clio3",
                    "text_to_image": "clio3"
                }
            }
        ];


        let o = await action.batchPlay(commands, {});
        let id = o[0].layerID;

        //let l = findLayerByName(options.prompt);
        let l = findLayer(id);
        l.name = options.layerName;
    });
};

const saveDocument = async (command) => {
    await execute(async () => {
        await app.activeDocument.save();
    });
};

const saveDocumentAs = async (command) => {
    let options = command.options;

    return await _saveDocumentAs(options.filePath, options.fileType);
};

const setActiveDocument = async (command) => {
    let options = command.options;
    let documentId = options.documentId;

    // `listOpenDocuments()` returns plain objects (see generateDocumentInfo),
    // but `app.activeDocument` requires a real Document instance. Iterate
    // `app.documents` to grab the live instance.
    let target = null;
    for (let doc of app.documents) {
        if (doc.id === documentId) {
            target = doc;
            break;
        }
    }
    if (!target) {
        throw new Error(`setActiveDocument : Could not find documentId : ${documentId}`);
    }

    await execute(async () => {
        app.activeDocument = target;
    });
};

const getDocuments = async (command) => {
    return listOpenDocuments()
}

const duplicateDocument = async (command) => {
    let options = command.options;
    let name = options.name

    await execute(async () => {
        const doc = app.activeDocument;
        await doc.duplicate(name)
    });
};

const createDocument = async (command) => {
    let options = command.options;
    let colorMode = getNewDocumentMode(command.options.colorMode);
    let fillColor = parseColor(options.fillColor);

    await execute(async () => {
        await app.createDocument({
            typename: "DocumentCreateOptions",
            // The wrapper exposes `document_name` but we previously
            // dropped it on the floor here — the doc would show in PS
            // as "Untitled-1" regardless. Pass it through; PS auto-falls
            // back to its Untitled-N counter when `name` is missing.
            name: options.name,
            width: options.width,
            height: options.height,
            resolution: options.resolution,
            mode: colorMode,
            fill: constants.DocumentFill.COLOR,
            fillColor: fillColor,
            profile: "sRGB IEC61966-2.1",
        });

        let background = findLayerByName("Background");
        background.allLocked = false;
        background.name = "Background";
    });
};

const closeDocument = async (command) => {
    let options = command.options || {};
    let documentId = options.documentId;
    let saveOption = (options.saveChanges || "DO_NOT_SAVE_CHANGES").toUpperCase();

    let saveOptions = {
        "DO_NOT_SAVE_CHANGES": constants.SaveOptions.DONOTSAVECHANGES,
        "SAVE_CHANGES": constants.SaveOptions.SAVECHANGES,
        "PROMPT_TO_SAVE_CHANGES": constants.SaveOptions.PROMPTTOSAVECHANGES,
    };
    // PS constants can be falsy numbers (e.g. enum value 0) — use an
    // explicit `undefined` check instead of `!saveOpt`, which mis-rejects
    // a valid 0-value constant as "unknown".
    if (!(saveOption in saveOptions)) {
        throw new Error(
            `closeDocument : Unknown saveChanges value : ${saveOption}. ` +
            `Use DO_NOT_SAVE_CHANGES | SAVE_CHANGES | PROMPT_TO_SAVE_CHANGES.`
        );
    }
    let saveOpt = saveOptions[saveOption];

    // Default to the active document when no id is supplied.
    let target = null;
    if (typeof documentId === "number") {
        for (let doc of app.documents) {
            if (doc.id === documentId) {
                target = doc;
                break;
            }
        }
        if (!target) {
            throw new Error(
                `closeDocument : Could not find documentId : ${documentId}`
            );
        }
    } else {
        target = app.activeDocument;
    }

    await execute(async () => {
        await target.close(saveOpt);
    });
};

const createArtboard = async (command) => {
    let options = command.options;
    let name = options.name || "Artboard 1";
    let bounds = options.bounds;  // { top, left, bottom, right }

    if (!bounds || typeof bounds.top !== "number") {
        throw new Error(
            `createArtboard : bounds (top/left/bottom/right) is required`
        );
    }

    await execute(async () => {
        let commands = [
            {
                _obj: "make",
                _target: [{ _ref: "artboardSection" }],
                artboardRect: {
                    _obj: "classFloatRect",
                    top: bounds.top,
                    left: bounds.left,
                    bottom: bounds.bottom,
                    right: bounds.right,
                },
                using: {
                    _obj: "artboardSection",
                    name: name,
                },
            },
        ];
        await action.batchPlay(commands, {});
    });
};

const addNewGuideLayout = async (command) => {
    let options = command.options;
    let columns = options.columns;  // int or null
    let rows = options.rows;        // int or null
    let columnGutter = options.columnGutter;  // pixels or null
    let rowGutter = options.rowGutter;        // pixels or null

    if (!columns && !rows) {
        throw new Error(
            `addNewGuideLayout : at least one of columns or rows is required`
        );
    }

    await execute(async () => {
        let descriptor = {
            _obj: "newGuideGrid",
            guideTarget: { _enum: "guideTarget", _value: "guideTargetCanvas" },
        };
        if (columns) {
            descriptor.columns = {
                _obj: "guideGrid",
                count: columns,
                gutter: typeof columnGutter === "number"
                    ? { _unit: "pixelsUnit", _value: columnGutter }
                    : { _unit: "pixelsUnit", _value: 0 },
            };
        }
        if (rows) {
            descriptor.rows = {
                _obj: "guideGrid",
                count: rows,
                gutter: typeof rowGutter === "number"
                    ? { _unit: "pixelsUnit", _value: rowGutter }
                    : { _unit: "pixelsUnit", _value: 0 },
            };
        }
        await action.batchPlay([descriptor], {});
    });
};

const executeBatchPlayCommand = async (commands) => {
    let options = commands.options;
    let c = options.commands;



    let out = await execute(async () => {
        let o = await action.batchPlay(c, {});
        return o[0]
    });

    console.log(out)
    return out;
}

const resizeImage = async (command) => {
    let options = command.options;
    let width = options.width;
    let height = options.height;
    let resolution = options.resolution;

    await execute(async () => {
        let to = { _obj: "imageSize" };
        if (typeof width === "number") {
            to.width = { _unit: "pixelsUnit", _value: width };
        }
        if (typeof height === "number") {
            to.height = { _unit: "pixelsUnit", _value: height };
        }
        if (typeof resolution === "number") {
            to.resolution = { _unit: "densityUnit", _value: resolution };
        }
        to.constrainProportions = options.constrainProportions !== false;
        to.scaleStyles = options.scaleStyles !== false;
        await action.batchPlay([to], {});
    });
};

const resizeCanvas = async (command) => {
    let options = command.options;
    let width = options.width;
    let height = options.height;
    let anchor = options.anchor || "middleCenter";

    // PS canvas-size anchor combines horizontal + vertical enums. Accept
    // a 9-position string (topLeft, topCenter, topRight, middleLeft,
    // middleCenter, middleRight, bottomLeft, bottomCenter, bottomRight)
    // and split it.
    const horizontalByAnchor = {
        topLeft: "left", middleLeft: "left", bottomLeft: "left",
        topCenter: "center", middleCenter: "center", bottomCenter: "center",
        topRight: "right", middleRight: "right", bottomRight: "right",
    };
    const verticalByAnchor = {
        topLeft: "top", topCenter: "top", topRight: "top",
        middleLeft: "center", middleCenter: "center", middleRight: "center",
        bottomLeft: "bottom", bottomCenter: "bottom", bottomRight: "bottom",
    };

    await execute(async () => {
        let cmd = {
            _obj: "canvasSize",
            horizontal: { _enum: "horizontalLocation", _value: horizontalByAnchor[anchor] || "center" },
            vertical: { _enum: "verticalLocation", _value: verticalByAnchor[anchor] || "center" },
        };
        if (typeof width === "number") {
            cmd.width = { _unit: "pixelsUnit", _value: width };
        }
        if (typeof height === "number") {
            cmd.height = { _unit: "pixelsUnit", _value: height };
        }
        if (options.relative === true) {
            cmd.relative = true;
        }
        await action.batchPlay([cmd], {});
    });
};

const rotateCanvas = async (command) => {
    let options = command.options;
    let angle = typeof options.angle === "number" ? options.angle : 0;

    // PS exposes a single 'rotateEventEnum' that handles 90 CW/CCW, 180,
    // arbitrary. We prefer the arbitrary form for max flexibility.
    await execute(async () => {
        await action.batchPlay(
            [
                {
                    _obj: "rotateEventEnum",
                    angle: { _unit: "angleUnit", _value: angle },
                },
            ],
            {},
        );
    });
};

const trimDocument = async (command) => {
    let options = command.options;
    // 'transparency' | 'topLeftPixel' | 'bottomRightPixel'
    let trimBasedOn = options.trimBasedOn || "transparency";
    let trimTop = options.top !== false;
    let trimBottom = options.bottom !== false;
    let trimLeft = options.left !== false;
    let trimRight = options.right !== false;

    await execute(async () => {
        await action.batchPlay(
            [
                {
                    _obj: "trim",
                    bottom: trimBottom,
                    left: trimLeft,
                    right: trimRight,
                    top: trimTop,
                    trimBasedOn: { _enum: "trimBasedOn", _value: trimBasedOn },
                },
            ],
            {},
        );
    });
};

// `{ _obj: 'undo' }` is a no-op in current UXP — the BatchPlay descriptor
// is accepted but doesn't rewind history. Navigate the history state
// explicitly instead, which is the standard PS scripting form for
// programmatic undo/redo.
const undoCommand = async (command) => {
    await execute(async () => {
        await action.batchPlay(
            [
                {
                    _obj: "select",
                    _target: [
                        { _enum: "ordinal", _ref: "historyState", _value: "previous" },
                    ],
                },
            ],
            {},
        );
    });
};

const redoCommand = async (command) => {
    await execute(async () => {
        await action.batchPlay(
            [
                {
                    _obj: "select",
                    _target: [
                        { _enum: "ordinal", _ref: "historyState", _value: "next" },
                    ],
                },
            ],
            {},
        );
    });
};

const pasteInto = async (command) => {
    await execute(async () => {
        await action.batchPlay([{ _obj: "pasteInto" }], {});
    });
};

const pasteOutside = async (command) => {
    await execute(async () => {
        await action.batchPlay([{ _obj: "pasteOutside" }], {});
    });
};

const commandHandlers = {
    generativeFill,
    executeBatchPlayCommand,
    setActiveDocument,
    getDocuments,
    duplicateDocument,
    getDocumentImage,
    openFile,
    placeImage,
    getDocumentInfo,
    cropDocument,
    removeBackground,
    alignContent,
    generateImage,
    saveDocument,
    saveDocumentAs,
    createDocument,
    closeDocument,
    createArtboard,
    addNewGuideLayout,
    resizeImage,
    resizeCanvas,
    rotateCanvas,
    trimDocument,
    undoCommand,
    redoCommand,
    pasteInto,
    pasteOutside,
};

module.exports = {
    commandHandlers,
};
