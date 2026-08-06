(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});

  /* November 3, 2025: full-tape read of the Welcome to Derry episode-two recap. */
  sources["qfJFZaC9pTE"] = Object.freeze({
    sourceId: "qfJFZaC9pTE",
    reviewState: "full-tape-human-editorial-read",
    evidence: Object.freeze({
      duration: 3030,
      captionWords: 2485,
      captionEvents: 241,
      captionSpanSeconds: 2930,
      captionDurationCoveragePercent: 96.7,
      captionSha256: "sha256:95769928a0c275976a59fd7c5be8ba6d6c313582dffa0ff1b9079fbc4c1e8b08",
      captionSourceKind: "official YouTube caption ledger",
      audioPass: "canonical YouTube audio + source-local Whisper transcript alignment",
      audioSha256: "42d0a44f300e5b3bc72a06e5565121061a1474bb7dd015dd20f15d2f71322295",
      asrWindowCount: 22,
      speakerAttribution: false,
      visualOutcomeInferred: false,
    }),
    label: "IT WELCOME TO DERRY EPISODE 2 RECAP LIVE // THE AIRBASE WEAPON, PICKLE JUICE, COLD-EYED LOOMIS, AND THE CONJURING BILL",
    badge: "FULL SHOW WIKI // 50:30 OF WELCOME TO DERRY, LADY FOOTBALL, SUPERCHATS, HALLOWEEN-NIGHT ETIQUETTE, AND A CONJURING 4 WARNING",
    headline: "THE WELCOME TO DERRY EPISODE TWO RECAP FINDS THE AIR FORCE DIGGING FOR A WEAPON, THE CHAT ARGUING ABOUT LADY FOOTBALL, AND LOOMIS NARRATING DOOR-OPENING ACTION LIKE A HUMAN STAGE DIRECTION.",
    deck: "A brisk recap with real teeth: a bad Conjuring bet, trailer-spoiler anger, the Derry airbase mystery, Mike Hanlon family lore, pickle-juice body comedy, Halloween neighborhood etiquette, fan cash lanes, a Halloween 4 script-reading memory, and a final warning to wait for Conjuring 4 to hit streaming.",
    overview: "The second Welcome to Derry recap begins with two ugly dudes in the morning and a ten-dollar Conjuring bet that feels like getting robbed by Cambodia and a ladyboy. The hosts are angry that trailers gave away nearly the entire movie, then compare the monster to a hayride mascot and still find a little sympathy in the cheating-wife revenge angle. Sports betting, Packers logic, and a mysterious lady-football phrase fill the first stretch before the show settles into Derry. The episode's airbase plot is the real question: Will Hanlon is framed as Mike Hanlon's father, Dick Hallorann is looking for something, and the Air Force is searching for a weapon buried in Derry. The hosts call that storyline boring while admitting the show is saving Skarsgard and Pennywise for later. The good material is specific: the girl in bed, the pickles, a store scene, a boy being bullied, and the feeling that the episode has one or two sharp scenes trapped inside a lot of setup. The chat supplies the corrections. A fan catches a shoulder detail, another asks about the opening's mob-family massacre, and the Stream Elements lane gets explained as the way to donate without YouTube taking thirty percent. Halloween-night etiquette then becomes a neighborhood story about houses with their lights out and people who deserve the label asshole. The end of the stream is pure WWAM: Loomis-style script narration is mocked as door opens, Loomis enters, line, door shuts; a fan asks for Halloween 2007 versus It 2017; the hosts explain why the Conjuring purchase was not worth ten dollars; and piracy gets described as a vegan holiday. This is a short recap, but it has a clean thesis: Derry is building a mystery, the room wants more Pennywise, and the best evidence is still the weird human stuff around the monster.",
    story: Object.freeze([
      { at: 0, end: 380, label: "THE CONJURING BET GOES BAD", body: "The morning cold open becomes a ten-dollar Conjuring autopsy, with trailer spoilers, Spirit Halloween masks, and a monster who looks like a hayride employee." },
      { at: 381, end: 760, label: "SPORTS BETTING AND LADY FOOTBALL", body: "The hosts compare casual sports betting, Packers knowledge, and a mysterious lady-football phrase that turns a Sunday story into a live vocabulary lesson." },
      { at: 761, end: 1140, label: "JAMES GUNN, DAWN OF THE DEAD, AND THE NEWS LANE", body: "A James Gunn/Joss Whedon correction, Dawn of the Dead memories, and a tip-jar link push the recap toward the Derry episode itself." },
      { at: 1141, end: 1520, label: "THE AIRBASE WEAPON IN DERRY", body: "Welcome to Derry season two speculation centers on Will Hanlon, Mike Hanlon's family, Dick Hallorann, and a weapon buried under the town." },
      { at: 1521, end: 1900, label: "PICKLE JUICE AND THE GOOD SCENES", body: "The hosts call the airbase thread boring but praise the bedroom, store, and pickle-juice scenes that give episode two its actual texture." },
      { at: 1901, end: 2280, label: "THE CHAT CATCHES THE RECEIPTS", body: "Fans correct a visual detail, explain a plot clue, and argue about whether criticism has to be either worship or total destruction." },
      { at: 2281, end: 2660, label: "HALLOWEEN NIGHT AND LOOMIS STAGE DIRECTIONS", body: "Neighborhood trick-or-treat etiquette gives way to a Halloween 4 script-reading memory and a mocking recreation of every action beat as stage directions." },
      { at: 2661, end: 3030, label: "THE CONJURING BILL AND THE PIRACY HOLIDAY", body: "A fan asks about Halloween remakes, the hosts warn viewers not to pay ten dollars for Conjuring 4, and piracy is renamed a vegan holiday before the sign-off." },
    ]),
    highlights: Object.freeze([
      { at: 5, end: 55, category: "WWAM UP IN YA", label: "TWO UGLY DUDES IN YOUR FACE", excerpt: "The morning greeting arrives with legs in the air and a sensor warning, setting the recap's tone before the episode begins." },
      { at: 40, end: 90, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "THE TEN-DOLLAR CONJURING ROBBERY", excerpt: "A bad movie bet feels like getting robbed by Cambodia and a ladyboy, with the refund already emotionally denied." },
      { at: 61, end: 111, category: "TAKE GETS NUCLEAR", label: "SPIRIT HALLOWEEN MASKS", excerpt: "The Conjuring monster is compared to a rubber mask from Spirit Halloween before the room asks why the trailer showed everything." },
      { at: 169, end: 219, category: "WWAM UP IN YA", label: "REDNECK SIMPLE JACK", excerpt: "The movie's axe-wielding figure gets compared to a hayride mascot while the room tries to rescue the character's bad relationship." },
      { at: 249, end: 299, category: "FAN SIGNAL", label: "PACKERS BETTING LOGIC", excerpt: "A household sports-betting argument turns into a Packers quarterback quiz with one answer: the guy who throws touchdowns." },
      { at: 354, end: 404, category: "THE ROOM BREAKS", label: "LADY FOOTBALL", excerpt: "A fan's phrase produces a full investigation into whether lingerie football is a sport or a misunderstood commercial." },
      { at: 410, end: 460, category: "FAN SIGNAL", label: "STREAM ELEMENTS TIP JAR", excerpt: "The hosts explain the tip jar while a chat question is nearly lost because somebody is talking with their jaw hanging open." },
      { at: 858, end: 908, category: "THE ROOM BREAKS", label: "JAMES GUNN, NOT JOSS WHEDON", excerpt: "A name mix-up becomes a live reboot when the host realizes he has been arguing about the wrong director." },
      { at: 952, end: 1002, category: "FAN SIGNAL", label: "DAWN OF THE DEAD STILL WORKS", excerpt: "A fan points to a new Dawn of the Dead video and the room defends the remake despite knowing the original still owns the room." },
      { at: 1186, end: 1236, category: "DEEP DIVE", label: "WELCOME TO DERRY SEASON TWO", excerpt: "The recap finally enters Derry and explains that the airbase plot may be the key to what the town is hiding." },
      { at: 1200, end: 1250, category: "FAN SIGNAL", label: "DALLAS THE UPS DRIVER", excerpt: "Dallas finally makes a stream and the room imagines a bad betting day turning every package into a dartboard." },
      { at: 1240, end: 1290, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "FRAGILE MY ASS", excerpt: "An $8,500 betting loss becomes a delivery route where fragile labels are treated as personal insults." },
      { at: 1420, end: 1470, category: "BEST MOMENT", label: "WE CALLED IT, IT WAS A DREAM", excerpt: "A character wakes up and the hosts celebrate the dream reveal they predicted before the episode finished explaining itself." },
      { at: 1550, end: 1600, category: "DEEP DIVE", label: "WILL HANLON'S FAMILY FILE", excerpt: "Will Hanlon is connected to Mike Hanlon and the Losers Club, giving the episode a real lore hook instead of another jump scare." },
      { at: 1575, end: 1625, category: "WWAM UP IN YA", label: "BURIED IN DERRY ICE CREAM", excerpt: "A buried Air Force weapon is renamed like an ice-cream flavor, because the town's darkest secret apparently comes with sprinkles." },
      { at: 1630, end: 1680, category: "TAKE GETS NUCLEAR", label: "THE AIRBASE STORY IS BORING", excerpt: "The hosts admit the military storyline is boring while the show saves Skarsgard and Pennywise for later episodes." },
      { at: 1648, end: 1698, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "SKARSGARD IS STILL IN THE CLOSET", excerpt: "The room jokes that the entire budget is being saved for three episodes of Skarsgard appearing in Derry." },
      { at: 1775, end: 1825, category: "BEST MOMENT", label: "SMELL MY BREATH", excerpt: "A Conjuring-style jump scare is rejected, but the hosts admit the scene still works because the room got one genuinely good scare." },
      { at: 1795, end: 1845, category: "WWAM UP IN YA", label: "PICKLE JUICE DAD", excerpt: "A store scene turns into a pickle-juice family joke that becomes more memorable than the episode's exposition." },
      { at: 1948, end: 1998, category: "FAN SIGNAL", label: "STONE COLD CATCHES THE SHOULDER", excerpt: "A chat correction lands like a wrestling run-in and saves a detail the hosts had missed." },
      { at: 2000, end: 2050, category: "DEEP DIVE", label: "DERRY'S BULLYING STREET", excerpt: "The episode's street-level cruelty is praised for showing a town where a kid can be beaten in public while everyone pretends not to see." },
      { at: 2235, end: 2285, category: "TAKE GETS NUCLEAR", label: "YOU ARE NOT ALLOWED TO CRITICIZE", excerpt: "The hosts reject the internet's binary: either call a show God's gift or start a podcast dedicated to shitting on it." },
      { at: 2355, end: 2405, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "SEWER GANGBANG", excerpt: "A rumor about the Derry plot is described as a porn-category detour, and the room admits it is still undecided." },
      { at: 2458, end: 2508, category: "FAN SIGNAL", label: "HALLOWEEN LIGHTS-OUT ASSHOLES", excerpt: "People who turn off their lights on Halloween are declared assholes, then apartment living is offered as a defense." },
      { at: 2570, end: 2620, category: "DEEP DIVE", label: "THE MOB FAMILY OPENING", excerpt: "A fan explains the opening's mob-family massacre and connects the cartoon imagery to what Derry's second season may reveal." },
      { at: 2585, end: 2635, category: "CHARACTER PERFORMANCE", label: "PENNYWISE'S TOMMY GUN", excerpt: "Pennywise firing a Tommy gun in the opening art becomes a character receipt the room cannot stop visualizing.", characters: ["Pennywise"] },
      { at: 2815, end: 2865, category: "CHARACTER PERFORMANCE", label: "LOOMIS STAGE DIRECTIONS", excerpt: "The script-reading memory gets reduced to door opens, Loomis enters, line, door shuts, and the room realizes it narrated every action.", characters: ["Dr. Loomis"] },
      { at: 2898, end: 2948, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "WAIT FOR CONJURING 4", excerpt: "The hosts tell viewers to wait for Conjuring 4 to hit streaming because ten dollars was already too much for this experience." },
      { at: 2920, end: 2970, category: "WWAM UP IN YA", label: "PIRACY IS A VEGAN HOLIDAY", excerpt: "Piracy is explained as something bad people do on the internet, then renamed a vegan holiday before the stream ends." },
    ]),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 1775, end: 1825, label: "SMELL MY BREATH", topic: "the small scene that lands", body: "Play from 29:35. One good scare and a pickle-juice scene become the episode's strongest proof that Derry can still work in flashes.", playAt: 1775, playEnd: 1825 }),
      hated: Object.freeze({ at: 1630, end: 1680, label: "THE AIRBASE STORY IS BORING", topic: "the lore thread on trial", body: "Play from 27:10. The military storyline gets the blunt verdict while the hosts wait for Pennywise to return.", playAt: 1630, playEnd: 1680 }),
      wildestDetour: Object.freeze({ at: 2355, end: 2405, label: "SEWER GANGBANG", topic: "the rumor that breaks the recap", body: "Play from 39:15. The Derry plot is briefly described like an adult-video category before the room returns to the actual episode.", playAt: 2355, playEnd: 2405 }),
      lastWord: Object.freeze({ at: 2920, end: 2970, label: "PIRACY IS A VEGAN HOLIDAY", topic: "the final warning", body: "Play from 48:40. The room refuses to recommend the ten-dollar Conjuring experience and leaves on the strangest piracy definition in the canon.", playAt: 2920, playEnd: 2970 }),
    }),
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-06", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
