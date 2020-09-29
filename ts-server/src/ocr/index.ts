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

export async function parsePdf(
  file: {
    data: any;
    mimetype: "application/pdf" | "image/tiff" | "image/gif";
  },
  kind: TKindOfDocument
) {
  const { ImageAnnotatorClient } = require("@google-cloud/vision").v1;
  const client = new ImageAnnotatorClient();

  async function batchAnnotateFiles() {
    const inputConfig = {
      mimeType: file.mimetype,
      content: file.data,
    };
    const features = [{ type: "DOCUMENT_TEXT_DETECTION" }];
    const fileRequest = {
      inputConfig: inputConfig,
      features: features,
    };
    const request = {
      requests: [fileRequest],
    };
    const [result] = await client.batchAnnotateFiles(request);
    return result.responses[0].responses;
  }

  let result = await batchAnnotateFiles();
  // let pages = result[0].fullTextAnnotation.pages;

  // const textToArray = result[0].fullTextAnnotation.text.split(/\r?\n/);
  return result;
  // return [dispatch(kind, textToArray, pages), result];
}

export async function parseImage(file, kind: TKindOfDocument) {
  const vision = require("@google-cloud/vision");
  const client = new vision.ImageAnnotatorClient();
  const [result] = await client.textDetection(file.data);
  return result;
}

export const dispatch = (
  kind: TKindOfDocument,
  data: Array<string>,
  pages: any
): IEstablishment | ITrade | IVat | ICoc | IKyc => {
  switch (kind) {
    case "TRADE_LICENSE":
      return parseTradeLicense(data);
    case "ESTABLISHMENT_ID":
      return parseEstablishmentId(data);
    case "VAT_CERTIFICATE":
      return parseVatCertificate(data, pages);
    case "COC":
      return parseCoc(data, pages);
    case "KYC":
      return parseKyc(data, pages);
  }
};
