(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var H = function (at, end, category, label, excerpt, characters) {
    var item = { at: at, end: end, category: category, label: label, excerpt: excerpt, sourceId: "TpSDfGP6_0M", evidenceState: "machine surfaced; full-caption/audio second read; playback remains the authority" };
    if (characters) item.characters = characters;
    return item;
  };

  /* December 24, 2024: Terrifier 3 First Time Watch Reaction. */
  sources["TpSDfGP6_0M"] = Object.freeze({
    sourceId: "TpSDfGP6_0M",
    reviewState: "full-tape-human-editorial-read-edge",
    editorialPass: "2026-08-07 fine-toothed first editorial read; official caption ledger plus canonical local audio pass across the December 24, 2024 Terrifier 3 reaction",
    evidence: Object.freeze({
      duration: 1169,
      captionWords: 3301,
      captionEvents: 912,
      captionSpanSeconds: 1170.84,
      captionDurationCoveragePercent: 100,
      captionSha256: "sha256:ee9abf54a8d0d26ffd407007f355d5a46b0e9dcae8acac0374b20c10539ef1e2",
      captionSourceKind: "official YouTube automatic caption ledger acquired as JSON3",
      audioPass: "canonical YouTube audio + official-caption second read; local audio playback spot-check; playback remains the authority",
      audioSha256: "sha256:24116789a0972a024a122e2cce857c0af4146367cbddabd1eb196524003c7b7c",
      asrWindowCount: 0,
      speakerAttribution: false,
      visualOutcomeInferred: false,
    }),
    label: "TERRIFIER 3 FIRST-TIME WATCH REACTION // DECEMBER 24, 2024",
    badge: "FULL SHOW WIKI // 19:29 OF ART THE CLOWN, HOLIDAY GORE, SWAMP-WATER SEXUAL HORROR, AND A VERY DRUNK CHARACTER BUTTON",
    headline: "DUNG CHRISTMAS: TERRIFIER 3 MAKES THE HOLIDAY A BLOODY, HORNY, ART-THEMED HOUSE CALL",
    deck: "J sees Terrifier 3 for the first time while Mike tries to keep a straight face through Santa bombs, knife orgasms, demon toys, and the question of whether Art's story should finally stop pretending to be complicated.",
    overview: "The Christmas Eve tape is short, but it is not gentle. Mike introduces J to what WWAM calls Dung Christmas, turns off the lights, and asks for a prediction before the first act has even finished: will Art kill the children, and will the movie actually show it? The answer arrives through aftermath, a headless body, a cop's head placed on a different body, and a soundtrack that makes the room think of Killer Klowns from Outer Space and Jeepers Creepers. Art's private world becomes the real attraction. The hosts treat his lair like a Batcave with worse plumbing, watch him test a Master Blaster 3000, and debate whether he eats, sleeps, pees, or simply appears whenever the franchise needs a new way to ruin someone's Christmas. A subway encounter, a grimy bathroom, and a woman who reacts to Art's swamp-water smell with a knife-based sexual response push the film into the exact R-rated lane the WWAM archive is supposed to preserve. The knife scene is the tape's most deranged shock: the room cannot decide whether to look away, yell, laugh, or congratulate the character for finishing what she started. Santa arrives with a bomb, children are caught in the blast, and the hosts admit that watching real-world violence online has made them suspiciously good at predicting where the movie is going. Compared with Terrifier 2, J finds this one easier to follow and more complete; Mike ranks it below the second film but above the first, praises the pacing, and gives it an 8.5 while J lands at 8.0. The two then argue about whether the next chapter should end with Sienna killing Art in Hell, whether Art is secretly tied to her father, and whether the franchise needs to stop adding mythology and simply let the hero kill the monster. The final archive receipt is not a clean review score. It is the channel's Christmas spell: Art's appetite, the hosts' appetite for disgusting jokes, a Patreon handoff, and a post-credit character tag that says Loomis cannot recover because Dr. Challis is drunk again and sleeping with your sister. This is a compact watchalong with a high replay density: gore reactions, scene predictions, character logic, sexual disgust, sequel architecture, and the exact point where a holiday movie becomes a WWAM Christmas card.",
    story: Object.freeze([
      { at: 0, end: 170, label: "DUNG CHRISTMAS ARRIVES", body: "J's first Terrifier 3 watch is framed as a holiday event, a Patreon invitation, and a challenge to predict whether the movie will show its child-killing cards." },
      { at: 170, end: 350, label: "ART'S HOUSE HAS A PLUMBING PROBLEM", body: "Headless bodies, body-part rearranging, a grimy subway, and Art's domain turn the first stretch into a tour of the clown's private work ethic." },
      { at: 350, end: 560, label: "THE KNIFE SCENE BREAKS THE ROOM", body: "A swamp-water smell, a sexualized knife reaction, and a face-rip give the hosts the most uncomfortable laugh of the night." },
      { at: 560, end: 760, label: "SANTA BRINGS THE BOMB", body: "Art's Christmas costume, the Master Blaster, a fake Santa, and an explosive child scene make the holiday imagery part of the kill design." },
      { at: 760, end: 930, label: "J UNDERSTANDS THE TERRIFIER FORMULA", body: "The tent, the blood, the supernatural weapons, and Art's escalating mythology lead to a comparison with Terrifier 2 and the first film." },
      { at: 930, end: 1060, label: "THE NEXT MOVIE NEEDS A SIMPLE ENDING", body: "Sienna killing Art in Hell becomes the preferred route, while the hosts reject a twist that makes Art her father or turns her into the next Terrifier." },
      { at: 1060, end: 1140, label: "THE SCORES LAND", body: "Mike gives Terrifier 3 an 8.5, J gives it an 8.0, and both place it above the first film while disagreeing about whether Terrifier 2 still rules." },
      { at: 1140, end: 1169, label: "LOOMIS CANNOT RECOVER", body: "The Patreon handoff gives way to the channel's Christmas character tag: Loomis is spent, Challis is drunk, and the goodbye refuses to behave." },
    ]),
    highlights: Object.freeze([
      H(8, 68, "WWAM UP IN YA", "DUNG CHRISTMAS", "Terrifier 3 gets a Christmas name that sounds like a sewage backup and a holiday tradition at the same time."),
      H(76, 136, "FAN SIGNAL", "J'S FIRST TERRIFIER THREE", "Mike announces that J has never seen this one, turning a normal commentary into a genuine first-watch receipt."),
      H(144, 204, "TAKE GETS NUCLEAR", "WILL ART KILL THE KIDS?", "Before the scene pays off, the hosts ask whether the movie will actually show the children being killed or hide behind aftermath."),
      H(212, 272, "SOUNDBYTE / REPLAY", "THE NAUGHTY-LIST PREDICTION", "The child-killing prediction is filtered through a joke about whether the victims made Santa's list."),
      H(280, 340, "WWAM UP IN YA", "TIMMY IS TOO EXPENSIVE", "Inflation becomes the reason nobody wants two children and nobody names a good kid Timmy anymore."),
      H(348, 408, "DEEP DIVE", "ART'S FIRST HEADLESS RECEIPT", "The aftermath confirms the violence without giving the room the exact image it was bracing for."),
      H(416, 476, "WWAM UP IN YA", "THE COP'S HEAD SWITCH", "Art placing a cop's head on another body is treated like a grotesque piece of practical problem-solving."),
      H(484, 544, "SOUNDBYTE / REPLAY", "KILLER KLOWNS IN THE SCORE", "The music sends the room toward Killer Klowns from Outer Space and Jeepers Creepers instead of a normal horror reference."),
      H(552, 612, "DEEP DIVE", "ART'S BATCAVE", "The hosts enjoy seeing what Art does alone, reading his space as a murderous Batcave with no adult supervision."),
      H(620, 680, "FAN SIGNAL", "THE JASON PATRICK DAD", "Jason Patric's exhausted father energy is compared with the hosts' own future selves after a decade of drinking."),
      H(688, 748, "WWAM UP IN YA", "ANIME DRAWINGS AND POLICE TROUBLE", "A side reference to a father getting in trouble for drawing anime girls is delivered as an unrelated but very WWAM legal warning."),
      H(756, 816, "DEEP DIVE", "ART'S DOMAIN HAS WINDOWS", "The room compares Art's hideout with The Crow and Amityville, two visual memories that make the lair feel theatrical rather than random."),
      H(824, 884, "TAKE GETS NUCLEAR", "THE SUBWAY TIME-JUMP", "A subway transition makes the hosts wonder if the movie has traveled backward in time before the scene clarifies itself."),
      H(892, 952, "FAN SIGNAL", "THE STRANGE GIRL AT THE BAR", "The hosts joke about bringing home someone who looks normal in public and turns into a problem the moment the door closes."),
      H(960, 1020, "WWAM UP IN YA", "ART'S DIARY IS FOR HIS EYES ONLY", "The diary is treated like a private journal until the hosts remember that nobody gets privacy in Art's house."),
      H(1028, 1088, "DEEP DIVE", "ART'S HUNGER", "The new movie makes the clown feel more physically interested in eating, not just killing, and the hosts notice the character expansion."),
      H(1096, 1156, "STRAIGHT TO STEVE'S ASSHOLE", "THE WHISTLING SHOPPER", "People who whistle in grocery stores are sent directly to Steve because nobody asked to hear a stranger perform Andy Griffith in aisle four."),
      H(164, 224, "WWAM UP IN YA", "MACARONI IN THE WALL", "A sound from the violence is compared with someone mixing macaroni and cheese behind a wall."),
      H(232, 292, "DEEP DIVE", "ART EATS REGULAR FOOD", "The hosts establish one useful bit of Terrifier lore: unlike Michael Myers and Jason, Art appears to eat actual food."),
      H(300, 360, "SOUNDBYTE / REPLAY", "THE COSTCO HOT DOG", "A blood-soaked mouthful is compared with a Costco hot dog that has gone downhill."),
      H(368, 428, "WWAM UP IN YA", "PEPPERONI, CHEESE, AND COPPER", "The gore is described through pizza, copper, dirt, and a smell that keeps getting more disgusting."),
      H(436, 496, "FAN SIGNAL", "THE WINDOW LOOKS LIKE AMITYVILLE", "A small visual comparison turns the setting into a mash-up of The Crow and the Amityville house."),
      H(504, 564, "TAKE GETS NUCLEAR", "THE KNIFE IS A SEX TOY NOW", "The hosts realize the scene is not just a kill but a sexual response to Art's smell and cannot decide whether to scream or laugh."),
      H(572, 632, "WWAM UP IN YA", "SWAMP-WATER TUNA ASS", "The smell description escalates through swamp water, tuna, and Captain D's mayonnaise."),
      H(640, 700, "SOUNDBYTE / REPLAY", "THE KNIFE ORGASM", "The room hears the character finish and immediately treats the moment as the most cursed sexual payoff in the archive so far."),
      H(708, 768, "STRAIGHT TO STEVE'S ASSHOLE", "THE FACE-RIP AFTERPARTY", "The combination of a face rip and a sexual knife scene gets the strongest possible Steve's Asshole label."),
      H(776, 836, "SYSTEM GLITCH", "THE WIFE TEXTS STOP SCREAMING", "Mike's wife sends a text because the commentary has become loud enough to disturb the house."),
      H(844, 904, "DEEP DIVE", "ART'S BATCAVE WITH A BATHROOM", "The hosts like that the film lets Art exist between kills, showing his private rituals and the disgusting objects around him."),
      H(912, 972, "WWAM UP IN YA", "THE MASTER BLASTER 3000", "Art's weapon test is introduced like a late-night infomercial for a machine that should never be plugged in."),
      H(980, 1040, "SOUNDBYTE / REPLAY", "PLEASE PASS OUT", "The hosts beg a victim to lose consciousness while the movie keeps finding new ways to prolong the damage."),
      H(1048, 1108, "FAN SIGNAL", "THE COLD-OUTSIDE-BLOOD-INSIDE LINE", "A kill gets praised for the contrast between cold skin and hot blood leaking through it."),
      H(1116, 1169, "WWAM UP IN YA", "DEAR DIARY, THE BREAD IS GONE", "Art's diary is rewritten as a grocery crisis followed by a fart, because even the clown's private thoughts need a WWAM button."),
      H(560, 620, "TAKE GETS NUCLEAR", "FAKE SANTA IS WRONG", "A Santa figure feels off, the room calls it immediately, and the payoff rewards the suspicion with a bomb."),
      H(628, 688, "DEEP DIVE", "THE BOMB PREDICTION", "Mike's experience with violent internet footage makes him predict the blast before the movie reveals it."),
      H(696, 756, "STRAIGHT TO STEVE'S ASSHOLE", "SANTA'S CHILDREN'S EXPLOSION", "The holiday iconography gets a hard Steve's Asshole stamp when the blast turns a family scene into a gore receipt."),
      H(764, 824, "WWAM UP IN YA", "ART PISSES ON HIM", "The hosts are not sure whether to be impressed or repulsed when Art adds urination to his list of domestic activities."),
      H(832, 892, "DEEP DIVE", "THE MOVIE UNDERSTANDS ITS MAGIC WEAPONS", "J says the third film is easier to enjoy once the franchise's magical weapons and Hell direction are understood."),
      H(900, 960, "VERDICT", "BETTER THAN TERRIFIER TWO?", "Both hosts place Terrifier 3 above the first film; Mike still keeps Terrifier 2 on top, while J prefers the third's more complete shape."),
      H(968, 1028, "VERDICT", "MIKE GIVES IT AN 8.5", "The rating lands at 8.5 from Mike, with pacing and a clearer story doing most of the work."),
      H(1036, 1096, "VERDICT", "J GIVES IT AN 8.0", "J's 8.0 keeps the enthusiasm high while leaving room for the second film's bigger impact."),
      H(1104, 1164, "FAN SIGNAL", "TERRIFIER FOUR IS NOT THE END", "The hosts expect the immediate story to end but do not believe Art the Clown is going anywhere."),
      H(900, 960, "TAKE GETS NUCLEAR", "SIENNA SHOULD KILL ART IN HELL", "The preferred ending is direct: Sienna goes into Hell, kills Art in the worst way imaginable, and the franchise moves on."),
      H(960, 1020, "STRAIGHT TO STEVE'S ASSHOLE", "ART IS NOT SIENNA'S DAD", "A family twist is rejected as unnecessary mythology when a clean hero-versus-monster ending would do the job."),
      H(1028, 1088, "DEEP DIVE", "THE ANGEL'S ROLE", "The hosts want the angelic mythology to support Sienna without turning the movie into a puzzle box about her father."),
      H(1096, 1156, "FAN SIGNAL", "DAVID HOWARD THORNTON STAYS", "Even if the current story ends, the hosts expect David Howard Thornton to return because Art is too valuable to retire."),
      H(1138, 1169, "CHARACTER PERFORMANCE", "LOOMIS CANNOT RECOVER", "The closing character tag says Loomis cannot recover, Dr. Challis is drunk again, and the Christmas sign-off has become its own little sketch.", ["Dr. Loomis", "Dr. Challis"]),
      H(1146, 1169, "CHARACTER PERFORMANCE", "DR. CHALLIS IS DRUNK AGAIN", "The outro escalates the recurring Challis bit into a deliberately filthy holiday button.", ["Dr. Challis"]),
      H(1148, 1169, "SOUNDBYTE / REPLAY", "THE PATREON HANDOFF", "The hosts point viewers toward the full movie commentary, the existing catalog, and the next live hangout before the character tag detonates."),
      H(1154, 1169, "WWAM UP IN YA", "WHITE-FACED CHRISTMAS MONSTER", "The final music sting turns the Christmas message into a white-faced, profanity-heavy Art-the-Clown goodbye."),
    ]),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 824, end: 930, label: "THE MOVIE FINALLY MAKES SENSE", topic: "Terrifier mythology and pacing", body: "Play from 13:44. J says the third film is easier to enjoy once the magical weapons and Hell direction are clear, while Mike praises its more complete pacing.", playAt: 824, playEnd: 930 }),
      hated: Object.freeze({ at: 960, end: 1040, label: "NO FAMILY-TWIST HOMEWORK", topic: "the ending they do not want", body: "Play from 16:00. The hosts reject making Art Sienna's father or turning Sienna into the next Art; they want the hero to kill the monster and keep the story clean.", playAt: 960, playEnd: 1040 }),
      wildestDetour: Object.freeze({ at: 504, end: 708, label: "THE KNIFE SCENE", topic: "the most deranged Christmas receipt", body: "Play from 8:24. Swamp-water smell, a sexual knife reaction, and a face rip create the exact scene where the watchalong stops being a review and becomes a survival exercise.", playAt: 504, playEnd: 708 }),
      lastWord: Object.freeze({ at: 1138, end: 1169, label: "LOOMIS IS NOT OKAY", topic: "the character-signoff canon", body: "Play from 18:58. The Patreon handoff gives way to Loomis, a drunk Challis, a white-faced Christmas monster, and the smallest but filthiest outro on the tape.", playAt: 1138, playEnd: 1169 }),
    }),
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({
    schema: registry.schema || "shokker-episode-editorial-packs/v1",
    generated: "2026-08-07",
    sources: Object.freeze(sources),
  });
})(typeof window !== "undefined" ? window : globalThis);
