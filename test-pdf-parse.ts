import pdfParse from "pdf-parse";
import { PDFDocument } from "pdf-lib";
import fs from "fs";

async function run() {
  try {
    console.log("Creating dummy PDF...");
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    page.drawText("Hello World from Studio GPT Test!");
    const pdfBytes = await pdfDoc.save();
    const PDFParser = require("pdf2json");
    
    console.log("Parsing PDF with pdf2json...");
    const pdfParser = new PDFParser(null, 1);
    
    pdfParser.on("pdfParser_dataError", (errData: any) => console.error(errData.parserError) );
    pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
        console.log("Extracted text:", pdfParser.getRawTextContent());
        console.log("SUCCESS");
    });
    
    pdfParser.parseBuffer(Buffer.from(pdfBytes));
  } catch (err) {
    console.error("FAILED:", err);
  }
}

run();
