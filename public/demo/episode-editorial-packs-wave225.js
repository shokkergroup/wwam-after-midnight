(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "mboTGaGnU_M";
  var duration = 11196;
  var H = function (at, end, category, label, excerpt, characters) {
    var item = {
      at: Math.max(0, Math.round(at)),
      end: Math.min(duration, Math.max(Math.round(at) + 1, Math.round(end))),
      category: category,
      label: label,
      excerpt: excerpt,
      sourceId: sourceId,
      evidenceState: "machine surfaced; full-caption/audio second read; playback remains the authority"
    };
    if (characters) item.characters = characters;
    return item;
  };

  /* May 9, 2024: the promised 80s-versus-90s bracket becomes a four-hour
     WWAM memory machine. The useful unit is not a decade verdict; it is the
     way a poll summons Jason, Batman, Blockbuster, N64, grieving FAM members,
     and a chat that will absolutely pick Toy Story 2 over Temple of Doom. */
  var highlights = [
    H(0,180,"OPENING READ","THE STORM DELAYS THE DECADE WAR","The stream opens in bad weather, with technical trouble, a court appearance, a peppermint story, and the immediate failure of the promise not to curse.") ,
    H(180,360,"COMEDY READ","TRAFFIC COURT WITH A SIDE OF GHOSTBUSTERS","A traffic-ticket story becomes a courtroom impression, a Ghostbusters swing-door comparison, and a confession that the room was surrounded by prostitutes and shoplifters.") ,
    H(360,540,"HEALTH CHECK-IN","THE CIGARETTE RELAPSE FANTASY","One host talks about the sudden urge to buy a pack after quitting. The other tries to be the responsible friend and immediately makes the warning filthy.") ,
    H(540,720,"CHARACTER PERFORMANCE","SMITH'S GROVE BOILER-MAKER NIGHT","A fan schedules a Wednesday meeting for Loomis and Challis. Loomis insults Michael's smell, Challis welcomes the open bar, and the doctors become the stream's first recurring bit.",["Dr. Loomis","Dr. Challis"]),
    H(720,900,"HORROR READ","THE CRYSTAL LAKE CANCELLATION THAT WASN'T","A rumor that the Friday the 13th television project was dead is walked back in real time. The correction matters because the room is trying to separate a headline from what the production actually said.") ,
    H(900,1080,"HORROR READ","A24 RE-TOOLS THE FRIDAY SHOW","The reported change in direction becomes a debate about whether a new showrunner, a new angle, and a new studio can still feel like Friday the 13th without sanding Jason down.") ,
    H(1080,1260,"HORROR LORE","PAMELA IS IMPORTANT; JASON IS THE ENGINE","The hosts give Pamela Voorhees her place in the origin story, then argue that the audience returns for Jason, the woods, the kills, and the recognizable shape of a Friday movie.") ,
    H(1260,1440,"HORROR READ","JUST GIVE US THE JASON DOLLAR MENU","The strongest anti-overcomplication thesis on the tape: Jason does not need a prestige trilogy or a lore maze. Put him in the woods, give him campers, and let the big guy work.") ,
    H(1440,1620,"HORROR READ","THE TV VERSION NEEDS A TOMMY","The counterargument is that a series needs people worth following. Tommy Jarvis, a survivor, or a new protagonist can supply the human spine while Jason remains the reason viewers showed up.") ,
    H(1620,1800,"HORROR READ","WHY HALLOWEEN AND FREDDY NEED MORE HERO","The hosts separate Friday's replaceable victims from Halloween and Nightmare, where Loomis, Nancy, and a real final survivor give the franchise emotional continuity.") ,
    H(1800,1980,"FORMAT SIGNAL","COURTNEY GETS THE POLL BOARD","The promised 80s-versus-90s game begins with Courtney handling chat polls. The show announces that movies will wait until the final stretch, so the first half can be toys, television, games, and memories.") ,
    H(1980,2160,"FILM READ","VICKY VALE VERSUS CHASE MERIDIAN","Batman 1989's Kim Basinger beats Batman Forever's Nicole Kidman in the room's first poll. Vicky feels like Batman's woman; Chase arrives with a bat-signal-sized fixation on Bruce's trauma.") ,
    H(2160,2340,"COMEDY READ","THE SOUP-SCENTED BAT CAVE","The Batman discussion swerves into Kim Basinger, red lipstick, Campbell's soup hair, and a ridiculous theory that Chase would smell like dinner when she rolled over in bed.") ,
    H(2340,2520,"HORROR READ","HALLOWEEN KILLS GETS A SECOND LOOK","The hosts revisit their first Halloween Kills reaction and ask whether the movie's bad dialogue has distracted everyone from the rare pleasure of seeing Michael completely unleashed.") ,
    H(2520,2700,"HORROR READ","THE ROMAN-CANDLE DEFENSE","Halloween Kills is compared to a cheap Roman candle: bright, violent, briefly magnificent, and over before anyone has decided whether they enjoyed it. The comparison explains both its fans and its haters.") ,
    H(2700,2880,"HORROR LORE","FRIDAY RIGHTS MAKE EVERY PLAN FRAGILE","The conversation turns to stalled Friday projects, legal ownership, and the exhausting pattern of fans getting excited for an announcement only to watch it disappear.") ,
    H(2880,3060,"FAM SIGNAL","THE NEW SUPERMAN REVEAL LANDS IN CHAT","A viewer asks for thoughts on the new Superman image. The answer is immediate: the actor looks like a wish.com Henry Cavill, but the room still wants the film to succeed.") ,
    H(3060,3240,"FILM READ","THE KINGDOM-COME SHIELD AND THE BAGGY SUIT","The hosts parse the emblem, boots, red trunks, high collar, dark lighting, and battle-worn texture. The argument is specific enough to be useful even while the jokes keep kicking the door in.") ,
    H(3240,3420,"COMEDY READ","THE INTERNET IS MAD ABOUT SUPERMAN PUTTING ON SHOES","A simple costume reveal gets treated like a constitutional crisis. The hosts mock the Snyder-verse pile-on while admitting they would rather see a good Superman movie than win another internet argument.") ,
    H(3420,3600,"CHARACTER PERFORMANCE","CHALLIS PRESCRIBES SEVENTEEN BOILER MAKERS","A fan asks Dr. Challis how to cut back. Challis recommends a medically catastrophic amount of alcohol, then adds the disclaimer that the doctor is a character and the audience should not try it.",["Dr. Challis"]),
    H(3600,3780,"NOSTALGIA READ","TMNT TOYS VERSUS 90S X-MEN","The 80s' Ninja Turtles face the 90s' X-Men toys. Weapon X Wolverine, Cyclops' light-up eyes, the Blackbird, and the Sentinel make the X-Men side feel like an entire toy aisle.") ,
    H(3780,3960,"COMEDY READ","MR. SINISTER NEVER GOT HIS MOVIE","A memory of the 90s Mr. Sinister toy becomes a pitch for a villain-centered X-Men film. The room blames Apocalypse's weak script, then gets distracted by Jim Lee's extremely muscular Cyclops.") ,
    H(3960,4140,"COMEDY READ","BLOODSPORT GETS THE WRONG KIND OF 2024 UPDATE","A fan quotes Bloodsport. The hosts can reproduce the exchange, then immediately point out how the same dialogue would sound if an old man invited a young fighter into a bedroom today.") ,
    H(4140,4320,"NOSTALGIA READ","SATURDAY MORNINGS VERSUS 90S TV","Unsolved Mysteries, Rescue 911, Tales from the Crypt, Real Sex, Nickelodeon, and Batman: The Animated Series get folded into the decade argument. The shared memory is appointment television, not a genre list.") ,
    H(4320,4500,"NOSTALGIA READ","THE 90S WIN BECAUSE OF N64","Growing up in the 90s means Nintendo 64, Super Nintendo, Blockbuster, and the ability to make a Saturday night feel like an event. The vote is not objective; it is autobiographical.") ,
    H(4500,4680,"MUSIC READ","KENDRICK VERSUS DRAKE TAKES OVER THE ROOM","A decade poll suddenly becomes a live verdict on the Kendrick Lamar/Drake beef. The hosts argue that the diss tracks made a better gym playlist than either rapper's public-relations team deserved.") ,
    H(4680,4860,"MUSIC READ","KENDRICK WINS THE 89–11 RECEIPT","The chat backs Kendrick by a landslide. The hosts announce the result as though WWAM has just ended the rap conflict for the entire internet, then send Drake back to the mirror.") ,
    H(4860,5040,"FAM SIGNAL","CHRIS STUCKMANN ENTERS AS A MYSTERY MAN","A fan mentions Mike Flanagan executive-producing Chris Stuckmann's film. One host knows exactly who Stuckmann is; the other asks who the hell that is, creating a recurring YouTube-critic bit.") ,
    H(5040,5220,"CHARACTER PERFORMANCE","TENNESSEE MADE 731 GETS THE LOOMIS HELLO","A recurring viewer asks for a shoutout. Loomis greets Tennessee Made and the kids, then the chat asks for the same greeting again until the hosts realize they have created a customer-service loop.",["Dr. Loomis"]),
    H(5220,5400,"META READ","AUTHENTICITY VERSUS THE NICE REVIEW","The show defends critics who say a movie is bad. The point is blunt and useful: fans can disagree with the verdict, but a reviewer who hides the verdict to avoid looking negative is selling the audience a lie.") ,
    H(5400,5580,"CHARACTER PERFORMANCE","PACERS, KNICKS, AND THE QVC DIVORCE PLAN","NBA stress and a fan asking Challis and Loomis to break up his marriage become one lane. The doctors prescribe cancelling a QVC subscription, then Challis offers to keep the wife busy for seven minutes.",["Dr. Loomis","Dr. Challis"]),
    H(5580,5760,"NOSTALGIA READ","THE SATURDAY-NIGHT SLEEPOVER STARTER PACK","Kool-Aid cups and a plastic-covered couch face Pizza Hut, Capri Sun, Blockbuster, The Sandlot, GoldenEye, Smash Bros., WCW versus the nWo, and Mario Kart. The 90s are ahead before the poll is even posted.") ,
    H(5760,5940,"POLL RECEIPT","BLOCKBUSTER WINS THE 84–16","Chat chooses the 90s Saturday-night pack 84% to 16%. The hosts call the 90s Barry Bonds and the 80s an honest baseball player, then admit the comparison is unfair because Blockbuster is a cheat code.") ,
    H(5940,6120,"FAM SIGNAL","DALLAS GETS A QUIET GRIEF RECEIPT","Dallas says the stream is a three-hour escape after laying his father to rest. The hosts stop the jokes long enough to acknowledge the loss and explain that grief changes shape rather than disappearing.") ,
    H(6120,6300,"CHARACTER PERFORMANCE","PARKER BENNINGTON GETS A LOOMIS SCOLDING","A viewer asks for a character shoutout to a puppy. Loomis first goes too far, then corrects the line into a ridiculous but harmless carpet-pooping warning.",["Dr. Loomis"]),
    H(6300,6480,"NOSTALGIA READ","DONKEY KONG 64 COMES BACK FROM THE DEAD","A fan reminds the hosts about Donkey Kong 64. The game gets its Christmas-memory defense, alongside Super Mario 64, Ocarina of Time, and GoldenEye as the N64 shelf that shaped the decade.") ,
    H(6480,6660,"ARCADE READ","MORTAL KOMBAT IS THE 90S ARCADE ENGINE","Donkey Kong, Tetris, Double Dragon, Pac-Man, and Mario face The Simpsons, Time Crisis, Mortal Kombat, X-Men, and Cruis'n USA. The room gives the 90s the edge because Mortal Kombat arrived like a cultural explosion.") ,
    H(6660,6840,"FORMAT SIGNAL","THE BOX-OFFICE BRACKET FINALLY STARTS","After the nostalgia rounds, the hosts switch to ranked box-office matchups. The format is now pure movie debate: 90s titles on the left, 80s titles on the right, and chat opinions invited even when formal polls fail.") ,
    H(6840,7020,"FILM READ","TITANIC VERSUS E.T. AND JEDI VERSUS PHANTOM MENACE","E.T. beats Titanic as a movie even while Titanic's effects get respect. Return of the Jedi crushes The Phantom Menace, with Darth Maul the one serious defense of the 90s side.") ,
    H(7020,7200,"FILM READ","EMPIRE STRIKES BACK VERSUS THE LION KING","One host picks The Lion King over Empire Strikes Back and gets treated like a public menace. Chat ultimately gives Empire the 59–41 win, but the Lion King heresy becomes part of the show's canon.") ,
    H(7200,7380,"FILM READ","BATMAN BEATS JURASSIC PARK ON TASTE","Jurassic Park's effects and Velociraptors are acknowledged, but 1989 Batman wins because Michael Keaton and Tim Burton rebuilt the character after the Adam West camp era.") ,
    H(7380,7560,"FILM READ","FORREST GUMP VERSUS RAIDERS","The room goes with Forrest Gump's soundtrack, character, and feel-good endurance over Raiders of the Lost Ark, while still admitting Indiana Jones is an icon and the choice is sacrilege to some listeners.") ,
    H(7560,7740,"FILM READ","GHOSTBUSTERS VERSUS INDEPENDENCE DAY","Ghostbusters wins for the comedy cast, effects, and tiny character beats. Independence Day gets its own defense as the first summer crowd-pleaser that made the audience stand up and clap.") ,
    H(7740,7920,"FILM READ","BEVERLY HILLS COP VERSUS THE SIXTH SENSE","Eddie Murphy's endlessly watchable action-comedy beats The Sixth Sense's twist in the room. The hosts explain that the twist remains clever, but the rewatch engine belongs to Axel Foley.") ,
    H(7920,8100,"HORROR READ","THE FRIDAY GAME'S PARANOID JASON MODE","A fan describes an unreleased mode where one survivor could become Jason without anyone knowing. The hosts blame the rights fight for killing a genuinely fresh idea and defend Gun Media's work for the fans.") ,
    H(8100,8280,"META READ","THE SHOW INVENTS YOUTUBE CRITIC BEEF","Chris Stuckmann's name returns and the room imagines a feud between movie-review channels. The joke grows into a real point about reaction videos, rap-beef breakdowns, and how quickly internet arguments become a second job.") ,
    H(8280,8460,"FAM SIGNAL","ADRIAN'S MISSING SUPER CHAT","The hosts spend several minutes hunting for Adrian's allegedly missed message, promise a cash reimbursement if it exists, blame YouTube, then apologize when the receipt refuses to materialize.") ,
    H(8460,8640,"FAM SIGNAL","TINA IS COOLER THAN TINA FROM HALLOWEEN 5","A kind message from Tina becomes a callback to the worst Tina in the Halloween franchise. The hosts thank the real Tina while making sure the fictional one remains permanently banned from the room.") ,
    H(8640,8820,"FILM READ","BACK TO THE FUTURE BEATS HOME ALONE","Back to the Future wins for Bob Gale's time-travel design, Michael J. Fox, Christopher Lloyd, and the rare feeling of a movie that can still work fifty years from now. Home Alone gets a sincere underdog defense.") ,
    H(8820,9000,"FILM READ","MEN IN BLACK VERSUS LAST CRUSADE","The room splits between Men in Black's soundtrack, chemistry, and poolside CD memory and Indiana Jones and the Last Crusade's Ford/Connery pairing. Chat gives Men in Black the close 61–40 win.") ,
    H(9000,9180,"FILM READ","TOY STORY 2 STARTS A CIVIL WAR","One host calls Temple of Doom the best Indiana Jones movie; the other says Toy Story 2 wins. The argument turns into an intervention, a mayonnaise smell accusation, and a declaration that Toy Story 2 is a bad copy of the first film.") ,
    H(9180,9360,"FILM READ","TWISTER BEATS TOP GUN ON REWATCH INSTINCT","Top Gun's soundtrack and dogfights get their due, but Twister wins because the F5 sequence with The Shining at the drive-in is still terrifying and the movie feels like a 90s VHS essential.") ,
    H(9360,9540,"META READ","THE PATREON DOOR AND THE TWISTER RECEIPT","The hosts point viewers toward the unrated archive and reveal that Twister is already part of the commentary catalog. The plug is also a map for anyone who wants to follow this debate into a full watchalong.") ,
    H(9540,9720,"FAM SIGNAL","X-MEN 97, FALLOUT, AND TITANIC ON VHS","A late chat wave jumps from X-Men 97 and Fallout to a found copy of Titanic on VHS. The stories make the archive feel like a living fan room instead of a finished list.") ,
    H(9720,9900,"FILM READ","DONNIE DARKO AS A FIRST-WATCH GIFT","A fan who has never seen Donnie Darko is treated like someone holding a winning lottery ticket. The hosts envy the chance to experience the first reaction to Frank and the ending all over again.") ,
    H(9900,10080,"COMEDY READ","KFC AND THE HIGH-SCHOOL HERPES STORY","A late-night food question becomes a brutally personal high-school story about a date, a warning from a friend, and the kind of overshare that explains why the unrated archive exists.") ,
    H(10080,10260,"HORROR READ","BLAIR WITCH VERSUS GREMLINS","The horror bracket uses box office: The Blair Witch Project takes the 90s slot against Gremlins, with the hosts turning found-footage sexiness and a haunted forest into a very WWAM kind of sales pitch.") ,
    H(10260,10440,"HORROR READ","POLTERGEIST GETS THE SPIELBERG RECEIPT","Poltergeist is defended as a top-ten horror film, with the Spielberg/Tobe Hooper collaboration and the film's long runtime becoming part of the argument rather than a footnote.") ,
    H(10440,10620,"MUSIC READ","PRINCE VERSUS MICHAEL JACKSON","A fan asks for an 80s/90s music matchup. The room gives Prince the personal pick, separates music from celebrity behavior, and then gets lost in a debate about strange names, children, and a pet monkey.") ,
    H(10620,10800,"NOSTALGIA READ","CARTOON NETWORK, COW AND CHICKEN, AND ADULT SWIM","Cartoon Network memories bring up Cow and Chicken, The Venture Bros., Doug, and the fact that one host was watching WCW instead of cartoons. The cultural map keeps widening after the movie bracket ends.") ,
    H(10800,10980,"META READ","THE CRITIC WHO NEVER SAYS ANYTHING CONTROVERSIAL","Chris Stuckmann returns as a symbol of the safe-review problem. The hosts argue that a critic can be popular and still be useless if every opinion is sanded down until no one can disagree with it.") ,
    H(10980,11100,"POLL RECEIPT","SCREAM 2 SQUEAKS PAST PREDATOR","The final horror poll sits at 50/50 until a swing vote arrives. Scream 2 wins, shocking the room and proving that chat is willing to choose chaos over the obvious Predator answer.") ,
    H(11100,11196,"CLOSING READ","THE SHOW ENDS IN A PRIVATE JOKE","The closing minutes collapse into mutual threats, a deliberately ridiculous sexual dare, and a goodbye that feels less like a sign-off than two friends refusing to stop the bit.")
  ];

  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-08 fine-toothed full-tape editorial read; local official caption ledger and canonical audio alignment across the May 9, 2024 live stream",
    evidence: Object.freeze({
      duration: duration,
      captionWords: 40741,
      captionEvents: 10196,
      captionSpanSeconds: 11196.64,
      captionDurationCoveragePercent: 100.0,
      captionSha256: "83b798fe7bd2d6e2676b18c7dcec98cbaf3d8c94084b5c45fa34738fde036fd3",
      captionSourceKind: "source-local official YouTube caption ledger acquired as JSON",
      audioPass: "canonical YouTube audio + source-local caption alignment; local audio available for playback verification; playback remains the authority",
      audioSha256: "96406961920d69513d34cac1c809cd8d8987fea5a429d2e2905153b4ca09781d",
      asrWindowCount: 47,
      speakerAttribution: false,
      visualOutcomeInferred: false
    }),
    label: "WEDNESDAY NIGHT LIVE // MAY 9, 2024",
    badge: "FULL SHOW WIKI // 80S VS 90S, JASON, BATMAN, N64, AND THE BOX-OFFICE BRACKET",
    headline: "THE 90S WIN THE POLL; THE 80S KEEP THE RECEIPTS",
    deck: "A long live room where Friday rights, Superman's suit, Batman's women, Blockbuster, Mortal Kombat, Twister, and a chat willing to pick Scream 2 over Predator all become part of one decade argument.",
    overview: "The May 9, 2024 stream promises an 80s-versus-90s contest and then spends the first half proving that no WWAM argument stays in its lane. A storm and a traffic-court story open the room. Dr. Loomis and Dr. Challis schedule a Smith's Grove boiler-maker night. A rumor about the Crystal Lake series being cancelled turns into a more careful discussion of A24, the reported creative change, Pamela Voorhees, Jason's place in the franchise, and whether a television version needs a Tommy Jarvis-style human spine. Batman 1989 beats Batman Forever's Chase Meridian in the first poll, Halloween Kills gets a second-look defense as a bright but cheap Roman candle, and a new Superman reveal is dissected down to the Kingdom Come shield, red trunks, high collar, boots, lighting, and the internet's irrational anger at a man putting on shoes. The decade game then moves through Ninja Turtles versus X-Men toys, Mr. Sinister, Bloodsport, Saturday-morning television, Blockbuster, N64, and the arcade argument that makes Mortal Kombat the 90s' defining machine. The movie bracket finally arrives as a box-office speed round: E.T. over Titanic, Return of the Jedi over The Phantom Menace, Batman over Jurassic Park, Forrest Gump over Raiders, Ghostbusters over Independence Day, Beverly Hills Cop over The Sixth Sense, Back to the Future over Home Alone, and Men in Black over The Last Crusade in a close chat vote. The most memorable fight is Toy Story 2 versus Temple of Doom, where an Indiana Jones defense triggers an intervention, a mayonnaise accusation, and a refusal to accept the chat's answer. Twister beats Top Gun on 90s rewatch instinct. The late show keeps widening: a Friday game mode where one survivor could become Jason, a missing Super Chat, Tina versus Halloween 5's Tina, Donnie Darko as a first-watch gift, Blair Witch versus Gremlins, Poltergeist's Spielberg/Hooper legacy, Prince versus Michael Jackson, Cartoon Network, and Scream 2 edging Predator. This is not a decade essay. It is a memory map of what the FAM actually argues about when someone asks which era was better.",
    topics: Object.freeze(["80s vs 90s", "Friday the 13th / Crystal Lake", "Jason Voorhees", "Halloween Kills", "Batman 1989", "Superman", "N64 and Blockbuster", "Mortal Kombat", "Twister", "Back to the Future", "Dr. Loomis", "Dr. Challis", "The FAM"]),
    highlights: Object.freeze(highlights),
    story: Object.freeze([
      { at: 0, end: 1800, label: "THE STORM, COURT, AND CRYSTAL LAKE RUMOR", body: "Technical trouble and a traffic-court story give way to the A24/Crystal Lake debate, with Pamela, Jason, rights, and the question of how much story Friday actually needs." },
      { at: 1800, end: 3420, label: "BATMAN, HALLOWEEN KILLS, AND SUPERMAN'S SUIT", body: "Polls start with Vicky Vale versus Chase Meridian, then the room revisits Halloween Kills and argues over a divisive Superman reveal without pretending the internet is sane." },
      { at: 3420, end: 4500, label: "LOOMIS, CHALLIS, X-MEN TOYS, AND BLOODSPORT", body: "Character performances, toy memories, Mr. Sinister, and a Bloodsport quote make the 80s/90s game feel like an actual childhood instead of a demographics report." },
      { at: 4500, end: 5580, label: "KENDRICK, CRITICS, AND THE FAM WALL", body: "The Kendrick/Drake verdict, Chris Stuckmann confusion, Tennessee Made, criticism, the NBA, and a Challis marriage intervention turn the chat into a living community archive." },
      { at: 5580, end: 6660, label: "THE 90S SLEEPOVER AND THE ARCADE WIN", body: "Blockbuster, Pizza Hut, N64, Donkey Kong 64, Mortal Kombat, and the technology argument give the 90s an 84–16 and a 78–22 victory before the movie bracket begins." },
      { at: 6660, end: 7920, label: "BOX OFFICE: E.T., JEDI, BATMAN, FORREST GUMP, GHOSTBUSTERS", body: "The movie speed round starts with E.T. over Titanic, Jedi over Phantom Menace, Batman over Jurassic Park, Forrest Gump over Raiders, and Ghostbusters over Independence Day and The Sixth Sense." },
      { at: 7920, end: 8460, label: "FRIDAY GAME AND THE YOUTUBE CRITIC BEEF", body: "The unreleased paranoid Jason mode, the Stuckmann critic bit, and a missing Super Chat turn a movie bracket into a live argument about rights, reaction videos, and internet jobs." },
      { at: 8460, end: 9180, label: "TINA, BACK TO THE FUTURE, AND THE TOY STORY WAR", body: "Tina gets a warm Halloween callback, Back to the Future and Men in Black fight for the 80s/90s crown, and Toy Story 2 versus Temple of Doom makes the room temporarily ungovernable." },
      { at: 9180, end: 10260, label: "TWISTER, DONNIE DARKO, AND THE LATE-NIGHT FAM", body: "Twister beats Top Gun, the Patreon archive gets a doorway, a fan receives grief and movie recommendations, and Donnie Darko is framed as a once-in-a-lifetime first watch." },
      { at: 10260, end: 11196, label: "HORROR, MUSIC, CARTOONS, AND SCREAM 2", body: "Blair Witch, Poltergeist, Prince, Michael Jackson, Cartoon Network, critics, and the final Scream 2-versus-Predator swing vote close the night in exactly the wrong order and the right spirit." }
    ]),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 5580, end: 5760, label: "THE 90S SLEEPOVER WINS", topic: "Blockbuster, Pizza Hut, and N64 beat the plastic couch", body: "Play from 1:33:00. The 90s starter pack is a fan-memory supercut: Saturday-night rentals, GoldenEye, WCW versus the nWo, and the feeling that a sleepover was an event.", playAt: 5580, playEnd: 5760 }),
      hated: Object.freeze({ at: 2340, end: 2520, label: "HALLOWEEN KILLS GETS THE REWATCH AUTOPSY", topic: "bad dialogue versus Michael finally going feral", body: "Play from 39:00. The hosts do not erase the eye-roll lines; they ask whether the movie's unleashed Michael has been unfairly buried under them.", playAt: 2340, playEnd: 2520 }),
      wildestDetour: Object.freeze({ at: 8820, end: 9000, label: "TOY STORY 2 STARTS AN INTERVENTION", topic: "Temple of Doom, mayonnaise, and a movie-night civil war", body: "Play from 2:27:00. A normal bracket prompt becomes an intervention for Mike, a smell accusation, and a claim that Toy Story 2 cannot touch its predecessor.", playAt: 8820, playEnd: 9000 }),
      lastWord: Object.freeze({ at: 10980, end: 11100, label: "SCREAM 2 STEALS THE HORROR POLL", topic: "the swing vote that beats Predator", body: "Play from 3:03:00. The vote sits at 50/50, then Scream 2 wins and leaves the room genuinely shocked that chat chose the less obvious answer.", playAt: 10980, playEnd: 11100 })
    })
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-08", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
