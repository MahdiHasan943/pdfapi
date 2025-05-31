import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "2mb", // allow large HTML
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { html, title = "document" } = req.body;

  if (!html || typeof html !== "string") {
    return res.status(400).json({ error: "Missing or invalid HTML content" });
  }

  let browser;

  try {
    const executablePath = await chromium.executablePath();

    if (!executablePath) {
      throw new Error("Chromium executablePath not found");
    }

    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath,
      headless: chromium.headless,
      defaultViewport: chromium.defaultViewport,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "10mm",
        bottom: "10mm",
        left: "10mm",
        right: "10mm",
      },
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${title}.pdf"`);

    return res.status(200).send(pdfBuffer);
  } catch (error) {
    console.error("PDF generation error:", error);
    return res
      .status(500)
      .json({ error: "Failed to generate PDF", details: error.message });
  } finally {
    if (browser) await browser.close();
  }
}
