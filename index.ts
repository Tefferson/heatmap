const getColorFromRecord = (
  colorsObject: Record<string, string>,
  value: number
) => {
  for (const [key, color] of Object.entries(colorsObject)) {
    if (value <= Number(key)) {
      return color;
    }
  }

  return "white";
};

const getColorFromList = (colors: string[], value: number) => {
  const index = Math.floor(value * colors.length);
  return colors[index];
};

const _options = {
  xResolution: 14,
  yResolution: 6,
  size: 10,
  disable: false,
  theme: 2,
  reverseY: false,
  origin: { x: 50, y: 150 },
};

type Options = typeof _options;

type Params = {
  canvasWidth: number | undefined;
  canvasHeight: number | undefined;
  ctx: {
    fillRect: (x: number, y: number, width: number, height: number) => void;
    fillStyle: string | unknown;
    fillText: (text: string, x: number, y: number) => void;
    font: string;
    clearRect: (x: number, y: number, width: number, height: number) => void;
    beginPath: () => void;
    moveTo: (x: number, y: number) => void;
    bezierCurveTo: (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      x: number,
      y: number
    ) => void;
    lineTo: (x: number, y: number) => void;
    closePath: () => void;
    fill: () => void;
    clip: () => void;
  };
  matrix: number[][];
  heights: number[];
  minValue?: number;
  maxValue?: number;
  drawYAxisTexts?: (
    index: number,
    options: Options,
    defaultFunction: () => void
  ) => void;
  drawXAxisTexts?: (
    index: number,
    options: Options,
    defaultFunction: () => void
  ) => void;
  getcolor?: (value: number, min: number, max: number) => string;
};

