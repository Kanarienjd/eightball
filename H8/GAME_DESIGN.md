# Eight Ball: Reel Rumble

## 1. Core Vision

Browser-first 2D action platformer for desktop and smartphones.

The player controls a black eight ball wearing a tilted hat. The hero has no
arms or legs. His tongue is both part of his body and his primary weapon.

Prototype goals:

- create a pre-final vertical slice suitable for presenting the concept;
- begin with desktop controls, then adapt the same systems for smartphones;
- support fullscreen play;
- provide a noticeable challenge without frequent deaths;
- treat the current hero image as concept art that must be translated into the
  final 8/16-bit visual language.

Visual direction:

- classic 8/16-bit side-scroller silhouette;
- limited palettes tailored to each location;
- readable animation and hit effects over excessive detail;
- strong film-inspired lighting and composition;
- original character designs rather than literal copies of film characters.

Each level has two stages:

1. Action stage: traversal, platforming and regular enemies.
2. Boss stage: a separate arena combining combat and rhythm mechanics.

## 2. Hero Combat Kit

### Tongue Strike

Fast close-range attack and the default combat tool.

- short startup;
- broad horizontal hitbox;
- small forward impulse;
- can interrupt light enemies;
- can be used in the air;
- final frames pull the tongue back into the mouth.

Purpose: quick enemies, close combat, finishing staggered targets.

### Spit Projectile

Long-range shot crossing most of the visible screen.

- limited ammunition or an energy meter;
- slower startup than the tongue;
- weak against armored targets;
- can hit switches and distant shooters;
- upgrades can add piercing or ricochet.

Purpose: elevated shooters, hazards and enemies that punish close approach.

### Ground Slam

Performed in the air with Down + Attack.

- accelerates the hero downward;
- creates a short shockwave on landing;
- damages enemies on both sides;
- breaks fragile floors and armor;
- briefly leaves the hero vulnerable after landing.

Purpose: groups, shielded enemies, destructible routes and vertical encounters.

### Hat Throw

Mid-range special attack covering roughly half the screen.

- travels outward and returns;
- can hit twice;
- briefly exposes the hero without his hat;
- has a cooldown;
- can collect distant powerups on the return path.

Purpose: medium-range enemies, moving targets and risk/reward positioning.

### Basic Mobility

- movement with a short acceleration phase;
- jump with variable height;
- forgiving jump input shortly after leaving a platform;
- buffered jump input shortly before landing;
- bounce from selected enemies and objects;
- brief dodge or fast roll considered only after the core movement feels good.

## 3. Combat Language

Enemies should teach the use of the hero's abilities rather than simply gain
more health.

| Enemy behavior | Intended answer |
| --- | --- |
| Fast melee attacker | Tongue strike or jump-over counter |
| Elevated shooter | Spit projectile or platforming route |
| Armored guard | Ground slam, rear attack or hat return hit |
| Moving mid-range enemy | Hat throw |
| Tight group | Ground slam |
| Reflective enemy | Close-range tongue attack |
| Enemy behind cover | Jump route, slam or returning hat |

The player should normally see one clear threat first. Mixed groups are added
only after each enemy has been introduced safely.

## 4. Difficulty Curve

### Level 1: Yellow Hall

Teaching goals:

- movement and jumping;
- tongue strike;
- avoiding basic melee attacks;
- first elevated enemies;
- first use of the hat throw;
- rhythm boss fundamentals.

Enemy groups remain small. Recovery windows are generous and powerups are
placed before difficult encounters.

### Level 2: Grey City

Teaching goals:

- vertical navigation;
- ranged threats;
- enemies attacking from windows and platforms;
- using the projectile selectively;
- fighting while visibility and timing are disrupted.

Mixed enemy groups appear. Safe ground becomes less reliable.

### Level 3: Red Desert

Teaching goals:

- fighting while wind changes movement;
- longer jumps and moving platforms;
- armored and ranged enemies together;
- ammunition and powerup management;
- multi-phase boss rhythm patterns.

The player is expected to combine all four attacks.

## 5. Level One: Yellow Hall

### Action Stage

Visual identity:

- luminous yellow wall divided into rectangular panels;
- black silhouettes and warm highlights;
- glossy floor reflections;
- foreground silhouettes briefly crossing the camera;
- sparks, broken weapon fragments and restrained red accents.

