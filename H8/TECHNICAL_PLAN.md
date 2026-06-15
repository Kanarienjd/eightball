# Technical Plan: Vertical Slice

## Goal

Build a pre-final playable prototype of the first location that demonstrates:

- polished desktop movement and combat;
- the four planned hero attacks;
- a readable difficulty curve;
- one complete action stage;
- a short first rhythm boss;
- fullscreen play;
- local progress saving;
- retry from the boss checkpoint;
- an architecture that can later support mobile controls and two more levels.

The current Canvas prototype remains intact as a reference build while the new
version is developed separately.

## Stack

- Phaser 4
- TypeScript
- Vite
- JSON-driven level and enemy configuration
- browser localStorage for prototype progress
- Web Audio through Phaser for effects, music and rhythm timing

## Scene Flow

```text
Boot
  -> Main Menu
  -> Yellow Hall
  -> Preparation Room
  -> Snow Garden Boss
  -> Results

Defeat in Yellow Hall
  -> Retry Yellow Hall

Defeat in Snow Garden
  -> Retry Snow Garden
  -> Restart Yellow Hall
```

## Source Layout

```text
prototype-v2/
  public/
    assets/
      audio/
      characters/
      environments/
      effects/
      ui/
  src/
    config/
    scenes/
    actors/
    combat/
    enemies/
    rhythm/
    input/
    audio/
    save/
    ui/
    main.ts
  package.json
  tsconfig.json
  vite.config.ts
```

## Input Actions

Gameplay code reacts to named actions rather than physical keys:

- MoveLeft
- MoveRight
- Down
- Jump
- Attack
- Special
- Pause

Desktop mapping:

- A / Left Arrow: MoveLeft
- D / Right Arrow: MoveRight
- S / Down Arrow: crouch
- double-tap S / Down Arrow: drop through a platform
- W / Up Arrow: jump and double jump
- J: Attack
- K: Hat Throw
- L: Spit Projectile
- Escape: Pause

Attack interpretation:

- Attack: tongue strike
- Down + Attack while airborne: ground slam
- Hat Throw passes through selected cover and can hit on the return path
- Spit Projectile is blocked by solid cover

The later mobile layer will produce the same actions through touch controls, so
combat and movement code will not need to be rewritten.

## Save Data

Prototype data stored in localStorage:

```ts
type SaveData = {
  version: 1;
  furthestCheckpoint: "start" | "boss";
  levelOneCompleted: boolean;
  selectedDifficulty: "normal" | "hard";
  settings: {
    musicVolume: number;
    effectsVolume: number;
    fullscreenPreferred: boolean;
    rhythmOffsetMs: number;
  };
};
```

The boss checkpoint is written when the preparation room is entered. A boss
defeat never removes this checkpoint.

## Hero State Machine

- Idle
- StartMove
- Run
- JumpRise
- Fall
- Land
- TongueAttack
- ChargeSpit
- SpitAttack
- GroundSlam
- GroundSlamRecover
- HatThrow
- Hurt
- Defeated
- Victory

Movement and attacks use state rules rather than scattered animation checks.
This keeps controls predictable and makes sprite replacement straightforward.

## Combat Prototype Targets

Initial values are tuning points, not final balance:

| Ability | Range | Main role |
| --- | ---: | --- |
| Tongue | 1.4 hero widths | Fast close attack |
| Hat | 4 hero widths | Returning medium-range attack |
| Spit | 9 hero widths | Limited long-range attack |
| Slam | 2.5 hero widths total | Crowd control and armor break |

The prototype should include:

- hit pause on strong contact;
- small camera shake on slam and heavy damage;
- enemy knockback;
- brief hero invulnerability after damage;
- clear anticipation frames before enemy attacks;
- separate visible sprite bounds and gameplay hitboxes.

## Gameplay Invariants

Level design may change positions, combinations and activation zones, but it
must not silently change the physical rules of an existing object.

- Every projectile type has one speed, radius, damage and maximum travel
  distance everywhere in the game.
- Projectiles expire by travel distance, collision or world bounds, not by
  section-specific timers.
- An enemy archetype keeps the same movement and attack rules in every level.
- Platforms, doors and cover use the same collision rules wherever they appear.
- Encounter difficulty is created through composition and geometry rather than
  hidden per-instance advantages.
- Any intentional variant must be presented as a distinct visible enemy,
  projectile or powerup type.

## First-Level Encounter Curve

1. Safe movement room.
2. One passive Rookie facing away.
3. One active Rookie.
4. Two Rookies with space between them.
5. Elevated High Guard introducing platforming.
6. Sprinter introducing jump-over counters.
7. Shield Guard introducing the slam.
8. Mixed High Guard and Rookie encounter.
9. Captain encounter using tongue and hat.
10. Preparation room with powerups and boss checkpoint.

No encounter should introduce more than one new rule at once.

## First Boss Scope

Target duration: 90-120 seconds.

- three short phases;
- introductory rhythm patterns with a moderate timing window;
- missed notes expose the player to damage;
- successful streaks charge a tongue counterattack;
- one movement break between phases;
- immediate retry from the boss intro;
- no full-level replay required after boss defeat.

Later bosses can target 2-3 minutes and use denser patterns.

## Fullscreen

- a fullscreen command is available from the main menu and pause menu;
- the game keeps a 16:9 internal presentation area;
- UI respects safe areas;
- desktop begins as the primary tuning target;
- touch controls are added after desktop combat is approved.

## Approval Gates

### Gate 1: Movement

Approve acceleration, jump height, stopping distance and camera feel using
temporary art.

### Gate 2: Combat

Approve the four attacks, their ranges and enemy reactions.

### Gate 3: Hero Art

Approve pixel silhouette and key poses before producing full animation sets.

### Gate 4: Level One

Approve encounter pacing and boss retry flow in greybox form.

### Gate 5: Presentation

Replace temporary assets, integrate music and complete the event-ready build.

## Immediate Next Build

The first new playable build will contain:

- one training room;
- temporary geometric character art;
- desktop controls;
- fullscreen toggle;
- all four hero attacks;
- four enemy test stations;
- local save/reset controls;
- no final environment or character animation yet.

This build answers whether the game feels good before art production expands.
