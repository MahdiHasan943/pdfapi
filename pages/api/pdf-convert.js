import puppeteer from "puppeteer";
import puppeteerCore from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "2mb", // Adjust if needed
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
    // Launch browser depending on environment
    const isProd = process.env.VERCEL_ENV === "production";

    browser = await (isProd
      ? puppeteerCore.launch({
          executablePath: await chromium.executablePath(),
          args: chromium.args,
          headless: chromium.headless,
          defaultViewport: chromium.defaultViewport,
        })
      : puppeteer.launch({
          headless: "new",
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        }));

    const page = await browser.newPage();

    // Set content and wait for network to be idle
    await page.setContent(html, { waitUntil: "networkidle0" });

    // Generate PDF buffer
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

    await browser.close();

    // Set proper headers for download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${title}.pdf"`);

    return res.status(200).send(pdfBuffer);
  } catch (error) {
    console.error("PDF generation error:", error);
    if (browser) await browser.close();
    return res.status(500).json({ error: "Failed to generate PDF" });
  }
}
