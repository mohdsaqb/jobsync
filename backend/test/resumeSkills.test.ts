import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { extractSkills, skillOverlapScore } from "../src/services/skillMatch.service.js";
import { extractResumeText } from "../src/services/textExtraction.service.js";
import { analyzeResume } from "../../frontend/lib/api.ts";

test("recognizes common JavaScript framework spellings", () => {
  assert.deepEqual(
    extractSkills("ReactJS, NodeJS, NextJS, TailwindCSS"),
    new Set(["react", "node.js", "next.js", "tailwind css"]),
  );
});

test("normalizes aliases to the same skills for job overlap", () => {
  const resume = extractSkills("React.js, NodeJS, Postgres, Amazon Web Services, K8s");
  const job = extractSkills("React, Node.js, PostgreSQL, AWS, Kubernetes");
  assert.deepEqual(resume, job);
  assert.equal(skillOverlapScore(resume, job), 1);
});

test("recognizes wrapped, unicode, and PDF-formatted skill names", () => {
  const skills = extractSkills("ＲｅａｃｔＪＳ • Spring\nBoot • Tailwind\u00a0CSS • Power\tBI • scikit–learn • Type\u00adScript • Node\u200bJS");
  for (const skill of ["react", "spring boot", "tailwind css", "power bi", "scikit-learn", "typescript", "node.js"]) {
    assert.ok(skills.has(skill), `Missing ${skill}`);
  }
});

test("detects programming fundamentals and skills beyond web development", () => {
  const skills = extractSkills("C, C++, Linux, OOP, DSA, Excel, PowerBI, AutoCAD, SolidWorks, project management");
  for (const skill of ["c", "c++", "linux", "object oriented programming", "data structures", "algorithms", "excel", "power bi", "autocad", "solidworks", "project management"]) {
    assert.ok(skills.has(skill), `Missing ${skill}`);
  }
});

test("does not detect skill substrings or confuse C, C++, and C#", () => {
  assert.deepEqual(extractSkills("reactive, JavaScripted, PostgreSQLish, going, escort"), new Set());
  assert.deepEqual(extractSkills("C++ / C#"), new Set(["c++", "c#"]));
  assert.deepEqual(extractSkills("C+++, C#Sharp"), new Set());
});

test("retains existing canonical skills and deduplicates aliases", () => {
  assert.deepEqual(
    extractSkills("React, reactjs, REACT.JS, Python, Git, Node.js, .NET, C#"),
    new Set(["react", "python", "git", "node.js", ".net", "c#"]),
  );
  assert.deepEqual(extractSkills(""), new Set());
  assert.equal(skillOverlapScore(new Set(), new Set()), 0);
});

function resumePdf(): Buffer {
  const stream = "BT /F1 12 Tf 50 750 Td (Skills: ReactJS, NodeJS, NextJS, TailwindCSS, Python) Tj ET\n";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}endstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 6\n0000000000 65535 f \n`;
  pdf += offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf);
}

test("detects skills from an uploaded PDF's extracted text", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "jobsync-resume-"));
  try {
    const filePath = path.join(directory, "resume.pdf");
    await writeFile(filePath, resumePdf());
    const text = await extractResumeText(filePath, "application/pdf");
    assert.deepEqual(extractSkills(text), new Set(["react", "node.js", "next.js", "tailwind css", "python"]));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("upload client preserves detected skills and distinguishes missing results from an empty list", async () => {
  const originalFetch = globalThis.fetch;
  const file = new File([resumePdf()], "resume.pdf", { type: "application/pdf" });
  try {
    for (const returnedSkills of [["react", "node.js"], [], undefined, null]) {
      globalThis.fetch = async (url, options) => {
        assert.equal(url, "/api/resume/analyze");
        assert.equal(options?.method, "POST");
        assert.deepEqual([...(options?.body as FormData).keys()], ["resume"]);
        const uploaded = (options?.body as FormData).get("resume") as File;
        assert.equal(uploaded.name, "resume.pdf");
        return Response.json({ matches: [], resumeText: "Skills: ReactJS, NodeJS", resumeSkills: returnedSkills });
      };
      const result = await analyzeResume(file);
      assert.deepEqual(result.resumeSkills, returnedSkills ?? null);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});
