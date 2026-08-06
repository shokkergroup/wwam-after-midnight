(function (root) {
  "use strict";

  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || {
    schema: "shokker-episode-editorial-packs/v1",
    sources: {},
  };
  var sources = Object.assign({}, registry.sources || {});

  /* March 12, 2026: full-tape read of the open-line movie-news stream. */
  sources["_hcLHO3Y0jA"] = Object.freeze({
    sourceId: "_hcLHO3Y0jA",
    reviewState: "full-tape-human-editorial-read",
    evidence: Object.freeze({
      duration: 10775,
      captionWords: 6716,
      captionEvents: 710,
      captionSpanSeconds: 10775.22,
      captionDurationCoveragePercent: 100,
      captionSha256: "sha256:2ce073dbae1bb3d6f87cd50c57aa83634d94cfc5703418d62fc63a36c11e167a",
      captionSourceKind: "official YouTube caption ledger",
      audioPass: "canonical YouTube audio + source-local Whisper transcript alignment",
      audioSha256: "f5e9c8156988dc229cbbce1facbb1cc5159ade7057ad8f120daddde0d1e10daa",
      asrWindowCount: 68,
      speakerAttribution: false,
      visualOutcomeInferred: false,
    }),
    label: "THE SCREAM 7 FIGHT, THE TOXIC AVENGER BUZZ BALLS, AND LOOMIS'S TALKING TOILET",
    badge: "FULL SHOW WIKI // 2:59:35 OF SCREAM, ALIEN, SAW, AND FAM DAMAGE CONTROL",
    headline: "SCREAM 7 GETS A DEFENSE ATTORNEY; THE TOXIC AVENGER GETS A GREEN-BUZZ-BALL WAR STORY.",
    deck:
      "A nearly three-hour WWAM open line that jumps from Resident Evil panic to Corey Feldman documentary fallout, Alien and Arnold casting, Scream 7 arguments, Toxic Avenger drinking lore, a Loomis/Challis bathroom clinic, and a fan room that keeps donating after the hosts beg it to stop.",
    overview:
      "The March 12 tape is a perfect example of why a livestream needs a real dossier instead of a stack of topic tags. It opens with a rug, a dog, and the kind of bodily humor that tells you the room is already loose. Then the show takes a sharp documentary turn: Corey Feldman's self-mythology, a Rob Reiner special, and the question of whether a public account of abuse can still become a spotlight-seeking performance. The hosts are crude, but the argument is specific. From there they move through Resident Evil Requiem's Grace and Leon, Alien: Earth season two, a possible Alien: Romulus director, Arnold's aging action-star problem, and Mortal Kombat 2 versus Street Fighter. The center of gravity is Scream. Kevin Williamson's possible departure, a divisive review, the ending, the kills, the killer reveal, and the possibility of another commentary become an argument between people with different emotional histories of the franchise. The FAM keeps the show honest: Tiffany sends a clean-bill-of-health wish for the animals, Feet Meat tells the Toxic Avenger green Buzz Ball story, Cornholio asks why the toilet is talking to Loomis and why Challis was in Rob Zombie's house, and viewers pitch Clerks 2, Halloween-game sessions, Best of the Best, Texas Chainsaw tourism, and a live Scream 7 commentary. The last hour is pure community aftercare—digital trophies, expired tags, HBO Max, poppers nobody will explain, Stu resurrection, and a final Hiawatha request. The tape's humor is loud, but its shape is not random: every serious topic gets tested by a joke, and every joke eventually reveals what the audience actually cares about.",
    story: Object.freeze([
      { at: 0, end: 780, label: "THE RUG, THE DOG, AND THE FIRST BODY JOKE", body: "The broadcast begins with a rug, a filthy food joke, and an immediate check on Baxter's health. The room establishes its contract early: personal life is part of the show, but the FAM is allowed to interrupt the bit with genuine concern." },
      { at: 781, end: 1560, label: "COREY FELDMAN ENTERS THE DOCUMENTARY COURT", body: "The documentary discussion asks whether a story about abuse can be told without turning the storyteller into the only subject. The hosts criticize the self-promotion they hear while still acknowledging the seriousness of the underlying history." },
      { at: 1561, end: 2340, label: "RESIDENT EVIL MAKES THE DESK SWEAT", body: "Grace, Leon, and the reportedly scary sections of Resident Evil Requiem become a gameplay argument. Running away is defended as a skill, the chat asks about multiplayer, and the hosts admit the stream might need a separate camera just to capture the freak-outs." },
      { at: 2341, end: 3120, label: "ALIEN EARTH AND THE FUNGAL-INFECTION NEWS", body: "Alien: Earth season two, a dog's fungal infection, and an accidental alcohol story share the same news block. The juxtaposition is very WWAM: a franchise update can sit next to a vet worry without either one being treated as filler." },
      { at: 3121, end: 3900, label: "BOX-OFFICE SHITHOLE SALAD", body: "A recent movie's bad box office becomes a blunt review of a film the hosts watched with friends. The room mocks rainbow-bead theater paranoia, calls the movie simply bad, and keeps the critique concrete instead of hiding behind a score." },
      { at: 3901, end: 4680, label: "ARNOLD CANNOT BE CGI FOREVER", body: "The desk wants Arnold back but worries that a studio will return him as a sanitized digital memory. The talk moves through action-star aging, nudity, character dignity, and the fear that a legacy hero will be remade into something nobody asked to see." },
      { at: 4681, end: 5460, label: "MORTAL KOMBAT 2 WALKS INTO THE SCREAM FIGHT", body: "Mortal Kombat 2 gets a confident vote before the stream walks into Scream 7. One host is tired of giving Ghostface the entire front row; the other keeps defending the franchise because the personal connection is real." },
      { at: 5461, end: 6240, label: "SCREAM 7 GETS A FOURTH-PLACE VERDICT", body: "The hosts separate enthusiasm from perfection: Scream 7 has a strong opening, good jumps, Matthew Lillard affection, and a weak reveal. The ranking is specific—Scream 1, Scream 2, Scream 5, then 7—and that specificity is what makes the argument worth saving." },
      { at: 6241, end: 7020, label: "THE CHAT PITCHES THE NEXT COMMENTARY", body: "A possible live Scream commentary is debated, then the room drifts through Dune disappointment, James Wan fantasies, M. Night Shyamalan wish-casting, and a viewer's story about a car that is more Frankenstein than vehicle." },
      { at: 7021, end: 7800, label: "ALIEN ROMULUS GETS THE EXTERMINATOR JOKE", body: "A Quiet Place: Day One director being eyed for Alien: Romulus becomes a competency conversation. The hosts want the horror to feel physical, roast the exterminator who missed the cockroaches, and admit Fede Alvarez left enormous shoes behind." },
      { at: 7801, end: 8580, label: "THE TOXIC AVENGER GREEN-BUZZ-BALL RECEIPT", body: "Feet Meat's story about green Buzz Balls, Fireballs, vomiting on theater stairs, and escaping public intoxication becomes the episode's cleanest fan-authored soundbite. The hosts do not need to embellish it; the story already arrives wearing a hazmat suit." },
      { at: 8581, end: 9360, label: "THE COMMUNITY REOPENS THE CHARACTER CLINIC", body: "Clerks 2, the Halloween game, HBO Max, expired tags, and a sudden battle between Clay Aiken and somebody else become fan-driven doors. The show is less a Q&A than a series of invitations for viewers to make the hosts answer for their lives." },
      { at: 9361, end: 10140, label: "LOOMIS, CHALLIS, AND THE TALKING TOILET", body: "Cornholio asks why the toilet is talking to Loomis and what Loomis was doing in Rob Zombie's house with Sheri Moon. The character lane answers with a dodge, a confession-shaped gap, and exactly enough chaos to make the request worth replaying." },
      { at: 10141, end: 10775, label: "STU, TEXAS CHAINSAW, AND THE HIAWATHA EXIT", body: "The final run resurrects Stu, compares Ghostfaces with Cordell Walker Chuck Norris, endorses a Texas Chainsaw house trip, accepts more donations, and ends on a Hiawatha request. The goodbye is not a conclusion; it is the FAM checking whether one more door is still unlocked." },
    ]),
    highlights: Object.freeze([
      { at: 680, end: 698, category: "THE ROOM BREAKS", label: "THE DOCUMENTARY HAS A PANTY-WAIST ERA", excerpt: "A documentary title and tour memory become an instant Corey Feldman character sketch." },
      { at: 1243, end: 1261, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "THE DOCUMENTARY SPOTLIGHT ARGUMENT", excerpt: "The hosts ask whether a serious story can be told without making the teller the center of every frame." },
      { at: 1349, end: 1367, category: "WWAM UP IN YA", label: "NO MULTIPLAYER, JUST RUNNING AWAY", excerpt: "Resident Evil fear is defended as tactical retreat, then the chat asks for multiplayer anyway." },
      { at: 1576, end: 1594, category: "TAKE GETS NUCLEAR", label: "THE SCARY PART IS THE ONE YOU CANNOT SEE", excerpt: "The room identifies the game's worst fear as the stretch where the player has no clean answer." },
      { at: 1849, end: 1867, category: "CHARACTER PERFORMANCE", label: "FELDMAN'S COPLEY VOICE", excerpt: "A Corey Feldman impression becomes the doorway into the documentary argument.", characters: ["Corey Feldman"] },
      { at: 2061, end: 2079, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "RAINBOW BEADS AT THE BOX OFFICE", excerpt: "A theater trip becomes suspicious the moment somebody walks in alone wearing rainbow beads." },
      { at: 2226, end: 2244, category: "FAN SIGNAL", label: "THE FAM SENDS WELL WISHES", excerpt: "A viewer's message about a tragic loss and the animals briefly changes the room's weather." },
      { at: 2856, end: 2874, category: "WWAM UP IN YA", label: "THE CGI GETS SENT TO THE CHUTE", excerpt: "The hosts reject a corny digital effect and demand a creature with actual weight." },
      { at: 2951, end: 2969, category: "FAN SIGNAL", label: "THE OLD USERNAME PROBLEM", excerpt: "A viewer asks why the channel keeps changing old names, turning account management into a fan bit." },
      { at: 3221, end: 3239, category: "TAKE GETS NUCLEAR", label: "ATTACK OF THE CLONES TROLLING", excerpt: "The chat claims to prefer Attack of the Clones and the room treats the claim like a deliberate fire alarm." },
      { at: 4510, end: 4528, category: "TAKE GETS NUCLEAR", label: "HE HAS TO CHANGE HIS PANTS", excerpt: "A movie reaction is judged by the most scientific WWAM metric available: did it force a wardrobe change?" },
      { at: 5733, end: 5751, category: "WWAM UP IN YA", label: "THE SCREAM CHAT ATTACK", excerpt: "A Ghostface argument turns into a live pile-on before the review has even found its final grade." },
      { at: 5870, end: 5888, category: "CHARACTER PERFORMANCE", label: "THE ROB ZOMBIE JUICE THEORY", excerpt: "A filthy character cue drags Rob Zombie and a very specific body-fluid theory into the review.", characters: ["Rob Zombie"] },
      { at: 5955, end: 5973, category: "FAN SIGNAL", label: "FEET MEAT'S GREEN BUZZ BALLS", excerpt: "Three green Buzz Balls, two Fireballs, a theater staircase, and a Toxic Avenger exit strategy." },
      { at: 6037, end: 6055, category: "COMMUNITY MEMORY", label: "A CLEAN-BILL-OF-HEALTH WISH", excerpt: "Tiffany's message brings the animals and their health into the center of the show without a punchline attached." },
      { at: 6420, end: 6438, category: "TAKE GETS NUCLEAR", label: "SCREAM 7'S FOURTH-PLACE CASE", excerpt: "The ranking is not a shrug: Scream 1, Scream 2, Scream 5, then 7, with the reveal paying the price." },
      { at: 6480, end: 6498, category: "TAKE GETS NUCLEAR", label: "THE ENDING WAS BAD, THE FIGHT WAS GOOD", excerpt: "A late review distinction saves the conversation from a lazy thumbs-up or thumbs-down." },
      { at: 6600, end: 6618, category: "COMMUNITY MEMORY", label: "THE FAM WANTS THE HALLOWEEN GAME", excerpt: "A viewer's request moves the archive toward a future game-night session with Loomis and Challis in the room." },
      { at: 7080, end: 7098, category: "WWAM UP IN YA", label: "THE BLEACHING APPOINTMENT", excerpt: "The final character request pairs a movie watch with an aggressively personal grooming appointment." },
      { at: 7177, end: 7195, category: "CHARACTER PERFORMANCE", label: "THE TOILET ASKS LOOMIS FOR HELP", excerpt: "Cornholio asks Loomis and Challis why the toilet is talking, and the character lane has to answer.", characters: ["Dr. Loomis", "Dr. Challis"] },
      { at: 7650, end: 7668, category: "WWAM UP IN YA", label: "THE NEXT MOVIE HAS TO SPAN EIGHT PARTS", excerpt: "A simple movie question becomes an eight-film search for the vagina clit, which is exactly as dignified as it sounds." },
      { at: 8603, end: 8621, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "NOTHING BLEW MY MIND", excerpt: "The Scream verdict lands on the most damaging middle ground: enjoyable, competent, and never once mind-blowing." },
      { at: 8717, end: 8735, category: "WWAM UP IN YA", label: "THE EXTERMINATOR MISSED THE COCKROACHES", excerpt: "Alien franchise excitement is delivered through an exterminator who left the entire nightmare alive." },
      { at: 8988, end: 9006, category: "TAKE GETS NUCLEAR", label: "THE LAPTOP TAX", excerpt: "A game recommendation becomes a practical question about whether the viewer can afford the hardware to run it." },
      { at: 9430, end: 9448, category: "FAN SIGNAL", label: "ALL GHOSTFACES VERSUS CHUCK NORRIS", excerpt: "The chat asks whether every Ghostface can beat Cordell Walker, and the answer arrives before the question finishes." },
      { at: 9515, end: 9533, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "THE KILLERS WERE DOGSHIT", excerpt: "A Scream 7 defense admits the opening and jumps work while the killer reveal gets thrown directly into the chute." },
      { at: 9697, end: 9715, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "THE COMMENTARY THREAT", excerpt: "The idea of watching Scream 7 together is treated as either a great community event or a punishment nobody survives." },
      { at: 9927, end: 9945, category: "FAN SIGNAL", label: "BAYWATCH AND THE SET PHOTO", excerpt: "Michael Parton's set-photo question sends the horror desk into an unexpected Stephen Amell detour." },
      { at: 10449, end: 10467, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "HEINEKEN, SUCKS, AND PUNCHES", excerpt: "A viewer's drinking recipe becomes the kind of phrase that should never be used as a bedtime story." },
      { at: 10649, end: 10667, category: "FAN SIGNAL", label: "CLERKS 2 GETS REQUESTED", excerpt: "A fan asks for a Clerks 2 commentary and the room briefly debates whether the request is a movie title or a holy text." },
      { at: 10700, end: 10718, category: "CHARACTER PERFORMANCE", label: "LOOMIS AND CHALLIS GET THE HOUSE CALL", excerpt: "The character lane returns to the bathroom and the hosts let the fan prompt decide how much dignity remains.", characters: ["Dr. Loomis", "Dr. Challis"] },
    ]),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 5733, end: 6420, label: "THE SCREAM 7 ARGUMENT", topic: "the opening, the reveal, the ranking, and whether another commentary is a good idea", body: "Play from 1:35:33. This is the show's most useful disagreement: both sides can name exactly what works and what the killer reveal fails to deliver.", playAt: 5733, playEnd: 6420 }),
      hated: Object.freeze({ at: 1243, end: 1867, label: "THE DOCUMENTARY SPOTLIGHT PROBLEM", topic: "Corey Feldman, abuse testimony, and the limits of self-mythology", body: "Play from 20:43. The anger is aimed at the presentation, while the underlying abuse story is treated as serious and not a punchline.", playAt: 1243, playEnd: 1867 }),
      wildestDetour: Object.freeze({ at: 5955, end: 7195, label: "GREEN BUZZ BALLS TO A TALKING TOILET", topic: "Feet Meat's Toxic Avenger story, fan care, and Loomis/Challis bathroom questions", body: "Play from 1:39:15. The fan room authors the episode here: one drunken theater story, one clean-bill-of-health message, and a toilet that demands character answers.", playAt: 5955, playEnd: 7195 }),
      lastWord: Object.freeze({ at: 9430, end: 10775, label: "THE FAM REFUSES TO HANG UP", topic: "Chuck Norris, Stu, Texas Chainsaw tourism, Clerks 2, and Hiawatha", body: "Play from 2:37:10. The official show keeps trying to end; the audience keeps opening another door until the only possible exit is a final Hiawatha.", playAt: 9430, playEnd: 10775 }),
    }),
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({
    schema: registry.schema || "shokker-episode-editorial-packs/v1",
    generated: "2026-08-06",
    sources: Object.freeze(sources),
  });
})(typeof window !== "undefined" ? window : globalThis);
