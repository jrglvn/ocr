import { extractAndFormatDate, extractVatNumber } from "./_shared";
import { IPage } from "../index";
export interface ICoc {
  policy_number: string;
  company_name: string;
  start_date: string;
  expiry_date: string;
}

export const parseCoc = (pages: Array<IPage>): ICoc | any => {
  let returnObject = {
    policy_number: "",
    company_name: "",
    start_date: "",
    expiry_date: "",
  } as ICoc;

  // #1 get tax registration number (usually its in first 20 entries)

  return returnObject;
  //   return returnObject;
};
