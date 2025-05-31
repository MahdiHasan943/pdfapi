import React, { useState } from "react";

export default function PDFForm() {
  const [html, setHtml] = useState(
    "<h1>Hello PDF</h1><p>This is HTML to PDF</p>"
  );
  const [title, setTitle] = useState("my-pdf-file");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/pdf-convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html, title }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        HTML Content:
        <textarea
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          rows={10}
          style={{ width: "100%" }}
        />
      </label>

      <label>
        PDF Title (optional):
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="my-pdf-file"
        />
      </label>

      <button type="submit" disabled={loading}>
        {loading ? "Generating PDF..." : "Create PDF"}
      </button>
    </form>
  );
}