Gameplay hook:

- a fast, readable combat corridor;
- enemies enter from both screen edges in choreographed waves;
- platforms resemble balcony sections, tables and architectural ledges;
- later waves combine ground attackers with elevated enemies;
- the final corridor tests crowd control without becoming a locked arena.

Enemy types:

1. Rookie: slow approach and clearly telegraphed strike.
2. Sprinter: fast dash that must be jumped or interrupted.
3. High Guard: occupies platforms and throws short-range projectiles.
4. Shield Guard: blocks frontal tongue attacks and teaches the ground slam.
5. Captain: mixes a dash with a delayed counterattack.

### Boss Stage: Snow Garden

Visual identity:

- pale snow and dark blue night;
- bamboo, garden walls and drifting flakes;
- restrained animation between attacks;
- red and yellow accents connect the arena to the action stage.

Boss concept:

- elegant white ball with a narrow blade-like ornament;
- attacks are synchronized with sparse musical phrases;
- missed notes open the player to a sword arc;
- successful streaks charge a counterattack;
- phase two adds falling snow that partially obscures incoming rhythm markers;
- phase three alternates rhythm input with short free-movement attack windows.

## 6. Level Two: Grey City

### Action Stage

Visual identity:

- cool grey-blue New York streets;
- tall buildings forming vertical corridors;
- moving traffic in background layers;
- rain, reflected signs and occasional lightning;
- subdued warm windows used to mark safe routes.

Gameplay hook:

- stronger vertical platforming;
- awnings, fire escapes, vehicles and window ledges;
- rain slightly changes stopping distance;
- lightning briefly exposes enemies hidden in dark windows;
- some enemies can descend from platforms and pursue the player.

Enemy types:

1. Street Runner: basic melee unit with better tracking.
2. Window Shooter: distant threat designed for spit attacks.
3. Raincoat Guard: resistant from the front and vulnerable from above.
4. Acrobat: moves between platforms and pressures the player in the air.
5. Heavy Agent: slow area-denial attacks and high stagger resistance.

### Boss Stage: Hotel Corridor

Visual identity:

- narrow green-grey corridor;
- repeating doors and harsh ceiling lights;
- exaggerated perspective;
- lights fail in rhythm with the music.

Boss concept:

- a large tactical ball with a compact ranged weapon motif;
- rhythm lanes correspond to attacks coming from corridor doors;
- the player alternates between blocking, dodging and counterattacking;
- phase two turns off sections of the lighting;
- phase three compresses the safe space and introduces false visual cues while
  keeping the audio cue honest.

## 7. Level Three: Red Desert

### Action Stage

Visual identity:

- red soil, dry vegetation and wide blue sky;
- strong shadows and distant heat distortion;
- abandoned vehicles, rocks and industrial debris;
- dust particles indicate wind direction.

Gameplay hook:

- wind changes horizontal acceleration and jump distance;
- open ground is dangerous because of distant shooters;
- rocks and vehicles provide temporary cover;
- dust storms create short high-intensity traversal sections;
- optional upper routes reward ammunition and health.

Enemy types:

1. Desert Gunner: long-range pressure from open ground.
2. Scrapper: quick melee enemy using cover.
3. Armored Chemist: requires a slam or rear hit.
4. Drone Ball: airborne target that encourages projectile use.
5. Enforcer: combines ranged bursts with a short charge.

### Boss Stage: Industrial Laboratory

Visual identity:

- polished red floor;
- stainless steel tanks, pipes and fluorescent light;
- warning lamps pulse with the beat;
- chemical vapor affects visibility without hiding rhythm information.

Boss concept:

- calculating boss with a respirator and chemistry-inspired silhouette;
- rhythm patterns represent pressure rising through laboratory equipment;
- successful notes vent pressure and charge attacks;
- missed notes create hazardous floor zones;
- phase two changes the tempo while preserving the same musical motif;
- phase three combines notes, moving hazards and short projectile windows.

## 8. Rhythm Boss Framework

All bosses use a common foundation:

