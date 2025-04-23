const express = require("express");
const puppeteer = require("puppeteer");
const fs = require("fs");

const router = express.Router();
function deleteFileAfterDelay(filePath, delay = 3 * 1000 * 60) {
  setTimeout(() => {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(`Error deleting file ${filePath}:`, err.message);
      } else {
        console.log(`File ${filePath} deleted successfully.`);
      }
    });
  }, delay);
}
router.post("/generate-pdf", async (req, res) => {
  try {
    const { url } = req.body;

    const browser = await puppeteer.launch({
      headless: "new",
      // args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-accelerated-2d-canvas", "--no-first-run", "--no-zygote", "--single-process", "--disable-gpu"],
    });
    const page = await browser.newPage();

    await page.goto(url, {
      waitUntil: "networkidle0",
    });

    await page.evaluate(() => {
      const mainContainer = document.querySelector(".main-container");
      if (mainContainer) {
        $(".btnRemove, .btnAdd, .btn-sort, .addElement,.add-item,.ui-resizable-handle,.pageButtons").hide();
        document.body.childNodes.forEach((node) => {
          if (node !== mainContainer && node.nodeType === Node.ELEMENT_NODE) {
            node.style.display = "none";
          }
        });
      }

      const pageElement = document.querySelector(".main-container .page");
      if (pageElement) {
        pageElement.style.margin = "0";
        pageElement.style.maxWidth = "8.5in";
        pageElement.style.maxHeight = "11in";
        pageElement.style.boxShadow = "none";
        pageElement.style.border = "none";
      }

      // Optional: Remove scrollbars or background if needed
      document.body.style.background = "#fff";
    });

    // 🖨️ Generate real text PDF, perfectly sized
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filePath = `uploads/resume-${timestamp}.pdf`;

    await page.pdf({
      path: filePath,
      format: "letter", // 8.5 x 11 inches
      printBackground: true,
      margin: {
        top: "0in",
        right: "0in",
        bottom: "0in",
        left: "0in",
      },
    });

    await browser.close();
    deleteFileAfterDelay(filePath);
    return res.status(200).json({ message: "PDF Generated", filePath });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error generating PDF", error: error.message });
  }
});

module.exports = router;
