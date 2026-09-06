# Feeding real content to the AI Tutor (RAG)

You asked: *"do I need to feed past papers? I only provided the links."* — **yes**,
and this doc explains exactly why, and walks through doing it.

## 1. Why the links aren't enough

Your app has two different tables that both sound like "past papers", and only one of them feeds the AI:

| Table | What's in it | Where it's used |
|---|---|---|
| `ExamPaperDocuments` | A **link** to a PDF (question paper + marking scheme), per year/medium. This is what you bulk-imported earlier (2015–2024). | The student **"Full papers" download page** only. |
| `PastPapers` | The **actual text** of one question, its model answer, and its explanation — one row per question. | The **AI Tutor's RAG grounding** (this is what got built in the last two commits). |

The AI can't open a PDF link and read it. `GetRelevantSyllabusContextAsync` and the "PAST PAPER REFERENCE" block only ever query `PastPapers` — and right now that table has essentially one placeholder row. So the marking-scheme grounding has almost nothing to draw from yet. Everything below is about populating `PastPapers` with real question text.

## 2. Two ways to add questions

### Option A — one at a time, with photo OCR (best for a handful)
1. Go to **Admin → Papers**.
2. Under the form, use **"Upload a question photo"** — take a photo of a question from a real past paper PDF and upload it. The AI transcribes the question text into the **Question text** field automatically (you can edit it if it misreads anything).
3. Type the **Answer** (the short final answer) and **Explanation** (the marking-scheme working) yourself, from the marking scheme PDF you already have linked in ExamPapers.
4. Fill in Year, Paper, Question #, Difficulty, Language, and pick the matching **Topic**.
5. Click **Add question**. The server computes its embedding automatically — no extra step.

This is the most accurate but slowest way — good for your first 10-20 questions to test everything works.

### Option B — bulk import (best once you're comfortable with the shape)
I just added a **"Bulk import (JSON array)"** box to **Admin → Papers**, right above the single-question form (same pattern as the Exam Papers tab already had). Paste a JSON array and click **Import all** — every item gets its embedding computed automatically, same as adding one at a time.

Each item needs this shape:
```json
{
  "year": 2023,
  "paper": "Paper I",
  "questionNumber": "5(a)",
  "questionText": "Differentiate \\(x^2 \\sin x\\) with respect to \\(x\\).",
  "answer": "\\(2x\\sin x + x^2\\cos x\\)",
  "explanation": "Apply the product rule: \\(\\frac{d}{dx}(uv) = u'v + uv'\\) with \\(u = x^2\\), \\(v = \\sin x\\). Step 1 (M1): \\(u' = 2x\\), \\(v' = \\cos x\\). Step 2 (A1): substitute to get \\(2x\\sin x + x^2\\cos x\\).",
  "difficulty": "Medium",
  "language": "English",
  "mathTopicId": 6
}
```

Paste an array of these (as many as you have typed up):
```json
[
  { "year": 2023, "paper": "Paper I", "questionNumber": "5(a)", "questionText": "...", "answer": "...", "explanation": "...", "difficulty": "Medium", "language": "English", "mathTopicId": 6 },
  { "year": 2022, "paper": "Paper II", "questionNumber": "3", "questionText": "...", "answer": "...", "explanation": "...", "difficulty": "Hard", "language": "English", "mathTopicId": 14 }
]
```

**Tip on `explanation`**: write it the way you want the AI to *cite* it — the prompt literally tells the model to "mirror its step/mark structure" when a matching past paper is found. If you write the explanation as labelled steps (`Step 1 (M1): ...`, `Step 2 (A1): ...`), the AI's own answers will start mirroring that same format for similar questions — this is the actual mechanism behind "answer in marking scheme form."

**Your current topic IDs** (from `GET /api/MathTopics` on your live DB, so `mathTopicId` in your JSON matches a real topic):

| id | name | id | name |
|---|---|---|---|
| 1 | Matrices | 13 | Kinematics |
| 2 | Basic Mathematics | 14 | Dynamics |
| 3 | Polynomials | 15 | Centre of Mass |
| 5 | Trigonometry | 16 | Work, Power & Energy |
| 6 | Calculus | 19 | Probability |
| 7 | Coordinate Geometry | 20 | Statistics |
| 8 | Series | 21 | Quadratic Equations and Functions |
| 9 | Binomial Expansion | 22 | Permutation and Combination |
| 10 | Complex Numbers | 12 | Vectors |

