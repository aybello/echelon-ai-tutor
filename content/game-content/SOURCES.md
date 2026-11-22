# Grounding sources for the Echelon deep games build

Inventory run: 2026-11-21 (Drive search) by the build coordinator.

## Headline finding: the connected Drive holds no textbooks

The only Google Drive this environment can reach is the AfroPuppyYoga account
(afropuppyyoga@gmail.com). The Drive connector supports one account per
connector; selecting another account returns "account selection is unavailable
for google_drive". That Drive was searched exhaustively on 2026-11-21:

- All 210 PDFs listed and name-screened (full list reviewed by eye).
- All 336 folders listed and name-screened.
- Name searches: wastewater, water treatment, textbook, manual, operator,
  Metcalf, WEF, AWWA, Tchobanoglous, Crittenden, Spellman, Sacramento,
  Water Programs, MOP, Operation of, book, edition.
- Full-text searches: "activated sludge" (3 hits, none a textbook),
  "Metcalf" (0 hits), "wastewater" (54 hits, all Echelon business documents,
  pitch decks, reports, and meeting notes).
- Archives (4 zips, all photos and business cards) and all 20 Word documents
  (resumes and APY or Echelon reports) screened.

Result: no water or wastewater textbooks, manuals, or operator study guides
exist in this Drive. Ay's textbooks are almost certainly in a different Google
account's Drive (his personal account, or the afropuppyyogaofficial@gmail.com
account the shared browser uses), which this connector cannot read.

ACTION NEEDED (for Ay or the parent agent): share the textbook files or their
folder with afropuppyyoga@gmail.com, or download them through the signed-in
browser, so the build can cite them directly. Until then, game tasks are
grounded in the repo's own source citations (section 3 below), which are the
same published references the existing question banks already use.

## 1. Water and wastewater items found in the connected Drive

| Title | fileId | Topic | Size |
|---|---|---|---|
| Building-Canadas-Next-Generation-of-Certified-Water-and-Wastewater-Operators.pdf | 1J6aLL08B4lzjQweRxtkj09W21wUoyxUF | Workforce and certification report, Canada | 2,365,608 bytes |
| ECHELON INSTITUTE, STANDARD COURSE PACKAGE (Google Doc, in the "Course Content" folder 1ooozBA3wuXClYGl4olNheOfS6NdOZbnH) | 1-bQtBEQfpyadRaDjsfW4_tzuNdx9w3LPlfWwIcMjiTI | Echelon course package structure standard | 7,666 bytes (exported copy: echelon-standard-course-package.txt in this folder) |
| Water Treatment Plant Design Blueprint (MakerSuite prompt file) | 16EbxK4eoYxfqWQ0I4QZqjGniNetPZzSA | AI prompt artifact, not a textbook | 128,481 bytes |

Neither of the first two is a technical textbook. The Standard Course Package
doc is still useful to the build: it defines how Echelon packages a course.

## 2. Textbook candidates: NOT FOUND (searched, absent)

- Metcalf and Eddy, Wastewater Engineering: no match by name or full text.
- WEF Manuals of Practice (MOP series): no match.
- AWWA manuals and operator study guides: no match.
- Sacramento State (Office of Water Programs) operator courses: no match.
- Crittenden, Water Treatment: Principles and Design: no match.
- Any EPUB: zero files of mimeType application/epub+zip in the Drive.

## 3. Grounding fallback in force until the textbooks arrive

The echelon-ai-tutor repo's question banks already carry per-item source
citations (sourceTitle, sourceReference, sourceUrl on every record). Game
tasks for a course will cite the same published sources the bank for that
course uses, for example the US EPA Small Drinking Water Systems Handbook
cited throughout the OIT bank, plus Ontario OWWCO and WPI Need-to-Know
blueprint documents referenced in the repo. Calculation methods follow the
worked-example conventions already present in the banks (formula field on
every calculation record). Where a textbook method becomes available later,
tasks will be re-cited to it in a revision pass.

## 4. Downloads made

- ECHELON INSTITUTE, STANDARD COURSE PACKAGE, exported to
  echelon-standard-course-package.txt in this folder (4,424 bytes of text).
  Downloaded because it defines the course packaging standard for the build.
- Nothing else downloaded. Per instructions, no bulk download was attempted.
