"use strict";

import {
  IEstablishment,
  parseEstablishmentId,
} from "./documentParsers/establishment";
import { ITrade, parseTradeLicense } from "./documentParsers/tradeLicense";
import { IVat, parseVatCertificate } from "./documentParsers/vatCertificate";
import { ICoc, parseCoc } from "./documentParsers/coc";
import { IKyc, parseKyc } from "./documentParsers/kyc";

export type TKindOfDocument =
  | "TRADE_LICENCE"
  | "VAT_CERTIFICATE"
  | "ESTABLISHMENT_ID"
  | "COC"
  | "KYC";

export async function parseDocument(
  file: {
    data: any;
    mimetype:
      | "application/pdf"
      | "image/tiff"
      | "image/gif"
      | "image/jpeg"
      | "image/png";
  },
  kind: TKindOfDocument
) {
  let result;
  switch (file.mimetype) {
    case "application/pdf":
    case "image/gif":
    case "image/tiff":
      result = await parsePdf(file);
      return [dispatch(result, kind), result];
    case "image/jpeg":
    case "image/png":
      result = await parseImage(file);
      return [dispatch(result, kind), result];
    default:
      return { error: "invalid file type" };
  }
}

export async function parsePdf(file) {
  const { ImageAnnotatorClient } = require("@google-cloud/vision").v1;
  const client = new ImageAnnotatorClient();
  const request = {
    requests: [
      {
        inputConfig: {
          mimeType: file.mimetype,
          content: file.data,
        },
        features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
      },
    ],
  };
  const [result] = await client.batchAnnotateFiles(request);

  const pages: Array<IPage> = [];
  result.responses[0].responses.forEach((result) =>
    pages.push({
      pageData: result.fullTextAnnotation.pages[0],
      textArray: result.fullTextAnnotation.text.split(/\r?\n/),
    })
  );

  return pages;
}

export async function parseImage(file) {
  const { ImageAnnotatorClient } = require("@google-cloud/vision");
  const client = new ImageAnnotatorClient();
  const result = await client.textDetection(file.data);
  const pages: Array<IPage> = [];
  result.forEach((result) =>
    pages.push({
      pageData: result.fullTextAnnotation.pages[0],
      textArray: result.fullTextAnnotation.text.split(/\r?\n/),
    })
  );
  return pages;
}

export interface IPage {
  pageData: any;
  textArray: Array<string>;
}
export const dispatch = (
  pages: Array<IPage>,
  kind: TKindOfDocument
): IEstablishment | ITrade | IVat | ICoc | IKyc | any => {
  switch (kind) {
    case "TRADE_LICENCE":
      return parseTradeLicense(pages);
    case "ESTABLISHMENT_ID":
      return parseEstablishmentId(pages);
    case "VAT_CERTIFICATE":
      return parseVatCertificate(pages);
    case "COC":
      return parseCoc(pages);
    case "KYC":
      return parseKyc(pages);
  }
};
