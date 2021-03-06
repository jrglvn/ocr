import { IPage } from "..";

export const extractAndFormatDate = (data: string): string => {
  let result = "";

  let tempResult = data.match(/\d{2,4}[\W\D]+\d{2}[\W\D]+\d{2,4}/);
  if (tempResult) {
    result = tempResult[0].replace(/[\W\D]+/g, "/"); //replace multiple // or \\
  }

  //because of arabic text direction sometimes google vision returns inversed date order
  //if years is on first position change order of items inside string
  if (result.match(/^\d{4}/)) {
    tempResult = result.match(/(\d{4})\/(\d{2})\/(\d{2})/);
    if (tempResult)
      result = `${tempResult[3]}/${tempResult[2]}/${tempResult[1]}`;
  }

  return result;
};

export const extractVatNumber = (data: string): string => {
  let result = "";
  const temp = data.match(/\d{15}/);
  if (temp) {
    result = temp[0];
  }

  return result;
};

export const getBoundingBox = (
  element: any,
  page: IPage
): {
  top;
  right;
  bottom;
  left;
  avgX;
  avgY;
  width;
  height;
} => {
  let result = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    avgX: 0,
    avgY: 0,
    width: 0,
    height: 0,
  };

  const vertices: Array<any> = element.boundingBox.normalizedVertices.length
    ? element.boundingBox.normalizedVertices
    : element.boundingBox.vertices;

  const factor = element.boundingBox.normalizedVertices.length
    ? { width: 1, height: 1 }
    : { width: page.pageData.width, height: page.pageData.height };

  result.top = Math.min(vertices[0].y, vertices[1].y) / factor.height;
  result.right = Math.max(vertices[1].x, vertices[2].x) / factor.width;
  result.bottom = Math.max(vertices[2].y, vertices[3].y) / factor.height;
  result.left = Math.min(vertices[3].x, vertices[0].x) / factor.width;
  result.avgX = (result.left + result.right) / 2;
  result.avgY = (result.top + result.bottom) / 2;

  result.width = result.right - result.left;
  result.height = result.bottom - result.top;

  return result;
};

export const findParagrapshContainingText = (
  page: IPage,
  regex: RegExp
): Array<{ result: string; paragraph: any; page: any }> => {
  const paragraphObjects: Array<{
    result: string;
    paragraph: any;
    page: IPage;
  }> = [];

  page.pageData.blocks.forEach((block) => {
    block.paragraphs.forEach((paragraph) => {
      let paragraph_text = "";
      paragraph.words.forEach((word) => {
        paragraph_text = paragraph_text + " " + extractTextFromWord(word);
      });
      const regexResult = paragraph_text.match(regex);
      if (regexResult && regexResult[0]) {
        paragraphObjects.push({ result: regexResult[0], paragraph, page });
      }
    });
  });

  return paragraphObjects;
};

export const findWordsContainingText = (
  page: IPage,
  regex: RegExp
): Array<{ result: string; word: any }> => {
  const wordObjects: Array<any> = [];

  page.pageData.blocks.forEach((block) => {
    block.paragraphs.forEach((paragraph) => {
      paragraph.words.forEach((word) => {
        const word_text = extractTextFromWord(word);
        const regexResult = word_text.match(regex);
        if (regexResult && regexResult[0]) {
          wordObjects.push({ result: regexResult[0], word });
        }
      });
    });
  });

  return wordObjects;
};

export const extractTextFromWord = (word) => {
  const word_symbols = word.symbols.map((symbol) => symbol.text);
  return word_symbols.join("");
};

export const findWordsInBounds = (
  source: any,
  page: IPage,
  { x1, x2, offsetY1, offsetY2 }: { x1; x2; offsetY1; offsetY2: number }
): Array<any> => {
  const sourceWordBox = getBoundingBox(source, page);
  const wordsInBound: Array<any> = [];
  page.pageData.blocks.forEach((block) => {
    block.paragraphs.forEach((paragraph) => {
      const vertices = paragraph.boundingBox.normalizedVertices.length
        ? paragraph.boundingBox.normalizedVertices
        : paragraph.boundingBox.vertices;

      const slope =
        (vertices[1].y - vertices[0].y) / (vertices[1].x - vertices[0].x);

      paragraph.words.forEach((word) => {
        const wordBox = getBoundingBox(word, page);
        const yOffset = (wordBox.avgX - sourceWordBox.avgX) * slope;
        if (
          wordBox.avgX > x1 &&
          wordBox.avgX < x2 &&
          wordBox.top < sourceWordBox.avgY + yOffset - offsetY1 &&
          wordBox.avgY > sourceWordBox.avgY + yOffset + offsetY2
        ) {
          wordsInBound.push(word);
        }
      });
    });
  });
  return wordsInBound;
};

export const getOffsetWords = (
  page: IPage,
  regex: RegExp,
  indexOfElement: number,
  {
    x1,
    x2,
    offsetY1 = 0,
    offsetY2 = 0,
  }: { x1: number; x2: number; offsetY1?: number; offsetY2?: number }
) => {
  const foundWords = findWordsContainingText(page, regex);
  const wordAtIndex = foundWords[indexOfElement];
  if (wordAtIndex) {
    const foundWords = findWordsInBounds(wordAtIndex.word, page, {
      x1,
      x2,
      offsetY1,
      offsetY2,
    });
    if (foundWords) {
      const stringArray = foundWords.map((word) => extractTextFromWord(word));
      return stringArray.join(" ");
    }
  }
  return "";
};

export const getSlopeOfElement = (element) => {
  const vertices = element.boundingBox.normalizedVertices.length
    ? element.boundingBox.normalizedVertices
    : element.boundingBox.vertices;

  const slope =
    (vertices[1].y - vertices[0].y) / (vertices[1].x - vertices[0].x);
  return slope;
};

export const getAdjacentWordsOnSlope = (
  page: IPage,
  word: any,
  slope: number
) => {
  const sourcebb = getBoundingBox(word, page);

  const adjacentWords: Array<any> = [];

  page.pageData.blocks.forEach((block) => {
    block.paragraphs.forEach((paragraph) => {
      paragraph.words.forEach((word) => {
        const tempbb = getBoundingBox(word, page);
        const yOffset = (tempbb.avgX - sourcebb.avgX) * slope;

        if (
          tempbb.avgX > sourcebb.avgX &&
          tempbb.top < sourcebb.avgY + yOffset &&
          tempbb.bottom > sourcebb.avgY + yOffset
        ) {
          adjacentWords.push(word);
        }
      });
    });
  });
  return adjacentWords;
};
