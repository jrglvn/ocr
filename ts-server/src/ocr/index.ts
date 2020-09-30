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
  | "TRADE_LICENSE"
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
  switch (file.mimetype) {
    case "application/pdf":
    case "image/gif":
    case "image/tiff":
      const pdfResult = await parsePdf(file);
      return [dispatch(pdfResult, kind), pdfResult];
      break;
    case "image/jpeg":
    case "image/png":
      const imageResult = await parseImage(file);
      return [dispatch(imageResult, kind), imageResult];
      break;
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
  return result.responses[0].responses;
}

export async function parseImage(file) {
  const { ImageAnnotatorClient } = require("@google-cloud/vision");
  const client = new ImageAnnotatorClient();
  const result = await client.textDetection(file.data);
  return result;
}

export const dispatch = (
  result: any,
  kind: TKindOfDocument
): IEstablishment | ITrade | IVat | ICoc | IKyc => {
  let pages = result[0].fullTextAnnotation.pages;
  const textArray = result[0].fullTextAnnotation.text.split(/\r?\n/);

  switch (kind) {
    case "TRADE_LICENSE":
      return parseTradeLicense(textArray);
    case "ESTABLISHMENT_ID":
      return parseEstablishmentId(textArray);
    case "VAT_CERTIFICATE":
      return parseVatCertificate(textArray, pages);
    case "COC":
      return parseCoc(textArray, pages);
    case "KYC":
      return parseKyc(textArray, pages);
  }
};
