"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getColorFromRecord = exports.getColorFromList = exports.initHeatmap = void 0;
const getColorFromRecord = (colorsObject, value) => {
    for (const [key, color] of Object.entries(colorsObject)) {
        if (value <= Number(key)) {
            return color;
        }
    }
    return "white";
};
exports.getColorFromRecord = getColorFromRecord;
const getColorFromList = (colors, value) => {
    const index = Math.floor(value * colors.length);
    return colors[index];
};
exports.getColorFromList = getColorFromList;
const _options = {
    xResolution: 14,
    yResolution: 6,
    size: 10,
    disable: false,
    theme: 2,
    reverseY: false,
    origin: { x: 50, y: 150 },
};
const initHeatmap = (_a, options) => {
    var { ctx } = _a, params = __rest(_a, ["ctx"]);
    const matrix = JSON.parse(JSON.stringify(params.matrix));
    const mergedOptions = Object.assign(Object.assign(Object.assign({}, _options), options), { origin: Object.assign(Object.assign({}, _options.origin), options === null || options === void 0 ? void 0 : options.origin) });
    const origin = mergedOptions.origin;
    const heights = [...params.heights];
    heights.push(heights[heights.length - 1]);
    heights.unshift(heights[0]);
    const maxColumns = Math.max.apply(null, [...heights, matrix.length]);
    const matrixLength = matrix.length;
    // preencher "espaços vazios"
    for (let i = 0; i < maxColumns - matrixLength; i++) {
        matrix.unshift([...matrix[0]]);
    }
    const maxRowLength = Math.max.apply(null, [
        ...matrix.map((row) => row.length),
        params.heights.length,
    ]);
    // preencher colunas vazias à direita
    for (const row of matrix) {
        row.push(...new Array(maxRowLength - row.length).fill(row[row.length - 1]));
    }
    // replicar a última "height" para desenhar todo o gráfico
    const heightsToBeAdded = maxRowLength - params.heights.length;
    if (heightsToBeAdded > 0) {
        heights.push(...new Array(heightsToBeAdded).fill(params.heights[params.heights.length - 1]));
    }
    const _render = ({ xResolution, yResolution, size, disable, theme, reverseY, }) => {
        if (!ctx)
            return console.error("ctx is not valid");
        ctx.clearRect(0, 0, params.canvasWidth || 0, params.canvasHeight || 0);
        const drawRect = (x, y, color) => {
            ctx.fillStyle = color;
            ctx.fillRect(x, y, size, size);
        };
        const fillText = (text, x, y) => {
            ctx.fillStyle = "black";
            ctx.font = "12px Arial";
            ctx.fillText(text, x, y);
        };
        if (reverseY)
            matrix.forEach((row) => {
                row.reverse();
            });
        const flattenedData = matrix.flat(1);
        const max = params.maxValue === undefined
            ? Math.max.apply(null, flattenedData)
            : params.maxValue;
        const min = params.minValue === undefined
            ? Math.min.apply(null, flattenedData)
            : params.minValue;
        const diff = max - min;
        const normalizedData = matrix.map((row) => {
            return row.map((value) => {
                return (value - min) / diff;
            });
        });
        const numRows = normalizedData.length;
        const numCols = normalizedData[0].length;
        const heatMatrix = new Array(yResolution * numRows)
            .fill(0)
            .map(() => new Array(xResolution * numCols).fill(0));
        const heatMatrixLength = heatMatrix.length;
        const heatMatrixRowLength = heatMatrix[0].length;
        const halfXresolution = Math.floor(xResolution / 2);
        const halfYresolution = Math.floor(yResolution / 2);
        // esse loop vai preencher a matriz comparando o valor de cada bloco com o de baixo
        for (let i = 0; i < numRows; i++) {
            for (let j = 0; j < numCols; j++) {
                // current "block"
                const value = normalizedData[i][j];
                // bottom
                const valueBottom = normalizedData[(i + 1) % numRows][j];
                const x = j * xResolution;
                const y = i * yResolution;
                const valuesDiff = valueBottom - value;
                for (let k = 0; k < yResolution; k++) {
                    for (let l = 0; l < xResolution; l++) {
                        // esses índices são utilizados para mover a matriz para a direita e para baixo
                        // isso é necessáro para centralizar a matriz
                        const indexY = y + k + halfYresolution;
                        const indexX = x + l + halfXresolution;
                        if (indexY >= heatMatrixLength)
                            continue;
                        if (indexX >= heatMatrixRowLength)
                            continue;
                        heatMatrix[indexY][indexX] = value + (valuesDiff * k) / yResolution;
                        if (disable)
                            heatMatrix[indexY][indexX] = value;
                    }
                }
            }
        }
        // esse loop vai preencher a matriz comparando o valor de cada bloco com o da direita
        for (let i = 0; i < numRows; i++) {
            for (let j = 0; j < numCols; j++) {
                const value = normalizedData[i][j];
                const x = j * xResolution;
                const y = i * yResolution;
                for (let k = 0; k < yResolution; k++) {
                    for (let l = 0; l < xResolution; l++) {
                        // esses índices são utilizados para mover a matriz para a direita e para baixo
                        // isso é necessáro para centralizar a matriz
                        const indexY = y + k + halfYresolution;
                        const indexX = x + l + halfXresolution;
                        const indexY2 = y + k + halfYresolution;
                        const indexX2 = x + halfXresolution;
                        const indexX3 = x + xResolution + halfXresolution;
                        if (indexY >= heatMatrixLength)
                            continue;
                        if (indexX >= heatMatrixRowLength)
                            continue;
                        const valuesDiff2 = heatMatrix[indexY][indexX3] - heatMatrix[indexY][indexX2];
                        heatMatrix[indexY][indexX] =
                            heatMatrix[indexY2][indexX2] + (valuesDiff2 * l) / xResolution;
                        if (disable)
                            heatMatrix[indexY][indexX] = value;
                    }
                }
            }
        }
        // preencher índices que não foram preenchidos à esquerda
        for (let i = 0; i < numRows; i++) {
            for (let j = 0; j < 1; j++) {
                const x = j * xResolution;
                const y = i * yResolution;
                for (let k = 0; k < yResolution; k++) {
                    for (let l = 0; l < halfXresolution; l++) {
                        heatMatrix[y + k][x + l] =
                            heatMatrix[y + k][x - l + xResolution - 1];
                    }
                }
            }
        }
        // preencher índices que não foram preenchidos na parte de cima
        for (let i = 0; i < 1; i++) {
            for (let j = 0; j < numCols; j++) {
                const x = j * xResolution;
                const y = i * yResolution;
                for (let k = 0; k < halfYresolution; k++) {
                    for (let l = 0; l < xResolution; l++) {
                        heatMatrix[y + k][x + l] = heatMatrix[y - k + yResolution][x + l];
                    }
                }
            }
        }
        // ajustar "NaNs" no final de cada linha
        heatMatrix.forEach((row) => {
            row.splice(-halfXresolution);
            row.push(...row.slice(-halfXresolution).reverse());
        });
        const getColor = (value) => {
            if (params.getcolor)
                return params.getcolor(value, min, max);
            switch (theme) {
                case 0:
                    return `hsl(${180 * (1 - value)}, 100%, 50%)`;
                case 1:
                    return getColorFromList(["#ef2a07", "#f17901", "#f6e100", "#70f738", "#0100f8"], value);
                case 2:
                    return getColorFromRecord({
                        0: "#CEC2B6",
                        0.5: "#CEC2B6",
                        1: "#3d50f3",
                        8: "#58bef3",
                        16: "#3dac79",
                        18: "#3de95a",
                        24: "#d6e95a",
                        30: "#d6b25a",
                        36: "#d6505a",
                    }, min + value * diff);
                default:
                    return getColorFromRecord({
                        0: "hsl(0, 0%, 80%)",
                        0.5: "hsl(0, 0%, 80%)",
                        1: "hsl(240, 100%, 50%)",
                        8: "hsl(197, 90%, 60%)",
                        16: "hsl(165, 60%, 45%)",
                        18: "hsl(145, 80%, 45%)",
                        24: "hsl(65, 80%, 60%)",
                        30: "hsl(45, 80%, 60%)",
                        36: "hsl(0, 80%, 60%)",
                    }, min + value * diff);
            }
        };
        const prepareClip = () => {
            const getX = (x) => -0.5 * xResolution * size + origin.x + x;
            const getY = (y) => yResolution * size * numRows + origin.y - y;
            ctx.beginPath();
            ctx.moveTo(getX(xResolution * size * 0.5), getY(0));
            for (let i = 0; i < heights.length - 1; i++) {
                const isFirst = i === 0;
                const isLast = i === heights.length - 2;
                let x1 = getX(i * size * xResolution);
                if (isFirst)
                    x1 += 0.5 * size * xResolution;
                const nextPoint = heights[i + 1];
                const y1 = getY(heights[i] * size * yResolution);
                if (isFirst)
                    ctx.lineTo(getX(size * xResolution) - 0.5 * size * xResolution, y1);
                let x2 = getX((i + 1) * size * xResolution);
                if (isLast)
                    x2 -= 0.5 * size * xResolution;
                const y2 = getY(nextPoint * size * yResolution);
                ctx.bezierCurveTo((x1 + x2) / 2, y1, (x1 + x2) / 2, y2, x2, y2);
                if (isLast) {
                    ctx.lineTo(x2, getY(0));
                }
            }
            ctx.closePath();
            ctx.fill();
            ctx.clip();
        };
        const drawHeatMap = () => {
            heatMatrix.forEach((row, rowIndex) => {
                row.forEach((value, colIndex) => {
                    const x = origin.x + colIndex * size;
                    const y = origin.y + rowIndex * size;
                    drawRect(x, y, getColor(value));
                });
            });
        };
        const fontMargin = 30;
        const defaultDrawXAxisTexts = (index) => {
            const x = origin.x + (index + 0.5) * xResolution * size;
            const y = origin.y + numRows * yResolution * size + fontMargin;
            const text = (index + 1).toString().padStart(2, "0");
            fillText(text, x, y);
        };
        const defaultDrawYAxisTexts = (index) => {
            const x = origin.x - fontMargin;
            const y = origin.y + (index + 0.5) * yResolution * size;
            const text = (numRows - index).toString().padStart(2, "0");
            fillText(text, x, y);
        };
        const drawAxisTexts = () => {
            // Draw x-axis texts
            for (let i = 0; i < numCols; i++) {
                if (params.drawXAxisTexts)
                    params.drawXAxisTexts(i, Object.assign({}, mergedOptions), () => defaultDrawXAxisTexts(i));
                else
                    defaultDrawXAxisTexts(i);
            }
            // Draw y-axis texts
            for (let i = 0; i < numRows; i++) {
                if (params.drawYAxisTexts)
                    params.drawYAxisTexts(i, Object.assign({}, mergedOptions), () => defaultDrawYAxisTexts(i));
                else
                    defaultDrawYAxisTexts(i);
            }
        };
        const drawTexts = () => {
            drawAxisTexts();
        };
        drawTexts();
        prepareClip();
        drawHeatMap();
    };
    const render = () => {
        _render({
            xResolution: mergedOptions.xResolution,
            yResolution: mergedOptions.yResolution,
            size: mergedOptions.size,
            disable: mergedOptions.disable,
            theme: mergedOptions.theme,
            reverseY: mergedOptions.reverseY,
        });
    };
    return { render };
};
exports.initHeatmap = initHeatmap;
