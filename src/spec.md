# Specification

## Summary
**Goal:** Enable students to download branded PDF reports of their test results with detailed performance breakdown.

**Planned changes:**
- Install and configure a PDF generation library (jsPDF or react-pdf) in the frontend
- Create a PDF export utility module that generates formatted PDFs with Concept Delta branding
- Design PDF layout with header (logo, test name, student name, date, score), score summary section (total/percentage/sections/time/performance indicator), question-by-question breakdown (number, text, answers, correctness, marks), statistics summary (attempted/correct/incorrect/accuracy), and footer (@coep_conceptdelta2031, page numbers)
- Add "Export PDF" button on ResultPage that triggers PDF download with filename format "ConceptDelta_TestName_StudentName_Date.pdf"
- Implement error handling for PDF generation failures

**User-visible outcome:** Students can click an "Export PDF" button on their test results page to download a professionally formatted PDF report with their score, detailed question breakdown, and statistics, branded with the Concept Delta logo and social media handle.
