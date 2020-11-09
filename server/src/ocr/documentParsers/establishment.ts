import { extractAndFormatDate } from "./_shared";
import { IPage } from "../index";
export interface IEstablishment {
  is_valid: boolean;
  company_name: string;
  expiry_date: string;
  establishment_id: string;
}

export const parseEstablishmentId = (
  pages: Array<IPage>
): IEstablishment | any => {
  let returnObject = {
    is_valid: true,
    company_name: "",
    expiry_date: "",
    establishment_id: "",
  };

  const firstPage = pages[0];

  //capture establishment_id of company
  for (let i = 0; i < firstPage.textArray.length; i++) {
    let temp = firstPage.textArray[i].match(/\d[\W]\d[\W]\d{6}/);
    if (temp) {
      returnObject.establishment_id = temp[0];
      break;
    }
  }
  if (!returnObject.establishment_id) return { is_valid: false };

  //get efective registration date, it's usually first occuring date & located in first ~20 entries
  for (let i = 0; i < firstPage.textArray.length; i++) {
    const result = extractAndFormatDate(firstPage.textArray[i]);
    if (result) {
      returnObject.expiry_date = result;
      break;
    }
  }

  // if capture group next to name is empty, company name is in next line
  for (let i = 0; i < firstPage.textArray.length; i++) {
    let temp = firstPage.textArray[i].match(/Name\s*\:\s*(.*)/i);
    if (temp) {
      temp[1] !== ""
        ? (returnObject.company_name = temp[1])
        : (returnObject.company_name = firstPage.textArray[i + 1]);
      break;
    }
  }

  return returnObject;
};
