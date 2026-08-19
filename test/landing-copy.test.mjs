import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const assetsIgnore = await readFile(new URL("../.assetsignore", import.meta.url), "utf8");
const renderedText = html
  .replace(/<script[\s\S]*?<\/script>/g, " ")
  .replace(/<[^>]+>/g, " ")
  .replaceAll("&amp;", "&")
  .replace(/\s+/g, " ")
  .trim();

test("landing and invite surfaces use the approved direct copy", () => {
  const approvedCopy = [
    "Run the whole tournament from one place.",
    "Set up the format, add players, assign courts, record scores, and share results as the tournament unfolds. It works for a casual club night or a full weekend draw.",
    "Pick the format",
    "Choose single or double elimination, round robin, ladder, or king of the court, with singles and doubles where the sport supports them.",
    "Keep everyone updated",
    "Invite players or viewers with a link. Everyone follows the same tournament, standings, and results.",
    "Reuse your players",
    "Add players once, reuse them in any tournament, and keep their wins, losses, and win rate.",
    "Switch devices without starting over",
    "Sign in on another device and your tournaments, players, and results are there.",
    "You’ve been invited to a TourneySmith tournament",
    "Open this invite in the app to view the tournament and respond.",
    "Open in app",
    "New to TourneySmith? Install the app, then open this invite again.",
  ];

  for (const copy of approvedCopy) {
    assert.ok(renderedText.includes(copy), `Missing approved copy: ${copy}`);
  }

  assert.ok(html.includes(
    "Run racquet-sport tournaments with TourneySmith. Set up formats, assign courts, record scores, and share results for padel, tennis, pickleball, badminton, squash, racquetball, and table tennis.",
  ));
  assert.ok(html.includes(
    "Set up racquet-sport tournaments, assign courts, record scores, and share results.",
  ));
});

test("landing and invite surfaces retire inaccurate or indirect copy", () => {
  const retiredCopy = [
    "Run your racquet-sport",
    "Every format",
    "Share & collaborate",
    "Invite players and co-organizers with a link.",
    "Players & stats",
    "add guests as placeholders",
    "Built for the cloud",
    "You're invited to a tournament",
    "Open the invite in the TourneySmith app to join.",
    "Open in TourneySmith",
    "Don't have the app yet? Install it, then tap the link again.",
  ];

  for (const copy of retiredCopy) {
    assert.ok(!renderedText.includes(copy), `Retired copy remains: ${copy}`);
  }
});

test("landing retains the approved slogan and product scope", () => {
  assert.ok(html.includes("Craft of running tournaments."));
  for (const sport of [
    "Padel",
    "Tennis",
    "Pickleball",
    "Badminton",
    "Squash",
    "Racquetball",
    "Table Tennis",
  ]) {
    assert.ok(html.includes(`<span>${sport}</span>`), `Missing sport: ${sport}`);
  }
});

test("copy contracts are excluded from deployed static assets", () => {
  assert.match(assetsIgnore, /^test$/m);
});