(These can shift if you add/remove topics — re-check `GET /api/MathTopics` if you're not sure.)

### What about questions with a diagram or graph?

Transcribing a diagram question to plain text loses the picture — so `PastPapers` now has a second, optional field: `questionImageUrl`. The AI's semantic search still only reads `questionText` (embeddings are text-only), but the actual diagram photo gets stored and shown to the student on the practice page.

- **Option A (single form)** already handles this for you: when you use the photo-upload button, the uploaded image's URL is captured automatically into `questionImageUrl` alongside the transcribed text — you don't do anything extra.
- **Option B (bulk JSON)** has no upload step, so if a question in your batch has a diagram, you can't get its image URL through the JSON box alone. Workflow: add that one question through Option A first (photo upload → auto-fills text + image), then bulk-import the rest of the batch (the ones without diagrams) through Option B.
- If the AI misreads a pure diagram with little/no text (e.g. "find angle θ" off a triangle picture), just type a short manual description into **Question text** yourself (e.g. `"See diagram — find angle θ"`) — the image is already attached regardless, and the search still has something to match on.

## 3. How to test it worked

1. Open the AI Tutor and ask a question close in topic to one you just added (doesn't need to be word-for-word identical — the matching is by meaning, not exact text).
2. Check for two things in the reply:
   - A **"Related past paper question(s)"** section below the AI's answer (this proves the embedding search found your new row).
   - The answer's **working broken into labelled steps** (`Step 1 (M1): ...`) — this proves the marking-scheme prompt rule is active.
3. If the AI explicitly says something like *"This is similar to 2023 Paper I Q5(a)"*, that's the full loop working end-to-end — it found your question, pulled its answer text into its own context, and cited it.

If related papers never show up, the two most likely reasons are: (a) not enough matching questions yet (only a couple of rows in the whole table, low odds of a close match), or (b) the topic doesn't overlap with what you've entered so far.

## 4. Where to go from here (optional, once the basics work)

These are refinements, not required to get started — the plan I gave earlier, kept here for reference:

1. **Add a relevance threshold.** Right now the top-2 matches always get injected, even if neither is a good match. Once you have more real questions in the table, it's worth adding a cosine-distance cutoff in `ChatController.cs` so a weak match gets skipped instead of cited as "similar."
2. **Embed on Question+Answer combined**, not just the question text, once you have enough volume — better grounding matches.
3. **Build up coverage deliberately**: rather than random questions, go topic by topic (e.g. all of Calculus first) so a student asking anything in that topic reliably gets a match, instead of sparse coverage across everything.
4. **Test with a checklist** of 5-10 real exam questions per topic once you've entered enough — confirm correct citations, and that marking-scheme formatting doesn't show up for non-exam-style concept questions (it shouldn't — the prompt already restricts it to "specific solvable problem" questions).

## 5. Worked example: adding your 2022 paper

Concretely, here's the order to actually do this for one paper:

1. **Open your source**: pull up the 2022 question paper PDF and its marking scheme PDF side by side (you already have both linked in Admin → Exam Papers).
2. **Go question by question**, sorting each into one of two piles as you go:
   - **Text-only** (algebra, calculus working, no picture needed) → save these for step 4.
   - **Has a diagram/graph** (vectors, forces diagrams, coordinate geometry sketches, statistics charts) → do these with Option A, right away, one at a time:
     - Admin → Papers → upload a photo of just that question from the PDF (a screenshot or phone photo both work) → the text auto-fills → correct anything OCR got wrong → type the Answer and Explanation from the marking scheme → pick Year `2022`, the matching Paper (I or II), Question #, Difficulty, Language, and Topic → **Add question**.
   - Repeat for each diagram question. Each one saves immediately (no batching needed for these).
3. **For each text-only question**, type up a JSON object like the example in section 2 — `year: 2022`, correct `paper`/`questionNumber`, the question text, answer, and a marking-scheme-style `explanation` (labelled `Step 1 (M1): ...` etc. so the AI learns to answer the same way).
4. **Paste all the text-only ones as one array** into the Bulk import box and click **Import all** — this is much faster than adding them one by one once you have several typed up.
5. **Verify**: go to `GET /api/PastPapers?year=2022` (or just check the Admin → Papers table, filter by eye) and confirm the count matches how many questions you intended to add, and that the diagram ones show 🖼️ in the Image? column.
6. **Test it**: ask the AI Tutor a question on a topic from the 2022 paper you just added, and check for the "Related past paper questions" section and marking-scheme-style steps, per section 3 above.

You don't need to do the whole paper in one sitting — importing in small batches (e.g. one topic's worth of questions at a time) and testing as you go is easier to debug than typing up 30+ questions before checking anything works.