const initHeatmap = (
  { ctx, ...params }: Params,
  options?: Partial<Options>
) => {
  const matrix: number[][] = JSON.parse(JSON.stringify(params.matrix));

  const mergedOptions = {
    ..._options,
    ...options,
    origin: { ..._options.origin, ...options?.origin },
  };

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
    heights.push(
      ...new Array(heightsToBeAdded).fill(
        params.heights[params.heights.length - 1]
      )
    );
  }

  const _render = ({
    xResolution,
    yResolution,
    size,
    disable,
    theme,
    reverseY,
  }: {
    xResolution: number;
    yResolution: number;
    size: number;
    disable: boolean;
    theme: number;
    reverseY: boolean;
  }) => {
    if (!ctx) return console.error("ctx is not valid");

    ctx.clearRect(0, 0, params.canvasWidth || 0, params.canvasHeight || 0);

    const drawRect = (x: number, y: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, size, size);
    };

    const fillText = (text: string, x: number, y: number) => {
      ctx.fillStyle = "black";
      ctx.font = "12px Arial";
      ctx.fillText(text, x, y);
    };

    if (reverseY)
      matrix.forEach((row) => {
        row.reverse();
      });

    const flattenedData = matrix.flat(1);

    const max =
      params.maxValue === undefined
        ? Math.max.apply(null, flattenedData)
        : params.maxValue;
    const min =
      params.minValue === undefined
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

            if (indexY >= heatMatrixLength) continue;
            if (indexX >= heatMatrixRowLength) continue;

            heatMatrix[indexY][indexX] = value + (valuesDiff * k) / yResolution;
            if (disable) heatMatrix[indexY][indexX] = value;
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

            if (indexY >= heatMatrixLength) continue;
            if (indexX >= heatMatrixRowLength) continue;

            const valuesDiff2 =
              heatMatrix[indexY][indexX3] - heatMatrix[indexY][indexX2];

            heatMatrix[indexY][indexX] =
              heatMatrix[indexY2][indexX2] + (valuesDiff2 * l) / xResolution;

            if (disable) heatMatrix[indexY][indexX] = value;
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

    const getColor = (value: number) => {
      if (params.getcolor) return params.getcolor(value, min, max);

      switch (theme) {
        case 0:
          return `hsl(${180 * (1 - value)}, 100%, 50%)`;

        case 1:
          return getColorFromList(
            ["#ef2a07", "#f17901", "#f6e100", "#70f738", "#0100f8"],
            value
          );

        case 2:
          return getColorFromRecord(
            {
              0: "#CEC2B6",
              0.5: "#CEC2B6",
              1: "#3d50f3",
              8: "#58bef3",
              16: "#3dac79",
              18: "#3de95a",
              24: "#d6e95a",
              30: "#d6b25a",
              36: "#d6505a",
            },
            min + value * diff
          );

        default:
          return getColorFromRecord(
            {
              0: "hsl(0, 0%, 80%)",
              0.5: "hsl(0, 0%, 80%)",
              1: "hsl(240, 100%, 50%)",
              8: "hsl(197, 90%, 60%)",
              16: "hsl(165, 60%, 45%)",
              18: "hsl(145, 80%, 45%)",
              24: "hsl(65, 80%, 60%)",
              30: "hsl(45, 80%, 60%)",
              36: "hsl(0, 80%, 60%)",
            },
            min + value * diff
          );
      }
    };

    const prepareClip = () => {
      const getX = (x: number) => -0.5 * xResolution * size + origin.x + x;
      const getY = (y: number) => yResolution * size * numRows + origin.y - y;

      ctx.beginPath();

      ctx.moveTo(getX(xResolution * size * 0.5), getY(0));

      for (let i = 0; i < heights.length - 1; i++) {
        const isFirst = i === 0;
        const isLast = i === heights.length - 2;

        let x1 = getX(i * size * xResolution);
        if (isFirst) x1 += 0.5 * size * xResolution;

        const nextPoint = heights[i + 1];
        const y1 = getY(heights[i] * size * yResolution);

        const maxY = yResolution * size * numRows + origin.y;

        if (isFirst)
          ctx.lineTo(
            getX(size * xResolution) - 0.5 * size * xResolution,
            Math.min(y1 + 0.5 * size * yResolution, maxY)
          );

        let x2 = getX((i + 1) * size * xResolution);
        if (isLast) x2 -= 0.5 * size * xResolution;

        const y2 = getY(nextPoint * size * yResolution);

        if (isLast) {
          ctx.bezierCurveTo(
            (x1 + x2) / 2,
            y1,
            (x1 + x2) / 2,
            y2,
            x2,
            Math.min(y2 + 0.5 * size * yResolution, maxY)
          );
        } else {
          ctx.bezierCurveTo((x1 + x2) / 2, y1, (x1 + x2) / 2, y2, x2, y2);
        }

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

    const defaultDrawXAxisTexts = (index: number) => {
      const x = origin.x + (index + 0.5) * xResolution * size;
      const y = origin.y + numRows * yResolution * size + fontMargin;
      const text = (index + 1).toString().padStart(2, "0");
      fillText(text, x, y);
    };

    const defaultDrawYAxisTexts = (index: number) => {
      const x = origin.x - fontMargin;
      const y = origin.y + (index + 0.5) * yResolution * size;
      const text = (numRows - index).toString().padStart(2, "0");
      fillText(text, x, y);
    };

    const drawAxisTexts = () => {
      // Draw x-axis texts
      for (let i = 0; i < numCols; i++) {
        if (params.drawXAxisTexts)
          params.drawXAxisTexts(i, { ...mergedOptions }, () =>
            defaultDrawXAxisTexts(i)
          );
        else defaultDrawXAxisTexts(i);
      }

      // Draw y-axis texts
      for (let i = 0; i < numRows; i++) {
        if (params.drawYAxisTexts)
          params.drawYAxisTexts(i, { ...mergedOptions }, () =>
            defaultDrawYAxisTexts(i)
          );
        else defaultDrawYAxisTexts(i);
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

export { initHeatmap, getColorFromList, getColorFromRecord };
