import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const app = fs.readFileSync(path.join(root, "public", "demo", "app.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "public", "demo", "styles.css"), "utf8");

function functionBlock(name, nextName) {
  const start = app.indexOf(`  function ${name}(`);
  const end = app.indexOf(`  function ${nextName}(`, start + 1);
  assert.ok(start >= 0, `${name} is missing`);
  assert.ok(end > start, `${name} must precede ${nextName}`);
  return app.slice(start, end);
}

test("Showcase Mode proof exits arm the next guided beat instead of resetting the tour", () => {
  assert.match(app, /tourSlide: 0, tourResumeSlide: null/);

  const proof = functionBlock("runTourProof", "openTour");
  assert.match(
    proof,
    /closeTour\(\{\s*resumeSlide: Math\.min\(state\.tourSlide \+ 1, tourSlides\.length - 1\),\s*\}\)/,
  );

  const open = functionBlock("openTour", "closeTour");
  assert.match(open, /Number\.isInteger\(state\.tourResumeSlide\)/);
  assert.match(open, /state\.tourResumeSlide : 0/);
  assert.match(open, /state\.tourResumeSlide = null/);
  assert.doesNotMatch(open, /state\.tourSlide = 0;/);

  const close = functionBlock("closeTour", "rememberDialogFocus");
  assert.match(close, /Number\.isInteger\(options\.resumeSlide\)/);
  assert.match(close, /options\.resumeSlide : state\.tourSlide/);
  assert.match(close, /state\.tourResumeSlide = Math\.max\(0, Math\.min\(/);
});

test("all three Showcase Mode entry points visibly disclose the resumable slide", () => {
  const launchers = functionBlock("updateTourLaunchers", "runTourProof");
  assert.match(launchers, /var step = canResume \? \(state\.tourResumeSlide \+ 1\) \+ "\/" \+ total/);
  assert.match(launchers, /"RESUME " \+ step : "SHOWCASE MODE"/);
  assert.match(launchers, /"RESUME SHOWCASE · " \+ step : "START THE 60-SECOND SHOWCASE"/);
  assert.match(launchers, /"Resume Showcase Mode at slide " \+ \(state\.tourResumeSlide \+ 1\)/);
  assert.equal((launchers.match(/tour-resume-ready/g) || []).length, 3);

  assert.match(
    styles,
    /\.mike-button\.tour-resume-ready,\s*#footerPitch\.tour-resume-ready\s*\{[\s\S]*?border-color: var\(--acid\)/,
  );
  assert.match(styles, /\.mike-button\.tour-resume-ready span\s*\{[\s\S]*?background: var\(--acid\)/);
  assert.match(styles, /#pitchTourButton\.tour-resume-ready\s*\{[\s\S]*?box-shadow:/);
});