- music-driven note timeline;
- clear perfect, good and miss windows;
- combo multiplier;
- damage proportional to timing accuracy;
- missed notes allow boss damage through;
- powerups can be activated during safe beats;
- three boss phases;
- a short calibration option for Bluetooth audio latency;
- separate difficulty settings affecting patterns, not merely boss health.

Bosses should differ through:

- lane count;
- visual hazards;
- alternation between rhythm and movement;
- tempo changes;
- note types;
- defensive and offensive phases.

The first boss should be shorter than later bosses and function as an
introduction to the rhythm rules.

Progress rules:

- completing the action stage saves a checkpoint before the boss;
- losing during the boss offers an immediate boss-section retry;
- restarting the full level remains available from the pause or defeat screen;
- progress is stored locally in the browser;
- later builds may add level selection for all completed locations.

## 9. Powerups

- Heart: restores health.
- Shield: absorbs one missed-note attack or one action-stage hit.
- Focus: widens timing windows temporarily.
- Extra Shot: restores projectile ammunition.
- Red Tip: increases tongue range for a short time.
- Loaded Hat: removes the next hat cooldown.

Powerups drop from selected enemies and appear on optional platforming routes.
The player can carry a limited number into a boss battle.

## 10. Music Direction

Music should evoke each genre through instrumentation, rhythm and mood without
copying recognizable melodies.

### Yellow Hall

- sharp pentatonic lead;
- driving breakbeat;
- taiko-like 8-bit percussion;
- sparse, tense boss arrangement with deliberate pauses.

### Grey City

- dark trip-hop pulse;
- muted chip bass;
- rain integrated as percussion;
- corridor boss theme built around repeating, claustrophobic phrases.

### Red Desert

- dry western pulse;
- distorted pulse-wave lead;
- industrial percussion;
- laboratory boss theme combining mechanical rhythm with escalating arpeggios.

Deliverables for each level:

- exploration loop;
- combat variation;
- preparation-zone loop;
- boss track with exported beat map;
- victory and defeat stingers;
- short transition cues;
- jump, landing, tongue, spit, slam, hat, hurt and pickup effects.

## 11. Art Production

Hero animation list:

- idle;
- look/react;
- movement start with dust;
- run;
- jump rise;
- fall;
- landing;
- tongue attack;
- spit attack;
- ground slam;
- hat throw and hat return;
- hurt;
- defeat;
- victory;
- boss-phase emotions.

Production order:

1. Approve silhouette and proportions.
2. Create rough key poses.
3. Test animation timing in the game.
4. Add in-between frames.
5. Apply final palette and pixel cleanup.
6. Add particles and hit effects as separate assets.

The hero remains readable as a black ball. Highlights, mouth shape, tongue and
hat angle carry most of the animation. No arms or legs are introduced.

## 12. Production Plan

### Milestone A: Combat Prototype

- Phaser and TypeScript foundation;
- final-feeling movement;
- four hero attacks using temporary art;
- one training room;
- one example of every enemy counter relationship.
- desktop keyboard controls;
- fullscreen support;
- local progress and boss checkpoint.

### Milestone B: Level One Vertical Slice

- finished hero animation;
- Yellow Hall art;
- five enemy types;
- Snow Garden boss;
- full music and sound pass;
- mobile performance and control tuning.

### Milestone C: Content Pipeline

- visual level editor workflow;
- reusable enemy configuration;
- reusable boss rhythm editor/data format;
- save system and level selection;
- automated web deployment.

### Milestone D: Levels Two and Three

Each level is completed as a full cycle:

1. Greybox.
2. Enemy and platforming test.
3. Art pass.
4. Boss mechanics.
5. Music and sound.
6. Mobile balancing.

## 13. Collaboration

Player and creative director:

- approves silhouettes, palettes and key poses;
- supplies location references;
- chooses the emotional direction of each level;
- tests builds on a real smartphone;
- records concrete feedback with screenshots or short videos;
- prioritizes which abilities and enemies feel essential.

Codex:

- maintains the technical architecture;
- builds mechanics, enemy AI and boss systems;
- integrates sprites, music and sound;
- creates playable greyboxes;
- generates visual concepts and animation drafts;
- tests desktop and mobile layouts;
- publishes review builds.

Each feature should move through:

1. Written intent.
2. Rough playable version.
3. Visual draft.
4. Smartphone test.
5. Final polish.
