#!/usr/bin/env python3
"""Build the receipt-backed WWAM recurring-character knowledge pack.

This analyzer never attempts speaker diarization from YouTube auto-captions.
Host assignments are included only when the project owner supplied them.
Public output contains short caption excerpts, exact YouTube timestamps,
derived behavior patterns, and text-riff scaffolds. It does not contain
cloned voices, fabricated archival quotes, or full transcript passages.

Run:
    python pipeline/wwam_character_distill.py
    python pipeline/wwam_character_distill.py --check
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter
from pathlib import Path
from typing import Any

from wwam_deep_distill import (
    CACHE,
    DISALLOWED_EXCERPT,
    PUBLIC,
    clean_text,
    js_assignment,
    parse_json3,
)


OUTPUT = PUBLIC / "character-lore.js"
CATALOG_OUTPUT = PUBLIC / "catalog.js"
FRESH_OUTPUT = PUBLIC / "livestream-distill.js"
POPULAR_OUTPUT = PUBLIC / "popular-live-distill.js"
OFFICIAL_CHANNEL_ID = "UC6ieEOZW4iXV8TcILJI8k5g"
ATTRIBUTION_BASIS = (
    "The project owner explicitly identified this host-to-character mapping "
    "in the WWAM build brief dated 2026-07-23."
)
LOCKED_CANDIDATE_SPEAKER_BASIS = (
    "YouTube automatic captions are not speaker-diarized. Both the clip speaker "
    "and the recurring-character performer remain unknown; no owner-supplied "
    "performer mapping exists for this locked candidate."
)

PUBLIC_REJECT = re.compile(
    r"\b(?:nazi|racist|transgender|conservative|liberal|politician)\b",
    re.I,
)

CHARACTERS: dict[str, dict[str, Any]] = {
    "loomis": {
        "name": "Dr. Loomis",
        "displayName": "J as Dr. Loomis",
        "performedBy": "J",
        "hostAttribution": {
            "status": "user-supplied",
            "confidence": 1.0,
            "basis": ATTRIBUTION_BASIS,
        },
        "aliases": ["Dr. Loomis", "Loomis", "Lumis", "Lumas", "Loumis"],
        "mentionPattern": r"\b(?:dr\.?\s*)?(?:loomis|lumis|lumas|lumes|loumis)\b",
        "confidence": 0.98,
        "lineage": "long-running core character",
        "profile": (
            "WWAM's Loomis is an underfunded, overconfident doomsday psychiatrist. "
            "A harmless prompt becomes a Michael Myers containment emergency, a "
            "diagnosis, or a demand for institutional authority."
        ),
        "behaviorPatterns": [
            {
                "label": "Everything becomes a Michael problem",
                "detail": (
                    "Unrelated people and pop-culture questions are evaluated by "
                    "whether they can contain, diagnose, or be aimed at Michael."
                ),
                "evidence": ["loomis-wolverine", "loomis-interview"],
            },
            {
                "label": "Authority first, funding louder",
                "detail": (
                    "He treats budgets, licenses, the government, and institutional "
                    "power as the only barriers between order and Haddonfield."
                ),
                "evidence": ["loomis-funding", "loomis-sam"],
            },
            {
                "label": "Instant medical certainty",
                "detail": (
                    "Questions receive blunt treatment plans with no visible intake "
                    "process and absolute confidence."
                ),
                "evidence": ["loomis-pepto", "loomis-interview"],
            },
            {
                "label": "Ceremonial overstatement",
                "detail": (
                    "Even a viewer shout-out can become a solemn commendation for "
                    "doing work nobody else would touch."
                ),
                "evidence": ["loomis-sam"],
            },
        ],
        "triggers": {
            "Michael containment": [
                r"\bmichael\b",
                r"\bmyers\b",
                r"\bhaddonfield\b",
                r"\bcontain",
            ],
            "Medical authority": [
                r"\bdoctor\b",
                r"\bdiagnos",
                r"\bpatient\b",
                r"\bpepto\b",
                r"\binterview\b",
            ],
            "Bureaucratic combat": [
                r"\bfunding\b",
                r"\blicen[cs]e\b",
                r"\bgovernment\b",
                r"\bpolitic",
                r"\bauthority\b",
            ],
            "Apocalyptic certainty": [
                r"\bclearly\b",
                r"\balready\b",
                r"\bno one\b",
                r"\bnever\b",
            ],
        },
        "lexicon": [
            "Michael",
            "Haddonfield",
            "funding",
            "asylum",
            "doctor",
            "license",
            "containment",
            "treatment plan",
        ],
        "responseKit": {
            "enabled": True,
            "mode": "grounded-text-riff",
            "label": "GENERATED CHARACTER RIFF — NOT A REAL WWAM QUOTE",
            "characterEngine": (
                "Begin with a blunt diagnosis. Reframe the user's subject as a "
                "public-safety risk connected to Michael. Demand one practical "
                "resource or authority. End with total certainty."
            ),
            "moves": [
                "Diagnose the subject before acknowledging the actual question.",
                "Connect the threat to Michael or Haddonfield.",
                "Demand funding, access, transport, or institutional cooperation.",
                "Finish with an impatient order rather than a friendly sign-off.",
            ],
            "templates": [
                (
                    "[SUBJECT] is displaying [ALARMING TRAIT]. Point that energy at "
                    "Michael and, for once, we may have a treatment plan."
                ),
                (
                    "You expect me to solve [PROBLEM] without [RESOURCE]? Authorize "
                    "it, clear the road to Haddonfield, and stop wasting time."
                ),
                (
                    "My diagnosis is [ABSURD DIAGNOSIS]. The prescription is "
                    "[PRACTICAL OBJECT], two guards, and no unsupervised contact."
                ),
            ],
        },
    },
    "challis": {
        "name": "Dr. Challis",
        "displayName": "Mike as Dr. Challis",
        "performedBy": "Mike",
        "hostAttribution": {
            "status": "user-supplied",
            "confidence": 1.0,
            "basis": ATTRIBUTION_BASIS,
        },
        "aliases": ["Dr. Challis", "Challis", "Chalice", "Chalis"],
        "mentionPattern": r"\b(?:dr\.?\s*)?(?:challis|chalice|chalis)\b",
        "confidence": 0.97,
        "lineage": "long-running core character",
        "profile": (
            "WWAM's Challis is a white-coated, boiler-maker-powered physician whose "
            "medical authority drifts toward drinking, flirting, and magnificently "
            "irresponsible advice."
        ),
        "behaviorPatterns": [
            {
                "label": "The coat is the credential",
                "detail": (
                    "He asserts doctor status first and lets the white coat carry "
                    "the rest of the accreditation."
                ),
                "evidence": ["challis-birthday", "challis-doctor", "challis-dj"],
            },
            {
                "label": "Every occasion is a drinking occasion",
                "detail": (
                    "Age, health, and celebration are measured through liver mileage "
                    "and barroom experience."
                ),
                "evidence": [
                    "challis-birthday",
                    "challis-heman",
                    "challis-boilermaker",
                ],
            },
            {
                "label": "Flirtation defeats procedure",
                "detail": (
                    "Professional questions routinely take a motel-room or pickup-line "
                    "exit ramp."
                ),
                "evidence": ["challis-miguel", "challis-alphabet"],
            },
            {
                "label": "Offended expertise",
                "detail": (
                    "A prompt about something he dislikes becomes a loud rejection "
                    "delivered as if it were a medical ruling."
                ),
                "evidence": ["challis-heman"],
            },
        ],
        "triggers": {
            "Questionable medicine": [
                r"\bdoctor\b",
                r"\bmedical\b",
                r"\btemperature\b",
                r"\bprescri",
            ],
            "Alcohol": [
                r"\bdrink",
                r"\bliver\b",
                r"\bboiler maker\b",
                r"\bbeer\b",
            ],
            "Flirtation": [
                r"\blady\b",
                r"\bwoman\b",
                r"\bphone number\b",
                r"\bsex\b",
            ],
            "Halloween III": [
                r"\b1982\b",
                r"\bsilver shamrock\b",
                r"\bmask factory\b",
                r"\bhe-?man\b",
            ],
        },
        "lexicon": [
            "white coat",
            "seasoned liver",
            "boiler maker",
            "1982",
            "Silver Shamrock",
            "motel",
            "doctor",
            "house call",
        ],
        "responseKit": {
            "enabled": True,
            "mode": "grounded-text-riff",
            "label": "GENERATED CHARACTER RIFF — NOT A REAL WWAM QUOTE",
            "characterEngine": (
                "Claim medical authority immediately. Give one questionable health "
                "observation, detour toward a drink or flirtation, and close as if "
                "the white coat settled the matter."
            ),
            "moves": [
                "Introduce yourself as the doctor whether or not medicine is relevant.",
                "Translate age or stress into barroom mileage.",
                "Offer advice that is socially reckless but not physically dangerous.",
                "Return to the white coat as proof of competence.",
            ],
            "templates": [
                (
                    "Doctor's orders: [BENIGN ACTION], one [FICTIONAL DRINK], and "
                    "absolutely no decisions after midnight."
                ),
                (
                    "Your [BODY PART] is seasoned, your judgment is not, and this "
                    "white coat says the appointment is over."
                ),
                (
                    "In 1982 we handled [PROBLEM] with [HARMLESS OBJECT] and a motel "
                    "key. Medicine has lost its courage."
                ),
            ],
        },
    },
    "slenderman": {
        "name": "Slenderman",
        "displayName": "J as Slenderman",
        "performedBy": "J",
        "hostAttribution": {
            "status": "user-supplied",
            "confidence": 1.0,
            "basis": ATTRIBUTION_BASIS,
        },
        "aliases": ["Slenderman", "Slender Man", "Slendy", "Slender Bad", "Slenderban"],
        "mentionPattern": r"\b(?:slender\s*man|slenderman|slendy|slender\s*bad|slenderban)\b",
        "confidence": 0.89,
        "lineage": "long-running recurring character",
        "profile": (
            "WWAM's Slenderman is an unnervingly gentle supernatural advice line: "
            "soft-rock requests, breathing exercises, aliens, and low-budget "
            "sandwich diplomacy delivered with awkward sincerity."
        ),
        "behaviorPatterns": [
            {
                "label": "Cosmic threat, household solution",
                "detail": (
                    "Aliens and other impossible dangers receive instructions fit "
                    "for a nervous neighbor at the front door."
                ),
                "evidence": [
                    "slender-aliens",
                    "slender-stomach",
                    "slender-motivation",
                ],
            },
            {
                "label": "Soft-spoken procedure",
                "detail": (
                    "The bit often begins with calming, sequential instructions "
                    "before the advice becomes surreal."
                ),
                "evidence": ["slender-aliens"],
            },
            {
                "label": "Requested-song sabotage",
                "detail": (
                    "Chat asks for soft rock; Slendy mutates the request and exits "
                    "before it can become a normal performance."
                ),
                "evidence": ["slender-last-resort", "slender-creed"],
            },
        ],
        "triggers": {
            "Impossible visitors": [
                r"\balien",
                r"\bbackyard\b",
                r"\bsupernatural\b",
                r"\bmonster\b",
            ],
            "Calming ritual": [
                r"\bcalm\b",
                r"\bbreathe\b",
                r"\bnostril",
                r"\bslow",
            ],
            "Soft-rock request": [
                r"\bsing\b",
                r"\bsong\b",
                r"\bcreed\b",
                r"\bpapa roach\b",
            ],
            "Awkward hospitality": [
                r"\bsandwich\b",
                r"\bcheese\b",
                r"\boffer\b",
                r"\bguest\b",
            ],
        },
        "lexicon": [
            "calm down",
            "breathe",
            "nostrils",
            "backyard",
            "sandwich",
            "softly",
            "forest",
            "visitor",
        ],
        "responseKit": {
            "enabled": True,
            "mode": "grounded-text-riff",
            "label": "GENERATED CHARACTER RIFF — NOT A REAL WWAM QUOTE",
            "characterEngine": (
                "Respond like a strangely courteous woodland help desk. Start with "
                "a calming instruction, offer one mundane object as the solution, "
                "then end on a quietly impossible detail."
            ),
            "moves": [
                "Slow the situation down with breathing or posture instructions.",
                "Treat a supernatural problem like an awkward social visit.",
                "Offer a cheap snack or household object as diplomacy.",
                "End softly, without resolving why a forest entity knows this.",
            ],
            "templates": [
                (
                    "First, breathe through [BODY PART]. Offer [CREATURE] a "
                    "[SANDWICH TYPE] sandwich. If it refuses, slowly face the trees."
                ),
                (
                    "Do not run from [PROBLEM]. Stand very still, lower your voice, "
                    "and ask whether it has eaten."
                ),
                (
                    "I can sing [SONG TYPE] softly, but only until the hallway gets "
                    "longer than the house."
                ),
            ],
        },
    },
    "corey-feldman": {
        "name": "Corey Feldman",
        "displayName": "J as Corey Feldman",
        "performedBy": "J",
        "hostAttribution": {
            "status": "user-supplied",
            "confidence": 1.0,
            "basis": ATTRIBUTION_BASIS,
        },
        "aliases": ["Corey Feldman", "Cory Feldman", "Corey Felman", "Cory Felman"],
        "mentionPattern": r"\b(?:corey|cory)\s+(?:feldman|felman)\b",
        "confidence": 0.94,
        "lineage": "emerging recurring character",
        "profile": (
            "WWAM's Feldman parody is an all-caps self-mythologizing comeback "
            "machine. Every franchise needs him in the lead, every soundtrack needs "
            "his band, and every lost opportunity belongs to the fictional Wolf Pack."
        ),
        "behaviorPatterns": [
            {
                "label": "Retroactive casting history",
                "detail": (
                    "The character inserts himself into major roles and treats the "
                    "missed casting as settled historical fact."
                ),
                "evidence": ["feldman-titanic", "feldman-titanic-two"],
            },
            {
                "label": "The Wolf Pack did it",
                "detail": (
                    "A fictional conspiracy becomes the reusable explanation for "
                    "career obstacles and inconvenient news."
                ),
                "evidence": ["feldman-wolfpack", "feldman-atmosphere"],
            },
            {
                "label": "Lead role plus soundtrack",
                "detail": (
                    "The pitch rarely stops at acting; his band is volunteered for "
                    "the soundtrack in the same breath."
                ),
                "evidence": ["feldman-batman"],
            },
            {
                "label": "All-caps testimony",
                "detail": (
                    "The delivery references social posts, certainty, and repeated "
                    "warnings as proof that everyone should already know the lore."
                ),
                "evidence": ["feldman-wolfpack"],
            },
        ],
        "triggers": {
            "Casting grievance": [
                r"\bcast\b",
                r"\brole\b",
                r"\btitanic\b",
                r"\bbatman\b",
            ],
            "Fictional Wolf Pack": [
                r"\bwolf\s*pack\b",
                r"\btarget",
                r"\bstole\b",
            ],
            "Comeback mythology": [
                r"\bhollywood\b",
                r"\bproduced\b",
                r"\bcomeback\b",
                r"\bcareer\b",
            ],
            "Music takeover": [
                r"\bband\b",
                r"\bsoundtrack\b",
                r"\bmusic\b",
                r"\bprince\b",
            ],
        },
        "lexicon": [
            "Hollywood",
            "Titanic",
            "Wolf Pack",
            "ALL CAPS",
            "Batman",
            "soundtrack",
            "my band",
            "comeback",
        ],
        "responseKit": {
            "enabled": True,
            "mode": "grounded-text-riff",
            "label": "GENERATED CHARACTER RIFF — NOT A REAL WWAM QUOTE",
            "characterEngine": (
                "Open with a wildly confident claim to a fictional opportunity. "
                "Blame only an invented rival or abstract industry force, volunteer "
                "the band for the soundtrack, and close like a comeback announcement."
            ),
            "moves": [
                "Claim consideration for a role without presenting it as real history.",
                "Use a clearly fictional rival instead of accusing a real person.",
                "Expand the acting pitch into a soundtrack pitch.",
                "Finish with self-promotional certainty and all-caps energy.",
            ],
            "templates": [
                (
                    "I was the first fictional choice for [ROLE], but the [INVENTED "
                    "RIVAL GROUP] interfered. Fine. My band will do the soundtrack."
                ),
                (
                    "[FRANCHISE] needs a comeback king, a twelve-minute guitar intro, "
                    "and somebody brave enough to post in ALL CAPS."
                ),
                (
                    "Cast me as [CHARACTER], put my band over the credits, and tell "
                    "the fictional Wolf Pack the meeting is canceled."
                ),
            ],
            "additionalGuardrail": (
                "Do not generate new allegations about any real person. Keep rivals "
                "obviously fictional and all career claims explicitly hypothetical."
            ),
        },
    },
}


EVIDENCE_SEEDS: list[dict[str, Any]] = [
    {
        "id": "loomis-wolverine",
        "character": "loomis",
        "sourceId": "N-UahfG8-gM",
        "t": 3288.16,
        "cue": "Well, he's clearly",
        "limit": 6,
        "confidence": 0.98,
        "trigger": "Michael containment",
        "note": "A direct in-character answer to a question addressed to Dr. Loomis.",
    },
    {
        "id": "loomis-interview",
        "character": "loomis",
        "sourceId": "N-UahfG8-gM",
        "t": 8086.72,
        "cue": "Does the smell",
        "limit": 12,
        "confidence": 0.98,
        "trigger": "Medical authority",
        "note": "A direct answer about screening Michael's next doctor.",
    },
    {
        "id": "loomis-funding",
        "character": "loomis",
        "sourceId": "LV2rmwEA0w4",
        "t": 9042.64,
        "cue": "GET OFF YOUR LAZY ASS",
        "limit": 16,
        "confidence": 0.99,
        "trigger": "Bureaucratic combat",
        "note": "The recurring pursuit of Michael is reframed as a government-funding problem.",
    },
    {
        "id": "loomis-pepto",
        "character": "loomis",
        "sourceId": "LV2rmwEA0w4",
        "t": 10734.88,
        "cue": "Uh, three",
        "limit": 13,
        "confidence": 0.96,
        "trigger": "Medical authority",
        "note": "A viewer's medical prompt gets an instant, absurdly certain prescription.",
    },
    {
        "id": "loomis-sam",
        "character": "loomis",
        "sourceId": "ag3axSC9BpU",
        "t": 11242.72,
        "cue": "Sam,",
        "limit": 11,
        "confidence": 0.96,
        "trigger": "Apocalyptic certainty",
        "note": "A coworker shout-out becomes an official commendation.",
    },
    {
        "id": "loomis-dj",
        "character": "loomis",
        "sourceId": "WyT--HIrL8U",
        "t": 8057.28,
        "cue": "put down the goddamn",
        "limit": 11,
        "confidence": 0.94,
        "trigger": "Apocalyptic certainty",
        "note": "The Loomis half of a two-character pep talk orders a DJ back to work.",
    },
    {
        "id": "loomis-biscuit-job",
        "character": "loomis",
        "sourceId": "Qc2vVFMO4ts",
        "t": 7693.02,
        "cue": "j-o-p",
        "limit": 9,
        "confidence": 0.93,
        "trigger": "Bureaucratic combat",
        "note": "A young fan's shared Marky Mark/Loomis shout-out becomes a job lecture.",
    },
    {
        "id": "challis-birthday",
        "character": "challis",
        "sourceId": "LV2rmwEA0w4",
        "t": 8309.12,
        "cue": "this is Dr.",
        "limit": 15,
        "confidence": 0.99,
        "trigger": "Alcohol",
        "note": "The performer explicitly announces Dr. Challis before giving birthday advice.",
    },
    {
        "id": "challis-miguel",
        "character": "challis",
        "sourceId": "ag3axSC9BpU",
        "t": 3860.72,
        "cue": "my name's",
        "limit": 5,
        "confidence": 0.94,
        "trigger": "Flirtation",
        "note": "The Challis identity becomes the punchline to a pickup-story detour.",
    },
    {
        "id": "challis-doctor",
        "character": "challis",
        "sourceId": "ag3axSC9BpU",
        "t": 9851.76,
        "cue": "Dr. Chalice, I am",
        "limit": 7,
        "confidence": 0.96,
        "trigger": "Questionable medicine",
        "note": "The bit asserts real-doctor status while answering a deliberately absurd prompt.",
    },
    {
        "id": "challis-alphabet",
        "character": "challis",
        "sourceId": "N-UahfG8-gM",
        "t": 10780.0,
        "cue": "H I had sex",
        "limit": 10,
        "confidence": 0.97,
        "trigger": "Flirtation",
        "note": "A request addressed to Challis turns the alphabet into an immediate confession.",
    },
    {
        "id": "challis-heman",
        "character": "challis",
        "sourceId": "tL9zmuyrtl4",
        "t": 7132.72,
        "cue": "first off",
        "limit": 16,
        "confidence": 0.93,
        "trigger": "Halloween III",
        "note": "A direct Challis prompt produces an offended pop-culture ruling.",
    },
    {
        "id": "challis-dj",
        "character": "challis",
        "sourceId": "WyT--HIrL8U",
        "t": 7990.56,
        "cue": "I'm not a DJ",
        "limit": 9,
        "confidence": 0.96,
        "trigger": "Questionable medicine",
        "note": "The Challis half of a two-character pep talk asserts doctor status immediately.",
    },
    {
        "id": "challis-boilermaker",
        "character": "challis",
        "sourceId": "lCH31VtaSeI",
        "t": 6511.44,
        "cue": "because I would just",
        "limit": 12,
        "confidence": 0.96,
        "trigger": "Alcohol",
        "note": "An explicitly framed Challis answer turns daddy issues into a bar plan.",
    },
    {
        "id": "slender-aliens",
        "character": "slenderman",
        "sourceId": "LV2rmwEA0w4",
        "t": 10063.6,
        "cue": "All right. Calm",
        "limit": 12,
        "confidence": 0.97,
        "trigger": "Impossible visitors",
        "note": "A question addressed to Slender receives calm supernatural-homeowner advice.",
    },
    {
        "id": "slender-last-resort",
        "character": "slenderman",
        "sourceId": "shoWljlgSUU",
        "t": 8948.8,
        "cue": "cut me life",
        "limit": 8,
        "confidence": 0.93,
        "trigger": "Soft-rock request",
        "note": "A direct 'Slendy' request becomes a deliberately broken soft-rock fragment.",
    },
    {
        "id": "slender-creed",
        "character": "slenderman",
        "sourceId": "f9_OkfedZAs",
        "t": 12518.16,
        "cue": "Uh, what if",
        "limit": 9,
        "confidence": 0.91,
        "trigger": "Soft-rock request",
        "note": "A direct Slenderman song request gets a tiny, evasive performance.",
    },
    {
        "id": "slender-stomach",
        "character": "slenderman",
        "sourceId": "Mf-0Tv_KHCE",
        "t": 541.04,
        "cue": "me sorry that your",
        "limit": 13,
        "confidence": 0.98,
        "trigger": "Calming ritual",
        "note": "A stomach-virus prompt addressed to Slenderman becomes a gentle pharmacy visit.",
    },
    {
        "id": "slender-decade",
        "character": "slenderman",
        "sourceId": "sdiVxLTq67Q",
        "t": 7558.72,
        "cue": "so what you all",
        "limit": 16,
        "confidence": 0.98,
        "trigger": "Calming ritual",
        "note": "A direct request to explain ten years becomes surreal life coaching.",
    },
    {
        "id": "slender-motivation",
        "character": "slenderman",
        "sourceId": "aHB28aYdYto",
        "t": 3294.08,
        "cue": "you need to wake up",
        "limit": 16,
        "confidence": 0.97,
        "trigger": "Calming ritual",
        "note": "A language-learning prompt addressed to Slenderman receives sincere motivation.",
    },
    {
        "id": "feldman-titanic",
        "character": "corey-feldman",
        "sourceId": "LV2rmwEA0w4",
        "t": 6367.2,
        "cue": "Hollywood produced",
        "limit": 12,
        "confidence": 0.98,
        "trigger": "Casting grievance",
        "note": "The Feldman name cue is followed immediately by a Titanic casting riff.",
    },
    {
        "id": "feldman-wolfpack",
        "character": "corey-feldman",
        "sourceId": "LV2rmwEA0w4",
        "t": 10803.68,
        "cue": "THE WOLF PACK ARE HERE",
        "limit": 5,
        "confidence": 0.99,
        "trigger": "Fictional Wolf Pack",
        "note": "A question explicitly addressed to Corey launches the recurring Wolf Pack motif.",
    },
    {
        "id": "feldman-titanic-two",
        "character": "corey-feldman",
        "sourceId": "ag3axSC9BpU",
        "t": 10914.72,
        "cue": "I was supposed",
        "limit": 7,
        "confidence": 0.96,
        "trigger": "Casting grievance",
        "note": "The second half of a two-character prompt pivots into the Titanic grievance.",
    },
    {
        "id": "feldman-batman",
        "character": "corey-feldman",
        "sourceId": "ag3axSC9BpU",
        "t": 10925.68,
        "cue": "only if they cast",
        "limit": 7,
        "confidence": 0.97,
        "trigger": "Music takeover",
        "note": "The DCU answer turns into a Batman casting and soundtrack pitch.",
    },
    {
        "id": "feldman-atmosphere",
        "character": "corey-feldman",
        "sourceId": "shoWljlgSUU",
        "t": 8097.2,
        "cue": "I knew it was",
        "limit": 8,
        "confidence": 0.94,
        "trigger": "Fictional Wolf Pack",
        "note": "The fictional Wolf Pack is blamed in an improvised conspiracy detour.",
    },
]


CREATOR_CONTEXT_SEEDS: list[dict[str, Any]] = [
    {
        "id": "loomis-character-process",
        "character": "loomis",
        "sourceId": "sdiVxLTq67Q",
        "t": 10517.76,
        "cue": "if loomis pours",
        "limit": 13,
        "confidence": 0.99,
        "note": (
            "A tenth-anniversary discussion explicitly describes how naturally the "
            "Loomis character now comes out of J."
        ),
        "speakerBasis": (
            "The surrounding exchange names J, discusses 'what you do, Jay,' and "
            "then describes Loomis pouring out of J."
        ),
    },
    {
        "id": "slender-character-process",
        "character": "slenderman",
        "sourceId": "sdiVxLTq67Q",
        "t": 10595.04,
        "cue": "the slenderman character",
        "limit": 10,
        "confidence": 0.99,
        "note": (
            "J describes Slenderman as fun and deliberately against the channel's "
            "usual character instincts."
        ),
        "speakerBasis": (
            "The surrounding exchange explicitly addresses J about his recurring "
            "Loomis and Slenderman characters."
        ),
    },
    {
        "id": "challis-character-process",
        "character": "challis",
        "sourceId": "R_bXrnNOcwg",
        "t": 2287.52,
        "cue": "It's just like a mind state",
        "limit": 6,
        "confidence": 0.98,
        "note": (
            "The hosts describe Challis as a mind state rather than a conventional "
            "voice impression."
        ),
        "speakerBasis": (
            "The same uninterrupted exchange later says 'Jay, I'll try to do "
            "Chalice,' making the other host's performance role explicit."
        ),
    },
    {
        "id": "challis-performer-process",
        "character": "challis",
        "sourceId": "R_bXrnNOcwg",
        "t": 2320.64,
        "cue": "Jay, I'll try",
        "limit": 15,
        "confidence": 0.99,
        "note": (
            "The performer addresses Jay by name, says he will do Challis, and reaches "
            "for a drink to enter the bit."
        ),
        "speakerBasis": (
            "The line directly distinguishes Jay from the person performing Challis; "
            "the owner-supplied mapping identifies that performer as Mike."
        ),
    },
]


BONUS_CANDIDATES: list[dict[str, Any]] = [
    {
        "id": "marky-mark",
        "name": "Mark Wahlberg / Marky Mark",
        "status": "candidate-needs-human-verification",
        "performedBy": None,
        "hostAttribution": {
            "status": "not-diarized",
            "confidence": 0.0,
            "basis": (
                "Timestamped captions support repeated performance candidates but do not "
                "reliably identify which host is speaking. The candidate remains locked "
                "until reviewed."
            ),
        },
        "profile": (
            "A breathless, overconfident action-star parody built around fitness, "
            "self-promotion, impossible casting, and sentences that refuse to stop."
        ),
        "lineage": "recurring candidate",
        "askEnabled": False,
        "whyLocked": (
            "Three strong performance receipts exist, but the performer identity has not "
            "been supplied by the owner or established from a speaker-labeled source."
        ),
        "soundbyteSeeds": [
            {
                "id": "mark-intro",
                "sourceId": "5HfhwoDSQ0E",
                "t": 6639.92,
                "cue": "hey guys this is",
                "limit": 6,
                "confidence": 0.98,
                "note": "An explicit self-introduction opens a full parody promo.",
            },
            {
                "id": "mark-dcu",
                "sourceId": "ag3axSC9BpU",
                "t": 10870.96,
                "cue": "He's never lifted",
                "limit": 10,
                "confidence": 0.88,
                "note": "The first half of a Mark Wahlberg/Corey Feldman two-character prompt.",
            },
            {
                "id": "mark-biscuit-boy",
                "sourceId": "Qc2vVFMO4ts",
                "t": 7638.12,
                "cue": "what you want to do",
                "limit": 12,
                "confidence": 0.95,
                "note": (
                    "A fan explicitly requests Marky Mark; the response starts with "
                    "protein, the gym, and a Bowflex."
                ),
            },
        ],
    }
]


GLOBAL_GUARDRAILS = {
    "generatedRiffLabelRequired": True,
    "requiredLabel": "GENERATED CHARACTER RIFF — NOT A REAL WWAM QUOTE",
    "archiveAudioPolicy": (
        "Audio playback may use only the linked source at the validated timestamp. "
        "Generated responses remain text-only."
    ),
    "voiceCloning": "disabled",
    "fabricatedQuotes": "forbidden",
    "speakerGuessing": "forbidden",
    "realPersonAllegations": "forbidden",
    "evidenceRule": (
        "Archival claims must return a source ID, exact timestamp, short caption "
        "excerpt, and provenance confidence."
    ),
}


def read_metadata() -> dict[str, dict[str, Any]]:
    output: dict[str, dict[str, Any]] = {}
    metadata_dir = CACHE / "metadata"
    for path in sorted(metadata_dir.glob("*.json")):
        try:
            output[path.stem] = json.loads(path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError) as error:
            raise RuntimeError(f"Cannot read metadata {path}: {error}") from error
    return output


def read_js_assignment(path: Path, variable: str) -> Any:
    prefix = f"window.{variable} = "
    text = path.read_text(encoding="utf-8").strip()
    if not text.startswith(prefix) or not text.endswith(";"):
        raise RuntimeError(f"Unexpected generated artifact wrapper: {path}")
    return json.loads(text[len(prefix) : -1])


def promoted_source_ids() -> set[str]:
    catalog = read_js_assignment(CATALOG_OUTPUT, "WWAM_CATALOG")
    fresh = read_js_assignment(FRESH_OUTPUT, "WWAM_LIVESTREAMS")
    popular = read_js_assignment(POPULAR_OUTPUT, "WWAM_POPULAR_LIVE")
    source_ids = {
        str(item.get("id") or "")
        for item in [
            *catalog,
            *(fresh.get("streams") or []),
            *(popular.get("streams") or []),
        ]
        if item.get("id")
    }
    if len(source_ids) != 74:
        raise RuntimeError(
            f"Expected the promoted 74-source corpus, found {len(source_ids)} sources."
        )
    return source_ids


def read_captions(source_ids: set[str]) -> dict[str, list[dict[str, Any]]]:
    output: dict[str, list[dict[str, Any]]] = {}
    caption_dir = CACHE / "captions"
    for path in sorted(caption_dir.glob("*.json")):
        if path.stem not in source_ids:
            continue
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError) as error:
            raise RuntimeError(f"Cannot read captions {path}: {error}") from error
        output[path.stem] = parse_json3(payload)
    return output


def source_type(info: dict[str, Any]) -> str:
    title = str(info.get("title") or "")
    duration = float(info.get("duration") or 0)
    if re.search(r"\bcommentary\b", title, re.I):
        return "commentary"
    if re.search(r"\blive\b", title, re.I) or duration >= 8500:
        return "livestream"
    return "commentary"


def source_date(info: dict[str, Any]) -> str | None:
    raw = str(info.get("upload_date") or "")
    if len(raw) != 8 or not raw.isdigit():
        return None
    return f"{raw[:4]}-{raw[4:6]}-{raw[6:]}"


def normalize_for_match(value: str) -> str:
    return re.sub(r"\s+", " ", clean_text(value)).strip()


def find_event(
    source_id: str,
    requested_t: float,
    captions: dict[str, list[dict[str, Any]]],
) -> tuple[int, dict[str, Any]]:
    lines = captions.get(source_id)
    if not lines:
        raise RuntimeError(f"No cached captions for seeded source {source_id}")
    index, line = min(
        enumerate(lines),
        key=lambda pair: abs(float(pair[1]["start"]) - requested_t),
    )
    delta = abs(float(line["start"]) - requested_t)
    if delta > 0.8:
        raise RuntimeError(
            f"Timestamp seed {source_id}@{requested_t} misses nearest caption event "
            f"{line['start']} by {delta:.2f}s"
        )
    return index, line


def caption_window(lines: list[dict[str, Any]], index: int, seconds: float = 34) -> str:
    start = float(lines[index]["start"])
    parts = []
    for line in lines[index : index + 24]:
        if float(line["start"]) - start > seconds:
            break
        text = normalize_for_match(str(line["text"]))
        if text:
            parts.append(text)
    return normalize_for_match(" ".join(parts)).replace(">>", " ")


def excerpt_from_seed(
    seed: dict[str, Any],
    captions: dict[str, list[dict[str, Any]]],
) -> tuple[dict[str, Any], str, str]:
    index, line = find_event(seed["sourceId"], float(seed["t"]), captions)
    context = caption_window(captions[seed["sourceId"]], index)
    cue = normalize_for_match(str(seed["cue"]))
    match = re.search(re.escape(cue), context, re.I)
    if not match:
        raise RuntimeError(
            f"Cue {seed['cue']!r} not found at {seed['sourceId']}@{seed['t']}"
        )
    excerpt_text = context[match.start() :]
    words = excerpt_text.split()
    limit = int(seed.get("limit") or 16)
    if limit < 1 or limit > 16:
        raise RuntimeError(f"Public excerpt limit must be 1-16 words: {seed['id']}")
    excerpt = " ".join(words[:limit]).strip(" ,")
    if DISALLOWED_EXCERPT.search(excerpt) or PUBLIC_REJECT.search(excerpt):
        raise RuntimeError(f"Rejected public excerpt in {seed['id']}: {excerpt}")
    if len(excerpt.split()) > 16:
        raise RuntimeError(f"Excerpt exceeds 16 words: {seed['id']}")
    return line, excerpt, context


def receipt(
    seed: dict[str, Any],
    captions: dict[str, list[dict[str, Any]]],
    metadata: dict[str, dict[str, Any]],
) -> tuple[dict[str, Any], str]:
    line, excerpt, context = excerpt_from_seed(seed, captions)
    source_id = seed["sourceId"]
    info = metadata.get(source_id) or {}
    if info.get("channel_id") != OFFICIAL_CHANNEL_ID:
        raise RuntimeError(
            f"Seeded source {source_id} is not verified against the official WWAM channel"
        )
    timestamp = round(float(line["start"]), 2)
    duration = float(info.get("duration") or 0)
    if duration and timestamp >= duration + 2:
        raise RuntimeError(
            f"Timestamp {timestamp} falls outside {source_id} duration {duration}"
        )
    clip_seconds = int(seed.get("clipSeconds") or 14)
    if clip_seconds < 6 or clip_seconds > 30:
        raise RuntimeError(f"Clip duration must be 6-30 seconds: {seed['id']}")
    clip_end = round(
        min(duration, timestamp + clip_seconds)
        if duration
        else timestamp + clip_seconds,
        2,
    )
    item = {
        "id": seed["id"],
        "sourceId": source_id,
        "sourceType": source_type(info),
        "sourceTitle": info.get("title") or source_id,
        "date": source_date(info),
        "t": timestamp,
        "url": f"https://www.youtube.com/watch?v={source_id}&t={round(timestamp)}s",
        "playback": {
            "provider": "youtube",
            "start": timestamp,
            "end": clip_end,
            "clipSeconds": round(clip_end - timestamp, 2),
            "embedUrl": (
                f"https://www.youtube.com/embed/{source_id}"
                f"?start={round(timestamp)}&end={round(clip_end)}&autoplay=1"
            ),
        },
        "excerpt": excerpt,
        "trigger": seed.get("trigger"),
        "note": seed["note"],
        "confidence": seed["confidence"],
        "provenance": {
            "channel": info.get("channel") or "WeWatchedAMovie",
            "channelId": OFFICIAL_CHANNEL_ID,
            "captionSource": "official YouTube automatic captions",
            "timestampStatus": "exact-caption-event",
            "selection": "human-curated seed with deterministic caption validation",
            "speakerBasis": seed.get("speakerBasis")
            or (
                "Character addressed or explicitly announced in the immediate caption "
                "context; host identity comes only from the owner-supplied mapping."
            ),
        },
    }
    return item, context


def trigger_counts(
    rules: dict[str, list[str]],
    contexts: list[str],
) -> list[dict[str, Any]]:
    combined = " ".join(contexts)
    output = []
    for label, patterns in rules.items():
        hits = sum(len(re.findall(pattern, combined, re.I)) for pattern in patterns)
        output.append({"label": label, "hits": hits})
    return sorted(output, key=lambda item: (-item["hits"], item["label"]))


def mention_metrics(
    pattern: str,
    captions: dict[str, list[dict[str, Any]]],
    metadata: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    matcher = re.compile(pattern, re.I)
    by_source: Counter[str] = Counter()
    by_type: Counter[str] = Counter()
    for source_id, lines in captions.items():
        count = sum(bool(matcher.search(str(line["text"]))) for line in lines)
        if not count:
            continue
        by_source[source_id] = count
        by_type[source_type(metadata.get(source_id) or {})] += count
    return {
        "archiveMentions": sum(by_source.values()),
        "sourcesWithMentions": len(by_source),
        "bySourceType": dict(sorted(by_type.items())),
        "topSources": [
            {"sourceId": source_id, "mentions": count}
            for source_id, count in by_source.most_common(5)
        ],
    }


def build_character(
    character_id: str,
    definition: dict[str, Any],
    captions: dict[str, list[dict[str, Any]]],
    metadata: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    soundbytes = []
    contexts = []
    for seed in EVIDENCE_SEEDS:
        if seed["character"] != character_id:
            continue
        item, context = receipt(seed, captions, metadata)
        soundbytes.append(item)
        contexts.append(context)
    creator_context = []
    for seed in CREATOR_CONTEXT_SEEDS:
        if seed["character"] != character_id:
            continue
        item, context = receipt(seed, captions, metadata)
        creator_context.append(item)
        contexts.append(context)
    if not soundbytes:
        raise RuntimeError(f"No receipts produced for {character_id}")
    source_count = len({item["sourceId"] for item in soundbytes})
    dated_receipts = [item["date"] for item in soundbytes if item.get("date")]
    definition = dict(definition)
    definition["id"] = character_id
    definition["status"] = "grounded"
    definition["askEnabled"] = True
    definition["metrics"] = {
        **mention_metrics(definition.pop("mentionPattern"), captions, metadata),
        "curatedPerformanceCandidates": len(soundbytes),
        "curatedCandidateSources": source_count,
        "livestreamReceipts": sum(
            item["sourceType"] == "livestream" for item in soundbytes
        ),
        "commentaryReceipts": sum(
            item["sourceType"] == "commentary" for item in soundbytes
        ),
        "creatorContextReceipts": len(creator_context),
        "evidenceEra": {
            "earliestReceiptInCurrentSet": min(dated_receipts)
            if dated_receipts
            else None,
            "latestReceiptInCurrentSet": max(dated_receipts)
            if dated_receipts
            else None,
        },
    }
    definition["triggerSignals"] = trigger_counts(definition.pop("triggers"), contexts)
    definition["soundbytes"] = soundbytes
    definition["creatorContext"] = creator_context
    definition["sourceIds"] = sorted(
        {item["sourceId"] for item in soundbytes + creator_context}
    )
    return definition


def build_bonus(
    definition: dict[str, Any],
    captions: dict[str, list[dict[str, Any]]],
    metadata: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    definition = dict(definition)
    seeds = definition.pop("soundbyteSeeds")
    soundbytes = []
    for seed in seeds:
        item, _ = receipt(
            {
                **seed,
                "character": definition["id"],
                "trigger": "Candidate performance",
                "speakerBasis": LOCKED_CANDIDATE_SPEAKER_BASIS,
            },
            captions,
            metadata,
        )
        soundbytes.append(item)
    dated_receipts = [item["date"] for item in soundbytes if item.get("date")]
    definition["soundbytes"] = soundbytes
    definition["metrics"] = {
        "lockedPerformanceCandidates": len(soundbytes),
        "candidateSources": len({item["sourceId"] for item in soundbytes}),
        "evidenceEra": {
            "earliestReceiptInCurrentSet": min(dated_receipts)
            if dated_receipts
            else None,
            "latestReceiptInCurrentSet": max(dated_receipts)
            if dated_receipts
            else None,
        },
    }
    return definition


def validate_behavior_links(characters: list[dict[str, Any]]) -> None:
    for character in characters:
        evidence_ids = {item["id"] for item in character["soundbytes"]}
        for pattern in character["behaviorPatterns"]:
            missing = set(pattern["evidence"]) - evidence_ids
            if missing:
                raise RuntimeError(
                    f"{character['id']} behavior {pattern['label']} has missing evidence: "
                    f"{sorted(missing)}"
                )


def build_payload() -> dict[str, Any]:
    metadata = read_metadata()
    source_ids = promoted_source_ids()
    captions = read_captions(source_ids)
    if not captions:
        raise RuntimeError("No cached captions found; run the WWAM distill pipelines first.")
    characters = [
        build_character(character_id, definition, captions, metadata)
        for character_id, definition in CHARACTERS.items()
    ]
    validate_behavior_links(characters)
    bonus = [build_bonus(item, captions, metadata) for item in BONUS_CANDIDATES]
    all_receipts = [
        soundbyte
        for character in characters
        for soundbyte in character["soundbytes"]
    ]
    creator_context_receipts = [
        receipt_item
        for character in characters
        for receipt_item in character["creatorContext"]
    ]
    all_receipts.extend(
        soundbyte for candidate in bonus for soundbyte in candidate["soundbytes"]
    )
    unique_receipt_sources = {
        item["sourceId"] for item in all_receipts + creator_context_receipts
    }
    return {
        "version": "1.1.0",
        "scope": {
            "captionFilesScanned": len(captions),
            "promotedSources": len(source_ids),
            "metadataFilesScanned": len(metadata),
            "captionEventsScanned": sum(len(lines) for lines in captions.values()),
            "groundedCharacters": len(characters),
            "lockedCandidates": len(bonus),
            "curatedPerformanceCandidates": len(all_receipts)
            - sum(len(candidate["soundbytes"]) for candidate in bonus),
            "lockedPerformanceCandidates": sum(
                len(candidate["soundbytes"]) for candidate in bonus
            ),
            "timestampValidatedCandidates": len(all_receipts),
            "curatedContextReceipts": len(creator_context_receipts),
            "authenticatedEditorVerifiedDecisions": 0,
            "uniqueEvidenceSources": len(unique_receipt_sources),
        },
        "methodology": [
            (
                "Scan every locally cached official YouTube caption payload; keep full "
                "captions private and gitignored."
            ),
            (
                "Use owner-supplied host mappings instead of attempting unreliable "
                "speaker diarization from auto-captions."
            ),
            (
                "Human-select candidate performances, then deterministically validate "
                "the caption event, cue text, source duration, and public excerpt limit."
            ),
            (
                "Separate archival soundbytes from generated text riffs. Every "
                "generated riff must carry an unmistakable non-quote label."
            ),
        ],
        "guardrails": GLOBAL_GUARDRAILS,
        "characters": characters,
        "lockedCandidates": bonus,
        "limitations": [
            (
                "YouTube automatic captions do not contain trustworthy speaker labels; "
                "host identity is not inferred from voice or turn order."
            ),
            (
                "Mention counts include ordinary discussion of a character as well as "
                "performances. Only the curated soundbytes are performance receipts."
            ),
            (
                "The current Slenderman evidence set is smaller than Loomis, Challis, "
                "and Feldman, so its generated-riff profile carries lower confidence."
            ),
            (
                "Generated responses are grounded parody scaffolds, not predictions of "
                "what Mike or J would literally say."
            ),
        ],
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--check",
        action="store_true",
        help="Validate the committed artifact is byte-for-byte reproducible.",
    )
    args = parser.parse_args()
    try:
        payload = build_payload()
        rendered = js_assignment("WWAM_CHARACTER_LORE", payload)
        if args.check:
            if not OUTPUT.exists():
                raise RuntimeError(f"Missing generated artifact: {OUTPUT}")
            existing = OUTPUT.read_text(encoding="utf-8")
            if existing != rendered:
                raise RuntimeError(
                    "character-lore.js is stale; run pipeline/wwam_character_distill.py"
                )
        else:
            OUTPUT.write_text(rendered, encoding="utf-8")
        scope = payload["scope"]
        action = "Validated" if args.check else "Wrote"
        print(
            f"{action} {OUTPUT}: {scope['groundedCharacters']} grounded characters, "
            f"{scope['lockedCandidates']} locked candidate, "
            f"{scope['curatedPerformanceCandidates']} curated performance candidates, "
            f"{scope['lockedPerformanceCandidates']} locked candidates across "
            f"{scope['uniqueEvidenceSources']} sources.",
            flush=True,
        )
        return 0
    except Exception as error:
        print(f"Character distill failed: {error}", file=sys.stderr, flush=True)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
