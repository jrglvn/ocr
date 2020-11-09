import {
  findParagrapshContainingText,
  extractTextFromWord,
  getSlopeOfElement,
  findWordsContainingText,
  getAdjacentWordsOnSlope,
} from "./_shared";
import { IPage } from "../index";

export const parseSmeQuotation = (pages: Array<IPage>): any => {
  let returnObject = {
    is_valid: true,
    quotationNumber: "",
  };

  const firstPage = pages[0];

  //get paragraph containg word so we can calculate slope more precisely...
  //then in that paragraph find word object with text="number"
  //look to right of that object using calculated slope to find words that should
  //be our result...
  const [paragraphObject] = findParagrapshContainingText(firstPage, /number/i);
  const slope = getSlopeOfElement(paragraphObject.paragraph);
  let numberWord;
  for (let i = 0; i < paragraphObject.paragraph.words.length; i++) {
    if (
      extractTextFromWord(paragraphObject.paragraph.words[i]).match(/number/)
    ) {
      numberWord = paragraphObject.paragraph.words[i];
      break;
    }
  }

  const adjacentWords = getAdjacentWordsOnSlope(firstPage, numberWord, slope);

  if (!adjacentWords.length) {
    returnObject.is_valid = false;
  } else {
    returnObject.quotationNumber = adjacentWords
      .map((word) => extractTextFromWord(word))
      .join("")
      .replace(":", "");
  }

  console.log("return object: ", returnObject);

  return returnObject;
};
