const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const SPRITE_VERSION = "20260618-kitchen-complete-fixed";
const versioned = (path) => `${path}?v=${SPRITE_VERSION}`;

const ui = {
  shell: document.querySelector(".game-shell"),
  answerReveal: document.getElementById("answerReveal"),
  answerRevealValue: document.getElementById("answerRevealValue"),
  mode: document.getElementById("modeLabel"),
  stars: document.getElementById("starCount"),
  bugs: document.getElementById("bugCount"),
  quests: document.getElementById("questCount"),
  questGoal: document.getElementById("questGoal"),
  question: document.getElementById("questionText"),
  questionPanel: document.getElementById("questionPanel"),
  feedback: document.getElementById("feedbackText"),
  storyPanel: document.getElementById("storyPanel"),
  story: document.getElementById("storyText"),
  answers: document.getElementById("answers"),
  collectionPanel: document.getElementById("collectionPanel"),
  collectionSummary: document.getElementById("collectionSummary"),
  collectionList: document.getElementById("collectionList"),
  jarImage: document.getElementById("jarImage"),
  activityOverlay: document.getElementById("activityOverlay"),
  activityStage: document.getElementById("activityStage"),
  activityTitle: document.getElementById("activityTitle"),
  activityDiscoveryImage: document.getElementById("activityDiscoveryImage"),
  activityPraiseSticker: document.getElementById("activityPraiseSticker"),
  activityDescription: document.getElementById("activityDescription"),
  activityPrimary: document.getElementById("activityPrimary"),
  activityExit: document.getElementById("activityExit"),
  musicToggle: document.getElementById("musicToggle"),
  gameOst: document.getElementById("gameOst"),
  parentEntry: document.getElementById("parentEntry"),
  parentOverlay: document.getElementById("parentOverlay"),
  parentClose: document.getElementById("parentClose"),
  parentAuthView: document.getElementById("parentAuthView"),
  parentDashboardView: document.getElementById("parentDashboardView"),
  parentAuthForm: document.getElementById("parentAuthForm"),
  parentQuestion: document.getElementById("parentQuestion"),
  parentAnswer: document.getElementById("parentAnswer"),
  parentAuthMessage: document.getElementById("parentAuthMessage"),
  parentCopy: document.getElementById("parentCopy"),
  parentRefresh: document.getElementById("parentRefresh"),
  parentExport: document.getElementById("parentExport"),
  parentImport: document.getElementById("parentImport"),
  parentImportFile: document.getElementById("parentImportFile"),
  parentCopyStatus: document.getElementById("parentCopyStatus"),
  parentHintRatio: document.getElementById("parentHintRatio"),
  parentTrendSummary: document.getElementById("parentTrendSummary"),
  parentDailyTrend: document.getElementById("parentDailyTrend"),
  nayeonHintPanel: document.getElementById("nayeonHintPanel"),
  nayeonHintImage: document.getElementById("nayeonHintImage"),
  nayeonHintTitle: document.getElementById("nayeonHintTitle"),
  nayeonHintText: document.getElementById("nayeonHintText"),
  nayeonTryNumber: document.getElementById("nayeonTryNumber"),
  nayeonTryDrag: document.getElementById("nayeonTryDrag"),
};

let answerRevealTimer = null;

function showAnswerReveal(value) {
  if (!ui.answerReveal || !ui.answerRevealValue || value === null || value === undefined) return;
  if (answerRevealTimer) clearTimeout(answerRevealTimer);
  ui.answerRevealValue.textContent = String(value);
  ui.answerReveal.classList.add("is-hidden");
  void ui.answerReveal.offsetWidth;
  ui.answerReveal.classList.remove("is-hidden");
  answerRevealTimer = setTimeout(() => {
    ui.answerReveal?.classList.add("is-hidden");
    answerRevealTimer = null;
  }, 2000);
}

function setFeedback(text, tone = "normal") {
  if (!ui.feedback) return;
  ui.feedback.textContent = text;
  ui.feedback.classList.toggle("is-wrong", tone === "wrong");
}

function setQuestion(text, tone = "normal") {
  if (!ui.question) return;
  ui.question.textContent = text;
  ui.question.classList.toggle("is-wrong", tone === "wrong");
}

const progressiveInputStyles = document.createElement("style");
progressiveInputStyles.textContent = `
  .question-panel.has-number-pad { width: min(860px, calc(100% - 32px)); min-height: 174px; }
  .question-panel.is-hint-stage { box-shadow: 0 0 0 8px rgba(211,229,178,.2), 0 5px 0 rgba(108,78,45,.12), 0 10px 20px rgba(65,43,22,.1); }
  .number-pad { display: grid; grid-template-columns: repeat(3, 58px); gap: 6px; width: 186px; }
  .number-pad-display { grid-column: 1 / -1; display: grid; place-items: center; min-height: 38px; border: 2px solid rgba(84,62,38,.28); border-radius: 9px; background: rgba(255,253,242,.86); color: #3e3224; font-size: 24px; font-weight: 900; }
  .number-pad .number-key { min-width: 58px; min-height: 38px; padding: 4px; }
  .number-pad .number-key-submit { background: var(--mint); font-size: 13px; }
  .number-pad .number-key-back { background: var(--peach); }
  @media (max-width: 760px) { .question-panel.has-number-pad { grid-template-columns: minmax(0, 1fr) 186px; min-height: 164px; } }
`;
document.head.append(progressiveInputStyles);

const MUSIC_PREFERENCE_KEY = "dongwoo-music-enabled";
let musicEnabled = localStorage.getItem(MUSIC_PREFERENCE_KEY) !== "false";
let musicStarted = false;
let musicPlayPending = false;

function syncMusicButton() {
  if (!ui.musicToggle) return;
  ui.musicToggle.classList.toggle("is-muted", !musicEnabled);
  ui.musicToggle.textContent = musicEnabled ? "♪" : "♩";
  ui.musicToggle.setAttribute("aria-pressed", String(musicEnabled));
  ui.musicToggle.setAttribute("aria-label", musicEnabled ? "배경 음악 끄기" : "배경 음악 켜기");
}

async function startMusic() {
  if (!musicEnabled || !ui.gameOst || musicPlayPending) return;
  ui.gameOst.volume = 0.28;
  musicPlayPending = true;
  try {
    await ui.gameOst.play();
    musicStarted = true;
    syncMusicButton();
  } catch (error) {
    musicStarted = false;
    syncMusicButton();
    // Browsers may defer playback until the next direct user interaction.
    console.warn("Background music is waiting for a user gesture.", error);
  } finally {
    musicPlayPending = false;
  }
}

function toggleMusic() {
  if (musicEnabled && ui.gameOst?.paused) {
    startMusic();
    return;
  }
  musicEnabled = !musicEnabled;
  localStorage.setItem(MUSIC_PREFERENCE_KEY, String(musicEnabled));
  syncMusicButton();
  if (musicEnabled) {
    startMusic();
  } else if (ui.gameOst) {
    ui.gameOst.pause();
  }
}

syncMusicButton();

const ACTIVITY_DEFS = {
  catch: {
    title: "곤충 관찰",
    description: "오늘 나타난 곤충 이미지를 직접 눌러 숫자 문제를 풀어요. 문제를 맞히면 그 곤충이 채집함에 기록돼요.",
    start: () => startCatch(),
  },
  chickenCoop: {
    title: "닭장 달걀 놀이",
    description: "달걀의 색을 자세히 관찰해 찾고, 익숙해지면 두 조건 분류와 여러 가지 수 가르기에 도전해요.",
    start: () => startChickenCoopMission(),
  },
  flyGame: {
    title: "닭장 파리 잡기",
    description: "날아다니거나 잠깐 앉은 파리를 찾아 톡 눌러 잡아요. 잡을 때마다 수를 함께 세어봐요.",
    start: () => startFlyGame(),
  },
  woodMission: {
    title: "장작 넣기",
    description: "문제의 답만큼 장작을 골라 아궁이에 넣고 확인해요. 높은 단계에서는 덧셈과 뺄셈 식을 풀어요.",
    start: () => startWoodMission(),
  },
  plum: {
    title: "자두 씻기",
    description: "자두를 세어 씻다가 고양이가 가져가면, 대야에 몇 개가 남았는지 생각해요.",
    start: () => startPlumMission(),
  },
  soban: {
    title: "소반 차리기",
    description: "가족 한 사람마다 밥그릇과 숟가락 한 벌을 맞춰 생활 속 짝짓기를 해요.",
    start: () => startSobanMission(),
  },
  cat: {
    title: "수박 먹기",
    description: "수박 조각을 살펴보세요. 예상하지 못한 일이 생길 수 있어요.",
    start: () => startCatSnackMission(),
  },
  storeShopping: {
    title: "슈퍼 심부름",
    description: "부탁받은 과자를 고르고, 가진 돈을 계산대로 끌어 정확한 값을 만들어 확인해요.",
    start: () => startStoreShoppingMission(),
  },
  storeGacha: {
    title: "슈퍼 뽑기",
    description: "오늘 할 일을 모두 끝내면 할머니가 주는 500원으로 하루에 한 번만 뽑을 수 있어요.",
    start: () => startStoreGachaMission(),
  },
  streamCrayfish: {
    title: "개울가 가재잡기",
    description: "개울물 속 바위를 조심히 들춰보고, 가재가 나오면 숫자 문제를 풀어 관찰해요.",
    start: () => startStreamCrayfishMission(),
  },
  streamSkipping: {
    title: "개울가 물수제비",
    description: "납작한 돌멩이를 눌러 물 위로 통통 튕겨요. 처음엔 튄 횟수를 세고, 익숙해지면 목표까지 몇 번 더 필요한지 생각해요.",
    start: () => startStreamSkippingMission(),
  },
};

function ensureControlButton(action, label, afterAction) {
  const controls = document.querySelector(".controls");
  if (!controls || controls.querySelector(`button[data-action="${action}"]`)) return;
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.action = action;
  button.textContent = label;
  const anchor = controls.querySelector(`button[data-action="${afterAction}"]`);
  if (anchor?.parentNode) anchor.after(button);
  else controls.append(button);
}

ensureControlButton("streamSkipping", "물수제비", "streamCrayfish");

const ASSETS = {
  yard: "assets/dongwoo-summer-background-clean.png",
  insectMap: "assets/maps/insect-collection/insect-collection-map-transparent.png",
  fireflyNightMap: "assets/maps/firefly-night/firefly-night-map.jpg",
  kitchenMap: "assets/maps/kitchen/kitchen-furnace-map.png",
  chickenCoopMap: "assets/maps/chicken-coop/chicken-coop-map.png?v=20260617-user-map",
  streamMap: "assets/maps/stream/stream-map.jpg?v=20260623-new-maps",
  storeMap: "assets/maps/store/store-map.jpg?v=20260623-new-maps",
  storeShopping: {
    snacks: "assets/ui-sprites/store-shopping/snack-sheet.jpg?v=20260625-store-shopping",
    money: "assets/ui-sprites/store-shopping/money-sheet.jpg?v=20260625-store-shopping",
  },
  storeGacha: {
    sheet: "assets/ui-sprites/store-gacha/gacha-sheet.jpg?v=20260625-store-gacha",
    machine: "assets/ui-sprites/store-gacha/gacha-machine-cutout.png?v=20260626-cutout",
  },
  streamCrayfish: {
    water: "assets/ui-sprites/stream-crayfish/water-pool.png?v=20260626-crayfish",
    rock: "assets/ui-sprites/stream-crayfish/rock-flat.png?v=20260626-rock-clean",
    crayfish: "assets/ui-sprites/stream-crayfish/crayfish.png?v=20260626-crayfish",
  },
  streamSkipping: {
    stoneFlat: "assets/ui-sprites/stream-skipping/stone_flat.png?v=20260630-stream-skipping",
    stoneRound: "assets/ui-sprites/stream-skipping/stone_round.png?v=20260630-stream-skipping",
    rippleDiagonal: "assets/ui-sprites/stream-skipping/skip_ripple_diagonal.png?v=20260630-stream-skipping",
    splashFail: "assets/ui-sprites/stream-skipping/splash_fail.png?v=20260630-stream-skipping",
  },
  storeFigures: {
    sheet: "assets/ui-sprites/store-figures/figure-sheet.jpg?v=20260625-store-figures",
    sheet2: "assets/ui-sprites/store-figures/figure-sheet-2.jpg?v=20260625-store-figures-2",
  },
  chickenCoop: {
    sheet: "assets/ui-sprites/chicken-coop/chicken-coop-sheet.png",
    basketEmpty: "assets/ui-sprites/chicken-coop/basket_empty.png",
    nestEmpty: "assets/ui-sprites/chicken-coop/nest_empty_bamboo.png?v=20260623-bamboo-basket",
    nestFull: "assets/ui-sprites/chicken-coop/nest_full.png",
    eggCream: "assets/ui-sprites/chicken-coop/egg_cream.png",
    eggYellow: "assets/ui-sprites/chicken-coop/egg_yellow.png",
    eggBlue: "assets/ui-sprites/chicken-coop/egg_blue.png",
    featherSmall: "assets/ui-sprites/chicken-coop/feather_small.png",
    featherMedium: "assets/ui-sprites/chicken-coop/feather_medium.png",
    featherLarge: "assets/ui-sprites/chicken-coop/feather_large.png",
    featherGroup: "assets/ui-sprites/chicken-coop/feather_group.png",
    flySheet: "assets/ui-sprites/chicken-coop/fly-sheet.png?v=20260622-fly-game",
  },
  chickenFamily: {
    sheet: "assets/ui-sprites/chicken-family/chicken-family-sheet.png",
    chickStand: "assets/ui-sprites/chicken-family/chick_stand.png",
    chickWalk: "assets/ui-sprites/chicken-family/chick_walk.png",
    chickPeck: "assets/ui-sprites/chicken-family/chick_peck.png",
    chickPair: "assets/ui-sprites/chicken-family/chick_pair.png",
    chickGroup: "assets/ui-sprites/chicken-family/chick_group.png",
    roosterStand: "assets/ui-sprites/chicken-family/rooster_stand.png",
    roosterWalk: "assets/ui-sprites/chicken-family/rooster_walk.png",
    roosterPeck: "assets/ui-sprites/chicken-family/rooster_peck.png",
    henStand: "assets/ui-sprites/chicken-family/hen_stand.png",
    henWalk: "assets/ui-sprites/chicken-family/hen_walk.png",
    henPeck: "assets/ui-sprites/chicken-family/hen_peck.png",
  },
  titleLogo: "assets/ui-sprites/title_logo.png",
  diaryBook: versioned("assets/ui-sprites/diary-open-book-transparent.png"),
  diaryScenes: {
    coopEggs: "assets/ui-sprites/diary-scenes/coop-eggs.jpg?v=20260626-diary-scenes",
    coopFly: "assets/ui-sprites/diary-scenes/coop-fly.jpg?v=20260626-diary-scenes",
    insectHunt: "assets/ui-sprites/diary-scenes/insect-hunt.jpg?v=20260626-diary-scenes",
    kitchenWood: "assets/ui-sprites/diary-scenes/kitchen-wood.jpg?v=20260626-diary-scenes",
    kitchenPlum: "assets/ui-sprites/diary-scenes/kitchen-plum.jpg?v=20260626-diary-scenes",
    storeErrand: "assets/ui-sprites/diary-scenes/store-errand.jpg?v=20260626-diary-scenes-2",
    streamCrayfish: "assets/ui-sprites/diary-scenes/stream-crayfish.jpg?v=20260626-diary-scenes-2",
  },
  praiseStickers: {
    greatJob: "assets/ui-sprites/praise-stickers/great-job.png?v=20260626-praise-stickers",
    best: "assets/ui-sprites/praise-stickers/best.png?v=20260626-praise-stickers",
    effort: "assets/ui-sprites/praise-stickers/effort.png?v=20260626-praise-stickers",
    growth: "assets/ui-sprites/praise-stickers/growth.png?v=20260626-praise-stickers",
    praise: "assets/ui-sprites/praise-stickers/praise.png?v=20260626-praise-stickers",
    smart: "assets/ui-sprites/praise-stickers/smart.png?v=20260626-praise-stickers",
    friend: "assets/ui-sprites/praise-stickers/friend.png?v=20260626-praise-stickers",
    explorer: "assets/ui-sprites/praise-stickers/explorer.png?v=20260626-praise-stickers",
  },
  subitizeObjects: "assets/ui-sprites/subitize-objects-sheet.png",
  watermelonSlice: "assets/ui-sprites/watermelon_slice.png",
  insectCards: {
    butterfly: "assets/ui-sprites/insect-cards/butterfly.jpg?v=20260623-field-guide",
    ladybug: "assets/ui-sprites/insect-cards/ladybug.jpg?v=20260623-field-guide",
    dragonfly: "assets/ui-sprites/insect-cards/dragonfly.jpg?v=20260623-field-guide",
    rhinoceros_beetle: "assets/ui-sprites/insect-cards/rhinoceros_beetle.jpg?v=20260623-field-guide",
    stag_beetle: "assets/ui-sprites/insect-cards/stag_beetle.jpg?v=20260623-field-guide",
    mantis: "assets/ui-sprites/insect-cards/mantis.jpg?v=20260623-field-guide-10",
    cicada: "assets/ui-sprites/insect-cards/cicada.jpg?v=20260623-field-guide-10",
    grasshopper: "assets/ui-sprites/insect-cards/grasshopper.jpg?v=20260623-field-guide-10",
    firefly: "assets/ui-sprites/insect-cards/firefly.jpg?v=20260623-field-guide-10",
    dung_beetle: "assets/ui-sprites/insect-cards/dung_beetle.jpg?v=20260623-field-guide-10",
    frog: "assets/ui-sprites/insect-cards/frog.jpg?v=20260623-unique-guide",
    red_eyed_frog: "assets/ui-sprites/insect-cards/red_eyed_frog.jpg?v=20260623-unique-guide",
    golden_dung_beetle: "assets/ui-sprites/insect-cards/golden_dung_beetle.jpg?v=20260623-unique-guide",
    crayfish: "assets/ui-sprites/stream-crayfish/crayfish.png?v=20260626-crayfish",
  },
  plumWash: {
    basinEmpty: versioned("assets/ui-sprites/plum-wash/basin_empty.png"),
    basinFull: versioned("assets/ui-sprites/plum-wash/basin_full.png"),
    plumA: versioned("assets/ui-sprites/plum-wash/plum_a.png"),
    plumB: versioned("assets/ui-sprites/plum-wash/plum_b.png"),
    ripple: [
      versioned("assets/ui-sprites/plum-wash/ripple_1.png"),
      versioned("assets/ui-sprites/plum-wash/ripple_2.png"),
      versioned("assets/ui-sprites/plum-wash/ripple_3.png"),
    ],
    splash: versioned("assets/ui-sprites/plum-wash/splash.png"),
  },
  woodFire: {
    furnace: "assets/ui-sprites/wood-fire/furnace.png?v=20260623-wood-sheet",
    logSmooth: "assets/ui-sprites/wood-fire/log_smooth.png?v=20260623-wood-sheet",
    logRough: "assets/ui-sprites/wood-fire/log_rough.png?v=20260623-wood-sheet",
    kindling: "assets/ui-sprites/wood-fire/kindling.png?v=20260623-wood-sheet",
  },
  soban: {
    empty: versioned("assets/ui-sprites/soban-setting/soban_empty.png"),
    guide: versioned("assets/ui-sprites/soban-setting/soban_guide.png"),
    full: versioned("assets/ui-sprites/soban-setting/soban_full.png"),
    bowl: versioned("assets/ui-sprites/soban-setting/rice_bowl.png"),
    spoon: versioned("assets/ui-sprites/soban-setting/spoon.png"),
  },
  catSnack: {
    plate: "assets/ui-sprites/cat-snack/snack_plate_empty.png",
    potato: "assets/ui-sprites/cat-snack/potato.png",
    sausage: "assets/ui-sprites/cat-snack/sausage.png",
    cat: "assets/ui-sprites/cat-snack/cat_escape.png",
    watermelonBites: [
      "assets/ui-sprites/watermelon-bites/watermelon_fresh.png?v=20260624-watermelon-bites",
      "assets/ui-sprites/watermelon-bites/watermelon_bite_1.png?v=20260624-watermelon-bites",
      "assets/ui-sprites/watermelon-bites/watermelon_bite_2.png?v=20260624-watermelon-bites",
      "assets/ui-sprites/watermelon-bites/watermelon_bite_3.png?v=20260624-watermelon-bites",
      "assets/ui-sprites/watermelon-bites/watermelon_rind.png?v=20260624-watermelon-bites",
    ],
  },
  dongwoo: {
    idle: [
      versioned("assets/characters/dongwoo/dongwoo_idle_01.png"),
      versioned("assets/characters/dongwoo/dongwoo_idle_02.png"),
      versioned("assets/characters/dongwoo/dongwoo_idle_03.png"),
      versioned("assets/characters/dongwoo/dongwoo_idle_04.png"),
    ],
    walk: [
      versioned("assets/characters/dongwoo/dongwoo_walk_01.png"),
      versioned("assets/characters/dongwoo/dongwoo_walk_02.png"),
      versioned("assets/characters/dongwoo/dongwoo_walk_03.png"),
      versioned("assets/characters/dongwoo/dongwoo_walk_04.png"),
    ],
    catch: [
      versioned("assets/characters/dongwoo/dongwoo_catch_01.png"),
      versioned("assets/characters/dongwoo/dongwoo_catch_02.png"),
      versioned("assets/characters/dongwoo/dongwoo_catch_03.png"),
      versioned("assets/characters/dongwoo/dongwoo_catch_04.png"),
    ],
  },
  butterfly: Array.from({ length: 16 }, (_, index) => {
    const number = String(index + 1).padStart(2, "0");
    return `assets/insect-sprites/butterfly_frame_${number}.png`;
  }),
  dragonfly: Array.from({ length: 16 }, (_, index) => {
    const number = String(index + 1).padStart(2, "0");
    return `assets/insect-sprites/dragonfly_frame_${number}.png`;
  }),
  ladybug: Array.from({ length: 16 }, (_, index) => {
    const number = String(index + 1).padStart(2, "0");
    return `assets/insect-sprites/ladybug_frame_${number}.png`;
  }),
  rhinoceros_beetle: Array.from({ length: 16 }, (_, index) => {
    const number = String(index + 1).padStart(2, "0");
    return `assets/insect-sprites/rhinoceros_beetle_frame_${number}.png`;
  }),
  stag_beetle: Array.from({ length: 16 }, (_, index) => {
    const number = String(index + 1).padStart(2, "0");
    return `assets/insect-sprites/stag_beetle_frame_${number}.png`;
  }),
  cicada: Array.from({ length: 16 }, (_, index) => {
    const number = String(index + 1).padStart(2, "0");
    return `assets/insect-sprites/cicada_frame_${number}.png`;
  }),
  mantis: Array.from({ length: 16 }, (_, index) => {
    const number = String(index + 1).padStart(2, "0");
    return `assets/insect-sprites/mantis_frame_${number}.png`;
  }),
  grasshopper: Array.from({ length: 16 }, (_, index) => {
    const number = String(index + 1).padStart(2, "0");
    return `assets/insect-sprites/grasshopper_frame_${number}.png`;
  }),
  firefly: Array.from({ length: 16 }, (_, index) => {
    const number = String(index + 1).padStart(2, "0");
    return `assets/insect-sprites/firefly_frame_${number}.png`;
  }),
  dung_beetle: Array.from({ length: 16 }, (_, index) => {
    const number = String(index + 1).padStart(2, "0");
    return `assets/insect-sprites/dung_beetle_frame_${number}.png`;
  }),
  frog: Array.from({ length: 16 }, (_, index) => {
    const number = String(index + 1).padStart(2, "0");
    return `assets/insect-sprites/frog_frame_${number}.png`;
  }),
  red_eyed_frog: ["assets/insect-sprites/unique/red_eyed_frog.png?v=20260623-unique-guide"],
  golden_dung_beetle: ["assets/insect-sprites/unique/golden_dung_beetle.png?v=20260623-unique-guide"],
  crayfish: ["assets/ui-sprites/stream-crayfish/crayfish.png?v=20260626-crayfish"],
};

const INSECT_CONFIG = {
  butterfly: { label: "나비", width: 58, height: 50, frameMs: 160, speed: 1.08, movement: "fly", frames: [0, 1, 4, 0] },
  dragonfly: { label: "잠자리", width: 72, height: 50, frameMs: 130, speed: 1.55, movement: "fly", frames: [0, 1, 2, 3] },
  ladybug: { label: "무당벌레", width: 52, height: 42, frameMs: 190, speed: 0.48, movement: "crawl", frames: [2, 3, 14, 3] },
  rhinoceros_beetle: { label: "장수풍뎅이", width: 66, height: 44, frameMs: 220, speed: 0.42, movement: "crawl", frames: [1, 2, 3, 2] },
  stag_beetle: { label: "사슴벌레", width: 68, height: 45, frameMs: 220, speed: 0.44, movement: "crawl", frames: [1, 2, 3, 2] },
  cicada: { label: "매미", width: 62, height: 46, frameMs: 170, speed: 0.42, movement: "crawl", frames: [1, 2, 3, 2] },
  mantis: { label: "사마귀", width: 70, height: 52, frameMs: 210, speed: 0.45, movement: "crawl", frames: [1, 2, 3, 2] },
  grasshopper: { label: "메뚜기", width: 70, height: 47, frameMs: 180, speed: 0.62, movement: "hop", frames: [1, 2, 3, 2] },
  firefly: { label: "반딧불이", width: 58, height: 39, frameMs: 150, speed: 1.12, movement: "fly", frames: [1, 2, 3, 2] },
  dung_beetle: { label: "쇠똥구리", width: 72, height: 44, frameMs: 230, speed: 0.38, movement: "crawl", frames: [0, 1, 2, 3] },
  frog: { label: "개구리", width: 72, height: 48, frameMs: 190, speed: 0.58, movement: "hop", frames: [0, 4, 5, 6, 8, 10, 12, 14] },
  red_eyed_frog: { label: "붉은눈개구리", width: 88, height: 66, frameMs: 240, speed: 0.5, movement: "hop", frames: [0], rarity: "unique" },
  golden_dung_beetle: { label: "황금 쇠똥구리", width: 76, height: 64, frameMs: 260, speed: 0.34, movement: "crawl", frames: [0], rarity: "unique" },
  crayfish: { label: "가재", width: 96, height: 52, frameMs: 260, speed: 0, movement: "water", frames: [0] },
};

const INSECT_ORDER = [
  "butterfly",
  "dragonfly",
  "ladybug",
  "rhinoceros_beetle",
  "stag_beetle",
  "cicada",
  "mantis",
  "grasshopper",
  "firefly",
  "dung_beetle",
  "frog",
];

const UNIQUE_INSECT_ORDER = ["red_eyed_frog", "golden_dung_beetle"];
const STREAM_CREATURE_ORDER = ["crayfish"];
const COLLECTION_ORDER = [...INSECT_ORDER, ...UNIQUE_INSECT_ORDER, ...STREAM_CREATURE_ORDER];
const UNIQUE_SPAWN_CHANCE = 0.08;

const FIELD_GUIDE_CARDS = [
  { type: "butterfly", label: "나비", image: ASSETS.insectCards.butterfly },
  { type: "ladybug", label: "무당벌레", image: ASSETS.insectCards.ladybug },
  { type: "dragonfly", label: "잠자리", image: ASSETS.insectCards.dragonfly },
  { type: "rhinoceros_beetle", label: "장수풍뎅이", image: ASSETS.insectCards.rhinoceros_beetle },
  { type: "stag_beetle", label: "사슴벌레", image: ASSETS.insectCards.stag_beetle },
  { type: "mantis", label: "사마귀", image: ASSETS.insectCards.mantis },
  { type: "cicada", label: "매미", image: ASSETS.insectCards.cicada },
  { type: "grasshopper", label: "메뚜기", image: ASSETS.insectCards.grasshopper },
  { type: "firefly", label: "반딧불이", image: ASSETS.insectCards.firefly },
  { type: "dung_beetle", label: "쇠똥구리", image: ASSETS.insectCards.dung_beetle },
  { type: "frog", label: "개구리", image: ASSETS.insectCards.frog },
  { type: "red_eyed_frog", label: "붉은눈개구리", image: ASSETS.insectCards.red_eyed_frog, rarity: "unique" },
  { type: "golden_dung_beetle", label: "황금 쇠똥구리", image: ASSETS.insectCards.golden_dung_beetle, rarity: "unique" },
  { type: "crayfish", label: "가재", image: ASSETS.insectCards.crayfish },
];

const QUEST_TARGET = 5;

const SUBITIZE_OBJECTS = [
  { label: "수박씨", type: "seed", row: 0, width: 58, height: 58 },
  { label: "조약돌", type: "stone", row: 1, width: 72, height: 56 },
  { label: "나뭇잎", type: "leaf", row: 2, width: 72, height: 66 },
  { label: "꽃잎", type: "petal", row: 3, width: 70, height: 62 },
];

const SECRET_MISSION_START = 2;
const SECRET_MISSION_CHANCE = 0.12;

const ADAPTIVE_LEVELING = {
  masteryThreshold: {
    accuracy: 0.9,
    hintRatio: 0.2,
    subitizeReactionSec: 3,
  },
  rollback: {
    nextGradeMistakes: 2,
    consecutiveHints: 2,
    maxReactionSec: 10,
  },
  blendStages: [
    { current: 5, preview: 0 },
    { current: 4, preview: 1 },
    { current: 3, preview: 2 },
    { current: 2, preview: 3 },
    { current: 1, preview: 4 },
  ],
  gradeMap: {
    1: {
      label: "Grade 1 · 직관적 수 감각",
      numberMax: 10,
      activities: ["달걀 색 찾기", "장작 개수 맞추기", "자두 세기", "1대1 식기"],
    },
    2: {
      label: "Grade 2 · 관찰과 선택",
      numberMax: 20,
      activities: ["파란 달걀 찾기", "장작 덧셈", "자두 돌발 뺄셈", "부족한 식기"],
    },
    3: {
      label: "Grade 3 · 조건과 분류",
      numberMax: 20,
      activities: ["달걀 색 분류", "장작 뺄셈", "자두 돌발 뺄셈"],
    },
    4: {
      label: "Grade 4 · 묶음과 수 가르기",
      numberMax: 100,
      activities: ["달걀 수 가르기", "장작 혼합 수식", "자두 돌발 뺄셈"],
    },
  },
};

const LEARNING_PROFILE_KEY = "dongwoo-learning-profile-v2";
const LEGACY_LEARNING_PROFILE_KEY = "dongwoo-learning-profile-v1";
const PROBLEM_LOG_KEY = "dongwoo-problem-log-v1";
const GAME_SAVE_KEY = "dongwoo-game-save-v1";
const COLLECTION_BACKUP_KEY = "dongwoo-collection-backup-v1";
const LEARNING_ATTEMPT_LIMIT = 60;
const DAILY_MISSION_TARGET_MINUTES = { min: 20, ideal: 24, max: 30 };

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function koreanDiaryDate(date = new Date()) {
  const weekdays = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${weekdays[date.getDay()]}`;
}

function loadGameSave() {
  try {
    const stored = JSON.parse(localStorage.getItem(GAME_SAVE_KEY));
    return stored && stored.version === 1 ? stored : null;
  } catch {
    return null;
  }
}

function sanitizeCollectionMap(value, allowedTypes = COLLECTION_ORDER) {
  const result = {};
  if (!value || typeof value !== "object") return result;
  allowedTypes.forEach((type) => {
    if (value[type]) result[type] = true;
  });
  return result;
}

function mergeCollectionMaps(...maps) {
  return maps.reduce((merged, map) => {
    Object.assign(merged, sanitizeCollectionMap(map));
    return merged;
  }, {});
}

function collectionCount(collection) {
  return COLLECTION_ORDER.filter((type) => collection?.[type]).length;
}

function readCollectionBackup() {
  try {
    const backup = JSON.parse(localStorage.getItem(COLLECTION_BACKUP_KEY));
    if (!backup || typeof backup !== "object") return { collected: {}, figureCollection: {} };
    return {
      collected: sanitizeCollectionMap(backup.collected),
      figureCollection: backup.figureCollection && typeof backup.figureCollection === "object" ? backup.figureCollection : {},
    };
  } catch {
    return { collected: {}, figureCollection: {} };
  }
}

function writeCollectionBackup(collected, figureCollection) {
  const safeCollected = sanitizeCollectionMap(collected);
  const safeFigures = figureCollection && typeof figureCollection === "object" ? figureCollection : {};
  if (collectionCount(safeCollected) === 0 && Object.keys(safeFigures).length === 0) return;
  try {
    localStorage.setItem(COLLECTION_BACKUP_KEY, JSON.stringify({
      version: 1,
      savedAt: new Date().toISOString(),
      collected: safeCollected,
      figureCollection: safeFigures,
    }));
  } catch {
    // Collection backup is best-effort only.
  }
}

function resetDailyProgressForDate(dateKey = localDateKey()) {
  state.lastDailyDateKey = dateKey;
  state.quests = 0;
  state.dailyCaught = {};
  state.todayMission = null;
  state.secretMission = null;
  state.activityLog = [];
  state.diaryStamps = { subitize: 0, interleaving: 0, embodied: 0, mission: 0 };
  state.diaryIllustrations = {};
  state.diaryHighlightKey = null;
  state.diaryHighlightLocked = false;
  state.latestPraiseSticker = null;
  state.gachaReward = { earned: false, used: false, dateKey };
}

function hasValidTodayDailyState(save, todayKey = localDateKey()) {
  if (!save || save.dateKey !== todayKey) return false;
  if (save.todayMission?.rounds?.length && save.todayMission.dateKey !== todayKey) return false;
  if (save.gachaReward?.dateKey && save.gachaReward.dateKey !== todayKey) return false;
  return true;
}

function rolloverDailyProgressIfNeeded() {
  const todayKey = localDateKey();
  if (!state.lastDailyDateKey) {
    state.lastDailyDateKey = todayKey;
    return false;
  }
  if (state.lastDailyDateKey === todayKey) return false;

  resetDailyProgressForDate(todayKey);
  return true;
}

function refreshDailyStateForCurrentDate() {
  if (!rolloverDailyProgressIfNeeded()) return false;

  saveGameProgress();
  syncHud();
  renderCollection();
  updateControlVisibility();
  return true;
}

function inferLegacyCollection(save) {
  const stage = Math.max(0, Number(save?.collectionStage ?? save?.worldState?.collectionStage) || 0);
  const result = {};
  INSECT_ORDER.slice(0, Math.min(stage, INSECT_ORDER.length)).forEach((type) => {
    result[type] = true;
  });
  return result;
}

function saveGameProgress() {
  try {
    const rolledOver = rolloverDailyProgressIfNeeded();
    const previous = loadGameSave();
    const backup = readCollectionBackup();
    const durableCollected = mergeCollectionMaps(previous?.collected, backup.collected, state.collected);
    const durableFigureCollection = {
      ...(backup.figureCollection || {}),
      ...(previous?.figureCollection && typeof previous.figureCollection === "object" ? previous.figureCollection : {}),
      ...(state.figureCollection && typeof state.figureCollection === "object" ? state.figureCollection : {}),
    };
    const save = {
      version: 1,
      savedAt: new Date().toISOString(),
      dateKey: localDateKey(),
      accumulatedPlayDays: Math.max(1, Number(previous?.accumulatedPlayDays) || 1),
      stars: state.stars,
      bugs: Math.max(state.bugs, collectionCount(durableCollected)),
      quests: state.quests,
      collected: durableCollected,
      figureCollection: durableFigureCollection,
      gachaReward: state.gachaReward,
      dailyCaught: state.dailyCaught,
      todayMission: state.todayMission,
      dailyMissionHistory: state.dailyMissionHistory,
      secretMission: state.secretMission,
      diaryStamps: state.diaryStamps,
      diaryIllustrations: state.diaryIllustrations,
      diaryHighlightKey: state.diaryHighlightKey,
      diaryHighlightLocked: state.diaryHighlightLocked,
      latestPraiseSticker: state.latestPraiseSticker,
      activityLog: state.activityLog,
    };
    localStorage.setItem(GAME_SAVE_KEY, JSON.stringify(save));
    writeCollectionBackup(durableCollected, durableFigureCollection);
    if (rolledOver) {
      syncHud();
      renderCollection();
      updateControlVisibility();
    }
  } catch {
    // The game remains playable when storage is unavailable.
  }
}

function restoreGameProgress() {
  const save = loadGameSave();
  if (!save) {
    state.lastDailyDateKey = localDateKey();
    saveGameProgress();
    return;
  }

  const todayKey = localDateKey();
  const sameDay = hasValidTodayDailyState(save, todayKey);
  state.lastDailyDateKey = todayKey;
  const backup = readCollectionBackup();
  state.stars = Math.max(0, Number(save.stars) || 0);
  state.collected = mergeCollectionMaps(
    inferLegacyCollection(save),
    save.dailyCaught,
    save.collected,
    backup.collected
  );
  state.bugs = Math.max(0, Number(save.bugs) || 0, collectionCount(state.collected));
  state.figureCollection = {
    ...(backup.figureCollection || {}),
    ...(save.figureCollection && typeof save.figureCollection === "object" ? save.figureCollection : {}),
  };
  state.gachaReward = save.gachaReward && typeof save.gachaReward === "object"
    ? { earned: false, used: false, dateKey: localDateKey(), ...save.gachaReward }
    : { earned: false, used: false, dateKey: localDateKey() };

  if (sameDay) {
    state.quests = clamp(Number(save.quests) || 0, 0, QUEST_TARGET);
    state.dailyCaught = save.dailyCaught && typeof save.dailyCaught === "object" ? save.dailyCaught : {};
    state.todayMission = save.todayMission || null;
    state.dailyMissionHistory = Array.isArray(save.dailyMissionHistory) ? save.dailyMissionHistory.slice(-14) : [];
    if (
      state.todayMission?.rounds?.length
      && state.todayMission.rounds.every((round) => round.completed)
      && !state.gachaReward.used
    ) {
      state.gachaReward = { earned: true, used: false, dateKey: localDateKey() };
    }
    state.secretMission = save.secretMission || null;
    state.diaryStamps = { ...state.diaryStamps, ...(save.diaryStamps || {}) };
    state.diaryIllustrations = save.diaryIllustrations && typeof save.diaryIllustrations === "object"
      ? save.diaryIllustrations
      : {};
    state.diaryHighlightKey = typeof save.diaryHighlightKey === "string" ? save.diaryHighlightKey : null;
    state.diaryHighlightLocked = Boolean(save.diaryHighlightLocked);
    state.latestPraiseSticker = typeof save.latestPraiseSticker === "string" ? save.latestPraiseSticker : null;
    state.activityLog = Array.isArray(save.activityLog) ? save.activityLog.slice(0, 8) : [];
  } else {
    save.accumulatedPlayDays = Math.max(1, Number(save.accumulatedPlayDays) || 1) + 1;
    state.dailyMissionHistory = Array.isArray(save.dailyMissionHistory) ? save.dailyMissionHistory.slice(-14) : [];
    resetDailyProgressForDate(todayKey);
  }

  syncHud();
  renderCollection();
  saveGameProgress();
}

function loadProblemLog() {
  try {
    const stored = JSON.parse(localStorage.getItem(PROBLEM_LOG_KEY));
    return Array.isArray(stored) ? stored.slice(-200) : [];
  } catch {
    return [];
  }
}

function saveProblemLog() {
  try {
    localStorage.setItem(PROBLEM_LOG_KEY, JSON.stringify(state.problemLog.slice(-200)));
  } catch {
    // The game still works when storage is unavailable.
  }
}

function createDefaultLearningProfile() {
  return {
    version: 2,
    currentGrade: 1,
    readyForNext: false,
    blendStage: 0,
    previewSuccesses: 0,
    consecutiveErrors: 0,
    promotedAtAttempt: null,
    totalAttempts: 0,
    activityCounts: {},
    attempts: [],
  };
}

function normalizeLearningProfile(stored) {
  const defaults = createDefaultLearningProfile();
  const legacyGrade = Number(stored?.currentGrade ?? stored?.currentPhase) || 1;
  const normalized = {
    ...defaults,
    ...(stored && typeof stored === "object" ? stored : {}),
    version: 2,
    currentGrade: clamp(legacyGrade, 1, 4),
    blendStage: clamp(Number(stored?.blendStage) || 0, 0, ADAPTIVE_LEVELING.blendStages.length - 1),
    activityCounts: stored?.activityCounts && typeof stored.activityCounts === "object" ? stored.activityCounts : {},
    attempts: Array.isArray(stored?.attempts) ? stored.attempts.slice(-LEARNING_ATTEMPT_LIMIT) : [],
  };
  delete normalized.currentPhase;
  return normalized;
}

function loadLearningProfile() {
  try {
    const current = JSON.parse(localStorage.getItem(LEARNING_PROFILE_KEY));
    const legacy = current || JSON.parse(localStorage.getItem(LEGACY_LEARNING_PROFILE_KEY));
    const normalized = normalizeLearningProfile(legacy);
    localStorage.setItem(LEARNING_PROFILE_KEY, JSON.stringify(normalized));
    return normalized;
  } catch {
    return createDefaultLearningProfile();
  }
}

function saveLearningProfile() {
  try {
    state.learningProfile.version = 2;
    state.learningProfile.updatedAt = new Date().toISOString();
    localStorage.setItem(LEARNING_PROFILE_KEY, JSON.stringify(state.learningProfile));
  } catch {
    // The game still works when storage is unavailable.
  }
}

function refreshLearningReadiness() {
  const profile = state.learningProfile;
  const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
  const recent = profile.attempts
    .filter((attempt) => {
      const recordedAt = Date.parse(attempt.recorded_at || "");
      return !attempt.is_preview
        && attempt.question_grade === profile.currentGrade
        && Number.isFinite(recordedAt)
        && recordedAt >= threeDaysAgo;
    })
    .slice(-10);
  const correct = recent.filter((attempt) => attempt.mastery_success ?? attempt.is_correct);
  const accuracy = recent.length ? correct.length / recent.length : 0;
  const hintRatio = recent.length
    ? recent.filter((attempt) => attempt.used_hint).length / recent.length
    : 1;

  profile.readyForNext = profile.currentGrade < 4
    && recent.length >= 10
    && accuracy >= 0.9
    && hintRatio <= 0.2;
}

function chooseInsectQuestionLevel() {
  refreshLearningReadiness();
  const currentGrade = state.learningProfile.currentGrade;
  const isPreview = state.learningProfile.readyForNext
    && currentGrade < 4
    && state.insectQuestionIndex % 5 === 4;

  return {
    grade: isPreview ? currentGrade + 1 : currentGrade,
    isPreview,
  };
}

function chooseActivityGrade(activityKey) {
  refreshLearningReadiness();
  const profile = state.learningProfile;
  const currentGrade = profile.currentGrade;
  const count = Math.max(0, Number(profile.activityCounts[activityKey]) || 0);
  const isPreview = profile.readyForNext && currentGrade < 4 && count % 5 === 4;

  return {
    grade: isPreview ? currentGrade + 1 : currentGrade,
    isPreview,
  };
}

function recordLearningAttempt(question, correct) {
  const profile = state.learningProfile;
  const reactionTime = Math.max(0, Math.round(performance.now() - (question.startedAtMs || performance.now())));
  const masterySuccess = question.masterySuccess ?? Boolean(correct);
  const attempt = {
    recorded_at: new Date().toISOString(),
    game_type: question.gameType || "insect_collection",
    question_kind: question.kind,
    question_grade: question.grade || profile.currentGrade,
    is_preview: Boolean(question.isPreview),
    reaction_time_ms: reactionTime,
    interaction_mode: question.interactionMode || "number_pad",
    used_hint: Boolean(question.usedHint),
    is_correct: Boolean(correct),
    event_type: question.eventType || "problem_attempt",
    error_type: correct ? null : (question.errorType || "incorrect_answer"),
    error_count: Math.max(0, Number(question.errorCount) || 0),
    mastery_success: Boolean(masterySuccess),
  };

  state.problemLog.push(attempt);
  state.problemLog = state.problemLog.slice(-200);
  saveProblemLog();

  if (question.affectsMastery === false) return attempt;

  profile.totalAttempts += 1;
  profile.attempts.push(attempt);
  profile.attempts = profile.attempts.slice(-LEARNING_ATTEMPT_LIMIT);

  if (masterySuccess) {
    profile.consecutiveErrors = 0;
    if (attempt.is_preview) profile.previewSuccesses += 1;
  } else {
    profile.consecutiveErrors += 1;
    if (attempt.is_preview) profile.previewSuccesses = Math.max(0, profile.previewSuccesses - 1);
  }

  if (attempt.is_preview && masterySuccess && profile.previewSuccesses >= 2 && profile.currentGrade < 4) {
    profile.currentGrade += 1;
    profile.previewSuccesses = 0;
    profile.readyForNext = false;
    profile.blendStage = 0;
    profile.consecutiveErrors = 0;
    profile.promotedAtAttempt = profile.totalAttempts;
  } else if (
    profile.currentGrade > 1
    && profile.promotedAtAttempt !== null
    && profile.totalAttempts - profile.promotedAtAttempt <= 5
    && profile.consecutiveErrors >= 2
  ) {
    profile.currentGrade -= 1;
    profile.previewSuccesses = 0;
    profile.readyForNext = false;
    profile.blendStage = 0;
    profile.consecutiveErrors = 0;
    profile.promotedAtAttempt = null;
  }

  refreshLearningReadiness();
  saveLearningProfile();
  document.documentElement.dataset.learningGrade = String(profile.currentGrade);
  return attempt;
}

function recordActivityInteraction(mission, gameType, correct, errorType = null) {
  const attempt = recordLearningAttempt({
    kind: mission.type || `${gameType}_activity`,
    grade: mission.grade || state.learningProfile.currentGrade,
    gameType,
    affectsMastery: false,
    startedAtMs: mission.startedAtMs || performance.now(),
    interactionMode: mission.interactionMode || "drag_drop",
    usedHint: false,
    eventType: "drag_attempt",
    errorType,
  }, correct);
}

function currentDifficultyScore() {
  const profile = state.learningProfile || createDefaultLearningProfile();
  const grade = clamp(Number(profile.currentGrade) || 1, 1, 4);
  const recent = Array.isArray(profile.attempts) ? profile.attempts.slice(-10) : [];
  const sameGradeRecent = recent.filter((attempt) => attempt.question_grade === grade);
  const correct = sameGradeRecent.filter((attempt) => attempt.mastery_success ?? attempt.is_correct).length;
  const accuracyBonus = sameGradeRecent.length ? correct / sameGradeRecent.length : 0;
  const readinessBonus = profile.readyForNext ? 0.75 : 0;
  const previewBonus = Math.min(0.5, Math.max(0, Number(profile.previewSuccesses) || 0) * 0.25);
  return clamp(Math.round(((grade - 1) * 2.2 + 2.2 + accuracyBonus * 0.7 + readinessBonus + previewBonus) * 10) / 10, 1, 10);
}

function difficultySummaryText() {
  const profile = state.learningProfile || createDefaultLearningProfile();
  const grade = clamp(Number(profile.currentGrade) || 1, 1, 4);
  const score = currentDifficultyScore();
  const status = profile.readyForNext
    ? "다음 단계 준비 중"
    : profile.consecutiveErrors >= 2
    ? "복습 안정화 중"
    : "현재 단계 적응 중";
  return `현재 수행 난이도: ${score}/10 · ${grade}단계 · ${status}`;
}

function recordActivityOutcome(mission, gameType) {
  const grade = mission.grade || state.learningProfile.currentGrade;
  const errorCount = Math.max(0, Number(mission.errorCount) || 0);
  const allowedErrors = grade <= 2 ? 1 : 2;
  const reactionTime = performance.now() - (mission.startedAtMs || performance.now());
  const maxDurationMs = grade <= 2 ? 90000 : 120000;
  const masterySuccess = errorCount <= allowedErrors && reactionTime <= maxDurationMs;

  const attempt = recordLearningAttempt({
    kind: mission.type || `${gameType}_activity`,
    grade,
    gameType,
    affectsMastery: true,
    startedAtMs: mission.startedAtMs || performance.now(),
    interactionMode: mission.interactionMode || "drag_drop",
    usedHint: Boolean(mission.usedHint),
    isPreview: Boolean(mission.isPreview),
    eventType: "activity_summary",
    errorCount,
    masterySuccess,
  }, true);
  const count = Math.max(0, Number(state.learningProfile.activityCounts[gameType]) || 0);
  state.learningProfile.activityCounts[gameType] = count + 1;
  saveLearningProfile();
  return attempt;
}

const PARENT_ACTIVITY_LABELS = {
  insect_collection: "곤충 수학",
  chicken_coop: "닭장 수·분류",
  fly_catching: "닭장 파리 찾기·수 세기",
  store_shopping: "슈퍼 심부름·돈 계산",
  store_gacha: "슈퍼 뽑기·100원 계산",
  stream_crayfish: "개울가 가재잡기·상황 연산",
  stream_skipping: "개울가 물수제비·횟수 세기",
  wood_mission: "부엌 장작 수식",
  plum_wash: "부엌 자두 세기",
  plum_subtraction: "부엌 자두 돌발 뺄셈",
  soban_setting: "부엌 1대1 대응",
  cat_subtraction: "고양이 뺄셈",
};

let parentAuthAnswer = 0;
let parentHoldTimer = null;
let parentHoldStartedAt = 0;
let parentTapCount = 0;
let parentTapResetTimer = null;
let parentSelectedPeriod = "today";

function meaningfulParentAttempts() {
  const source = state.problemLog.length ? state.problemLog : state.learningProfile.attempts;
  return source.filter((attempt) =>
    attempt.event_type === "problem_attempt" || attempt.event_type === "activity_summary"
  );
}

function summarizeParentAttempts(attempts) {
  const successful = attempts.filter((attempt) => attempt.mastery_success ?? attempt.is_correct);
  const timed = attempts.filter((attempt) => Number.isFinite(attempt.reaction_time_ms));
  return {
    sample_size: attempts.length,
    accuracy: attempts.length ? successful.length / attempts.length : null,
    average_reaction_ms: timed.length
      ? Math.round(timed.reduce((sum, attempt) => sum + attempt.reaction_time_ms, 0) / timed.length)
      : null,
    hint_ratio: attempts.length
      ? attempts.filter((attempt) => attempt.used_hint).length / attempts.length
      : null,
  };
}

function parentAttemptDateKey(attempt) {
  const date = new Date(attempt.recorded_at || "");
  return Number.isNaN(date.getTime()) ? null : localDateKey(date);
}

function parentPeriodAttempts(attempts, period) {
  const today = new Date();
  const todayKey = localDateKey(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = localDateKey(yesterday);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const startKey = localDateKey(sevenDaysAgo);

  return attempts.filter((attempt) => {
    const key = parentAttemptDateKey(attempt);
    if (!key) return false;
    if (period === "today") return key === todayKey;
    if (period === "yesterday") return key === yesterdayKey;
    return key >= startKey && key <= todayKey;
  });
}

function makeParentDailyTrend(attempts) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const dateKey = localDateKey(date);
    const dailyAttempts = attempts.filter((attempt) => parentAttemptDateKey(attempt) === dateKey);
    const summary = summarizeParentAttempts(dailyAttempts);
    return {
      date_key: dateKey,
      label: `${date.getMonth() + 1}/${date.getDate()}`,
      ...summary,
    };
  });
}

function buildParentTrendText(dailyTrend, period, sampleSize) {
  const today = dailyTrend[dailyTrend.length - 1];
  const yesterday = dailyTrend[dailyTrend.length - 2];
  const periodLabel = period === "today" ? "오늘" : period === "yesterday" ? "어제" : "최근 7일";
  const prefix = `${periodLabel} 기록 ${sampleSize}개.`;
  if (!today.sample_size || !yesterday.sample_size) {
    return `${prefix} 오늘과 어제를 비교하려면 양쪽 날짜에 학습 기록이 필요합니다.`;
  }

  const parts = [];
  const accuracyDelta = Math.round((today.accuracy - yesterday.accuracy) * 100);
  if (accuracyDelta > 0) parts.push(`정확도가 어제보다 ${accuracyDelta}%p 높습니다`);
  else if (accuracyDelta < 0) parts.push(`정확도가 어제보다 ${Math.abs(accuracyDelta)}%p 낮습니다`);
  else parts.push("정확도는 어제와 같습니다");

  if (today.average_reaction_ms !== null && yesterday.average_reaction_ms !== null) {
    const reactionDelta = today.average_reaction_ms - yesterday.average_reaction_ms;
    if (Math.abs(reactionDelta) < 100) parts.push("반응시간은 비슷합니다");
    else if (reactionDelta < 0) parts.push(`${(Math.abs(reactionDelta) / 1000).toFixed(1)}초 빨라졌습니다`);
    else parts.push(`${(reactionDelta / 1000).toFixed(1)}초 느려졌습니다`);
  }

  if (today.hint_ratio !== null && yesterday.hint_ratio !== null) {
    const hintDelta = Math.round((today.hint_ratio - yesterday.hint_ratio) * 100);
    if (hintDelta < 0) parts.push(`힌트 사용이 ${Math.abs(hintDelta)}%p 줄었습니다`);
    else if (hintDelta > 0) parts.push(`힌트 사용이 ${hintDelta}%p 늘었습니다`);
  }
  return `${prefix} ${parts.join(". ")}.`;
}

function makeParentReport(period = parentSelectedPeriod) {
  const attempts = meaningfulParentAttempts();
  const periodRecords = parentPeriodAttempts(attempts, period);
  const summary = summarizeParentAttempts(periodRecords);
  const accuracy = summary.accuracy;
  const hintRatio = summary.hint_ratio;
  const groups = {};

  periodRecords.forEach((attempt) => {
    const key = attempt.game_type || "other";
    groups[key] ||= { attempts: 0, successes: 0, totalReactionMs: 0, timed: 0, errors: 0, interactionModes: {} };
    const group = groups[key];
    group.attempts += 1;
    group.successes += (attempt.mastery_success ?? attempt.is_correct) ? 1 : 0;
    group.errors += Math.max(0, Number(attempt.error_count) || 0) + (attempt.is_correct === false ? 1 : 0);
    const interactionMode = attempt.interaction_mode || "unknown";
    group.interactionModes[interactionMode] = (group.interactionModes[interactionMode] || 0) + 1;
    if (Number.isFinite(attempt.reaction_time_ms)) {
      group.totalReactionMs += attempt.reaction_time_ms;
      group.timed += 1;
    }
  });

  const activities = Object.entries(groups).map(([key, group]) => ({
    key,
    label: PARENT_ACTIVITY_LABELS[key] || key,
    attempts: group.attempts,
    accuracy: group.attempts ? group.successes / group.attempts : 0,
    average_reaction_ms: group.timed ? Math.round(group.totalReactionMs / group.timed) : null,
    errors: group.errors,
    interaction_modes: group.interactionModes,
  }));
  const practiced = activities.filter((activity) => activity.attempts >= 2);
  const strength = practiced.length
    ? [...practiced].sort((a, b) => b.accuracy - a.accuracy || a.average_reaction_ms - b.average_reaction_ms)[0]
    : null;
  const focus = practiced.length
    ? [...practiced].sort((a, b) => a.accuracy - b.accuracy || b.errors - a.errors)[0]
    : null;

  let strengthText = "아직 판단할 기록이 충분하지 않습니다. 활동을 5회 이상 진행해 주세요.";
  let focusText = "현재는 다양한 활동을 짧게 경험하며 기초 기록을 모으는 단계입니다.";
  let homePlay = "실물 5개를 놓고 하나씩 짝지어 세어보는 놀이를 5분 정도 해보세요.";
  if (strength) {
    strengthText = `${strength.label}에서 ${Math.round(strength.accuracy * 100)}%의 정확도를 보였습니다.`;
  }
  if (focus) {
    focusText = `${focus.label}은 정확도 ${Math.round(focus.accuracy * 100)}%입니다. 정답을 알려주기보다 사물을 직접 옮겨보게 해주세요.`;
  }
  if (hintRatio !== null && hintRatio >= 0.4) {
    homePlay = "숫자를 먼저 묻지 말고 콩이나 블록을 직접 옮긴 뒤, 마지막에 숫자로 말하게 해보세요.";
  } else if (accuracy !== null && accuracy >= 0.85) {
    homePlay = "익숙한 문제 4개 뒤에 조금 어려운 문제 1개를 섞어 80:20 비율로 놀이해 보세요.";
  } else if (accuracy !== null && accuracy < 0.65) {
    homePlay = "문제 수를 줄이고 1~5개의 실물부터 천천히 짝짓기와 수 세기를 반복해 보세요.";
  }

  return {
    generated_at: new Date().toISOString(),
    storage_scope: "이 기기의 현재 브라우저",
    selected_period: period,
    profile: {
      current_grade: state.learningProfile.currentGrade,
      ready_for_next: state.learningProfile.readyForNext,
      total_mastery_attempts: state.learningProfile.totalAttempts,
      recorded_attempts: periodRecords.length,
      total_recorded_attempts: attempts.length,
    },
    recent_summary: {
      sample_size: summary.sample_size,
      accuracy: accuracy === null ? null : Number(accuracy.toFixed(3)),
      average_reaction_ms: summary.average_reaction_ms,
      hint_ratio: hintRatio === null ? null : Number(hintRatio.toFixed(3)),
    },
    norm_reference_baselines: {
      note: "교육적 비교 기준입니다. 의학적 진단 기준으로 사용하지 않습니다.",
      subitizing_processing_speed: {
        task: "불규칙 시각 수량 패턴, 약 4개 기준",
        mean_reaction_sec: 3.0,
        standard_deviation_sec: 0.8,
      },
      executive_function_switch_cost: {
        task: "돌발 방해 또는 교차 학습 이벤트 이후 규칙 전환",
        mean_additional_delay_sec: 2.5,
      },
      representational_stage: {
        age_reference: "6세 후반 평균",
        concrete_or_pictorial_dependency_ratio: 0.65,
        symbolic_number_input_ratio: 0.35,
      },
    },
    daily_trend: makeParentDailyTrend(attempts),
    activities,
    interpretation: { strength: strengthText, focus: focusText, home_play: homePlay },
    recent_raw_data: periodRecords.slice(-60),
  };
}

function renderParentDailyTrend(dailyTrend) {
  ui.parentDailyTrend.replaceChildren();
  dailyTrend.forEach((day) => {
    const item = document.createElement("article");
    if (!day.sample_size) item.classList.add("is-empty");
    const label = document.createElement("span");
    label.textContent = day.label;
    const value = document.createElement("strong");
    value.textContent = day.accuracy === null ? "-" : `${Math.round(day.accuracy * 100)}%`;
    const count = document.createElement("small");
    count.textContent = `${day.sample_size}문제`;
    item.append(label, value, count);
    ui.parentDailyTrend.append(item);
  });
}

function renderParentDashboard(period = parentSelectedPeriod) {
  parentSelectedPeriod = period;
  const report = makeParentReport(period);
  const summary = report.recent_summary;
  document.querySelectorAll("[data-parent-period]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.parentPeriod === period);
  });
  document.getElementById("parentGrade").textContent = `${report.profile.current_grade}단계`;
  document.getElementById("parentAttempts").textContent = `${report.profile.recorded_attempts}개`;
  document.getElementById("parentAccuracy").textContent = summary.accuracy === null
    ? "기록 없음"
    : `${Math.round(summary.accuracy * 100)}%`;
  document.getElementById("parentReaction").textContent = summary.average_reaction_ms === null
    ? "기록 없음"
    : `${(summary.average_reaction_ms / 1000).toFixed(1)}초`;
  ui.parentHintRatio.textContent = summary.hint_ratio === null
    ? "기록 없음"
    : `${Math.round(summary.hint_ratio * 100)}%`;
  ui.parentTrendSummary.textContent = buildParentTrendText(report.daily_trend, period, summary.sample_size);
  renderParentDailyTrend(report.daily_trend);
  document.getElementById("parentStrength").textContent = report.interpretation.strength;
  document.getElementById("parentFocus").textContent = report.interpretation.focus;
  document.getElementById("parentHomePlay").textContent = report.interpretation.home_play;
  ui.parentCopyStatus.textContent = "";
  return report;
}

function buildParentAiPrompt() {
  const report = makeParentReport("7days");
  return `You are a pediatric cognitive-development report assistant for a 6–8 year-old educational math game called "Dongwoo's Summer Vacation".

당신의 역할은 아이를 진단하거나 장애명을 추정하는 것이 아닙니다.
당신의 역할은 게임 플레이 원시 기록을 바탕으로 학부모가 이해할 수 있는 정밀한 발달 관찰 리포트를 작성하는 것입니다.
아래 기준값은 교육적 비교 기준이며, 의학적 진단 컷오프가 아닙니다.

[Core Persona]
- 소아 인지 발달, 초기 수 개념, 실행 기능, 교육심리 평가에 익숙한 전문가처럼 작성하세요.
- 출력은 한국어로만 작성하세요.
- 톤은 대학 병원 발달검사 결과지처럼 분석적이되, 학부모가 이해하기 쉽고 따뜻해야 합니다.

[Input Data]
아래 JSON에는 최근 7일 기준 게임 기록이 포함됩니다.
주요 필드:
- reaction_time_ms: 반응시간
- is_correct / mastery_success: 정답 및 숙달 여부
- game_type / question_kind: 활동 및 문제 유형
- interaction_mode: number_pad, drag_drop, concrete_manipulation 등
- used_hint: 힌트 사용 여부
- event_type: problem_attempt, activity_summary, drag_attempt 등
- error_count / error_type: 오류 수와 오류 유형
- daily_trend: 날짜별 기록
- norm_reference_baselines: 비교 기준값

[Baseline References]
아래 기준을 반드시 사용하여 비교하세요.

1. 수비타이징 및 정보 처리 속도
- 불규칙 시각 수량 패턴, 약 4개 기준
- 평균 반응시간: 3.0초
- 표준편차: 0.8초

2. 전두엽 실행 기능 및 인지적 유연성
- 돌발 방해 또는 교차 학습 이벤트 이후 규칙 전환 지연
- 평균 추가 전환 비용: +2.5초

3. 표상 단계 발달 궤적
- 6세 후반 평균 구체물/영상적 조작 의존도: 65%
- 6세 후반 평균 상징적 숫자 입력 사용률: 35%

[Analysis Rules]
- JSON을 단순 요약하지 말고, 반드시 기준값과 대조하세요.
- 밀리초는 초 단위로 변환하세요.
- 가능하면 평균 반응시간, 정확도, 힌트 사용률, 조작 방식 비율을 계산하세요.
- 가능하면 z-score 논리를 사용하세요: z = (child_value - baseline_mean) / baseline_sd
- 백분위는 “교육적 추정 백분위”라고 명시하세요.
- 표본 수가 적으면 해석이 잠정적이라고 명시하세요.
- 빠른 반응이 항상 좋은 것은 아닙니다. 빠르지만 정확도가 낮으면 충동적 추측 가능성으로 조심스럽게 해석하세요.
- 느리지만 정확도가 높으면 신중한 처리 전략으로 해석할 수 있습니다.
- 구체물 조작 의존은 이 연령에서 정상적인 발달 경로로 설명하세요.
- 숫자패드 사용률 증가나 힌트 후 숫자풀이 복귀는 상징적 표상 전이의 신호로 해석하세요.
- 다음 표현은 사용하지 마세요: 장애, 결핍, ADHD, 자폐, 지적장애, 진단, 병리, 이상, 임상 위험.
- 다음 표현을 사용하세요: 관찰, 경향, 현재 패턴, 학습 프로파일, 지원 필요, 다음 발달 단계.

[Required Output Structure]

1. [정량적 인지 처리 속도 관찰]
- 아이의 평균 반응시간을 제시하세요.
- 3.0초 ± 0.8초 기준과 비교하세요.
- 빠른지, 유사한지, 느린지 설명하세요.
- 정확도와 함께 해석하세요.

2. [전두엽 실행 기능 및 인지적 유연성 관찰]
- 돌발 이벤트 또는 활동 전환 기록이 있으면 분석하세요.
- 관찰된 전환 지연을 +2.5초 기준과 비교하세요.
- 빠르게 회복했는지, 추가 시간이 필요했는지, 안정적으로 적응했는지 설명하세요.
- 데이터가 없으면 “현재 기록만으로는 전환 비용을 충분히 판단하기 어렵다”고 쓰세요.

3. [표상 단계 전이 상태]
- interaction_mode 비율을 계산하세요.
- 구체물/드래그 의존도와 숫자패드/상징 입력 비율을 65% / 35% 기준과 비교하세요.
- 이것을 통과/실패가 아니라 발달 전이 상태로 설명하세요.

4. [활동별 강점과 부담 지점]
- 어떤 활동에서 강점이 보이는지 JSON 근거로 쓰세요.
- 어떤 활동에서 지원이 필요한지 JSON 근거로 쓰세요.
- 정확도, 반응시간, 힌트 사용, 오류 유형을 함께 보세요.

5. [다음 발달을 위한 JME 처방]
- 오프라인에서 부모와 아이가 할 수 있는 활동을 정확히 1개만 제안하세요.
- 10분 안에 가능해야 합니다.
- 아이의 현재 데이터 패턴과 연결해서 왜 이 활동이 필요한지 설명하세요.
- 예: 밥상 숟가락 놓기, 과일 10개 묶기, 장난감이 사라진 뒤 남은 수 말하기.

[Final Safety Sentence]
리포트 마지막 문장은 반드시 아래 문장으로 끝내세요.
"이 리포트는 게임 플레이 기록을 바탕으로 한 발달 관찰 자료이며, 의학적 진단이나 전문 검사 결과를 대체하지 않습니다."

[Writing Style]
- 한국어만 사용하세요.
- 숫자 근거를 포함하세요.
- 막연한 칭찬을 피하세요.
- 과장된 진단적 표현을 피하세요.
- 학부모가 바로 읽을 수 있도록 구조화하세요.

[동우의 여름방학 학습 데이터]
${JSON.stringify(report, null, 2)}`;
}

async function copyParentAiPrompt() {
  const text = buildParentAiPrompt();
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.append(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }
  ui.parentCopyStatus.textContent = "복사했습니다. 원하는 AI 채팅창에 붙여넣으세요.";
}

const TRANSFER_STORAGE_KEYS = [
  GAME_SAVE_KEY,
  COLLECTION_BACKUP_KEY,
  PROBLEM_LOG_KEY,
  LEARNING_PROFILE_KEY,
  LEGACY_LEARNING_PROFILE_KEY,
  MUSIC_PREFERENCE_KEY,
];

function exportParentLearningData() {
  saveGameProgress();
  const data = {};
  TRANSFER_STORAGE_KEYS.forEach((key) => {
    const value = localStorage.getItem(key);
    if (value !== null) data[key] = value;
  });
  const payload = {
    format: "dongwoo-summer-study-backup",
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `dongwoo-study-backup-${localDateKey()}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
  ui.parentCopyStatus.textContent = "학습 기록 백업 파일을 저장했습니다.";
}

async function importParentLearningData(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  try {
    const payload = JSON.parse(await file.text());
    if (
      payload?.format !== "dongwoo-summer-study-backup"
      || payload?.version !== 1
      || !payload.data
      || typeof payload.data !== "object"
    ) {
      throw new Error("invalid backup format");
    }
    if (!window.confirm("현재 기록을 백업 파일의 기록으로 바꿀까요?")) return;
    TRANSFER_STORAGE_KEYS.forEach((key) => {
      const value = payload.data[key];
      if (typeof value === "string") localStorage.setItem(key, value);
    });
    window.alert("기록을 가져왔습니다. 최신 상태로 다시 시작합니다.");
    window.location.reload();
  } catch {
    ui.parentCopyStatus.textContent = "올바른 동우 학습 기록 파일이 아닙니다.";
  }
}

function prepareParentAuth() {
  const left = nextRandomInt("parentAuthLeft", 2, 9);
  const right = nextRandomInt("parentAuthRight", 2, 9);
  parentAuthAnswer = left * right;
  ui.parentQuestion.textContent = `${left} × ${right} = ?`;
  ui.parentAnswer.value = "";
  ui.parentAuthMessage.textContent = "";
  ui.parentAuthView.classList.remove("is-hidden");
  ui.parentDashboardView.classList.add("is-hidden");
}

function openParentGate() {
  clearTimeout(parentHoldTimer);
  parentHoldTimer = null;
  parentHoldStartedAt = 0;
  ui.parentEntry.classList.remove("is-holding");
  prepareParentAuth();
  ui.parentOverlay.classList.remove("is-hidden");
  ui.gameOst?.pause();
  setTimeout(() => ui.parentAnswer.focus(), 50);
}

function closeParentDashboard() {
  ui.parentOverlay.classList.add("is-hidden");
  ui.parentAuthMessage.textContent = "";
  ui.parentCopyStatus.textContent = "";
  if (musicEnabled && musicStarted) startMusic();
}

function beginParentHold(event) {
  if (event.pointerType === "mouse" && event.button !== 0) return;
  event.preventDefault();
  clearTimeout(parentHoldTimer);
  parentHoldStartedAt = performance.now();
  try {
    ui.parentEntry.setPointerCapture(event.pointerId);
  } catch {
    // Pointer capture is optional on older tablet browsers.
  }
  ui.parentEntry.classList.add("is-holding");
  parentHoldTimer = setTimeout(openParentGate, 3000);
}

function cancelParentHold(resetStartedAt = true) {
  clearTimeout(parentHoldTimer);
  parentHoldTimer = null;
  if (resetStartedAt) parentHoldStartedAt = 0;
  ui.parentEntry?.classList.remove("is-holding");
}

function registerParentFallbackTap() {
  clearTimeout(parentTapResetTimer);
  parentTapCount += 1;
  if (parentTapCount >= 5) {
    parentTapCount = 0;
    openParentGate();
    return;
  }
  parentTapResetTimer = setTimeout(() => {
    parentTapCount = 0;
  }, 2600);
}

function finishParentHold(event) {
  const heldMs = parentHoldStartedAt ? performance.now() - parentHoldStartedAt : 0;
  try {
    if (ui.parentEntry.hasPointerCapture?.(event.pointerId)) {
      ui.parentEntry.releasePointerCapture(event.pointerId);
    }
  } catch {
    // Releasing pointer capture is optional on older tablet browsers.
  }
  if (!ui.parentOverlay.classList.contains("is-hidden")) {
    cancelParentHold();
    return;
  }
  if (heldMs >= 2600) {
    openParentGate();
    return;
  }
  cancelParentHold();
  if (heldMs > 0 && heldMs < 700) registerParentFallbackTap();
}

function handleParentHoldCancel() {
  const heldMs = parentHoldStartedAt ? performance.now() - parentHoldStartedAt : 0;
  if (heldMs >= 2400) {
    openParentGate();
  } else {
    cancelParentHold();
  }
}

function verifyParentAuth(event) {
  event.preventDefault();
  if (Number(ui.parentAnswer.value) !== parentAuthAnswer) {
    ui.parentAuthMessage.textContent = "답이 맞지 않습니다. 다시 확인해 주세요.";
    ui.parentAnswer.select();
    return;
  }
  ui.parentAuthView.classList.add("is-hidden");
  ui.parentDashboardView.classList.remove("is-hidden");
  renderParentDashboard();
}

const DONGWOO_ANIMATION = {
  idle: ASSETS.dongwoo.idle,
  walk: [
    ASSETS.dongwoo.walk[0],
    ASSETS.dongwoo.walk[1],
    ASSETS.dongwoo.walk[0],
    ASSETS.dongwoo.walk[3],
  ],
  catch: ASSETS.dongwoo.catch,
};

const images = new Map();

function fitGameToVisualViewport() {
  const viewport = window.visualViewport;
  const viewportWidth = viewport?.width || window.innerWidth;
  const viewportHeight = viewport?.height || window.innerHeight;
  const maxScale = Math.min(viewportWidth / 1280, viewportHeight / 720, 1);
  const width = Math.max(1, Math.floor(1280 * maxScale));
  const height = Math.max(1, Math.floor(720 * maxScale));
  const offsetLeft = viewport?.offsetLeft || 0;
  const offsetTop = viewport?.offsetTop || 0;

  ui.shell.style.position = "fixed";
  ui.shell.style.width = `${width}px`;
  ui.shell.style.height = `${height}px`;
  ui.shell.style.maxHeight = "none";
  ui.shell.style.left = `${Math.round(offsetLeft + viewportWidth / 2)}px`;
  ui.shell.style.top = `${Math.round(offsetTop + viewportHeight / 2)}px`;
  ui.shell.style.transform = "translate(-50%, -50%)";
}

const state = {
  scene: "yard",
  diaryView: "guide",
  guidePage: 0,
  stars: 0,
  bugs: 0,
  quests: 0,
  time: 0,
  dongwoo: {
    x: 590,
    y: 482,
    scale: 0.72,
    action: "idle",
    actionUntil: 0,
    facing: 1,
  },
  butterflies: [],
  collected: {},
  figureCollection: {},
  gachaReward: {
    earned: false,
    used: false,
    dateKey: localDateKey(),
  },
  dailyCaught: {},
  activeQuestion: null,
  secretMission: null,
  woodMission: null,
  woodMissionActive: false,
  draggingWoodId: null,
  plumMission: null,
  plumMissionActive: false,
  draggingPlumId: null,
  sobanMission: null,
  sobanMissionActive: false,
  draggingSobanId: null,
  catSnackMission: null,
  catSnackMissionActive: false,
  storeMission: null,
  storeMissionActive: false,
  draggingStoreMoney: null,
  storeGachaMission: null,
  storeGachaActive: false,
  draggingGachaCoin: false,
  streamCrayfishMission: null,
  streamCrayfishActive: false,
  streamSkippingMission: null,
  streamSkippingActive: false,
  chickenCoopMission: null,
  chickenCoopActive: false,
  draggingEggId: null,
  flyMission: null,
  storyUntil: 0,
  todayMission: null,
  lastDailyDateKey: localDateKey(),
  dailyMissionHistory: [],
  learningProfile: createDefaultLearningProfile(),
  sessionPlan: null,
  activityLog: [],
  problemLog: [],
  diaryStamps: {
    subitize: 0,
    interleaving: 0,
    embodied: 0,
    mission: 0,
  },
  diaryIllustrations: {},
  diaryHighlightKey: null,
  diaryHighlightLocked: false,
  latestPraiseSticker: null,
  missionToastUntil: 0,
  collectionCompleteToastUntil: 0,
  feedbackUntil: 0,
  activityFlow: null,
  problemHistory: {},
  insectQuestionIndex: 0,
};

function nextRandomInt(key, min, max) {
  const low = Math.ceil(min);
  const high = Math.floor(max);
  const previous = state.problemHistory[key];
  let value = low + Math.floor(Math.random() * (high - low + 1));

  if (high > low && value === previous) {
    value = low + ((value - low + 1 + Math.floor(Math.random() * (high - low))) % (high - low + 1));
  }

  state.problemHistory[key] = value;
  return value;
}

function rememberProblem(key, signature) {
  if (state.problemHistory[key] === signature) return false;
  state.problemHistory[key] = signature;
  return true;
}

const FURNACE_ZONE = { x: 662, y: 358, w: 186, h: 126 };
const BASIN_ZONE = { x: 648, y: 374, w: 252, h: 154 };
const SOBAN_ZONE = { x: 615, y: 342, w: 350, h: 214 };
const CAT_SNACK_PLATE = { x: 390, y: 382, w: 520, h: 206 };
const STORE_SNACKS = [
  { id: "shrimp", label: "새우깡", crop: [44, 112, 190, 174] },
  { id: "choco", label: "초코파이", crop: [321, 124, 190, 158] },
  { id: "pocachip", label: "포카칩", crop: [583, 118, 190, 176] },
  { id: "jjanggu", label: "짱구", crop: [816, 120, 178, 172] },
  { id: "corn", label: "꼬깔콘", crop: [1030, 114, 176, 178] },
  { id: "margaret", label: "마가렛트", crop: [42, 337, 205, 145] },
  { id: "chicchoc", label: "칙촉", crop: [310, 338, 205, 144] },
  { id: "waffle", label: "버터와플", crop: [532, 342, 190, 136] },
  { id: "pepero", label: "빼빼로", crop: [765, 323, 122, 165] },
];
const STORE_MONEY = [
  { id: "coin100", label: "100원", value: 100, crop: [688, 112, 128, 128], shape: "coin" },
  { id: "coin500", label: "500원", value: 500, crop: [992, 96, 146, 142], shape: "coin" },
  { id: "bill1000", label: "1000원", value: 1000, crop: [42, 301, 294, 154], shape: "bill" },
];
const GACHA_CROPS = {
  machine: [535, 104, 292, 522],
  capsuleClosed: [72, 132, 186, 190],
  coinInsert: [312, 408, 248, 192],
  capsuleOut: [780, 404, 220, 202],
  rewardBasket: [1010, 420, 228, 204],
};
const GACHA_COIN_HOME = { x: 222, y: 548 };
const GACHA_COIN_SLOT = { x: 526, y: 398, w: 92, h: 120 };
const GACHA_HANDLE_BUTTON = { x: 524, y: 574, w: 222, h: 58 };
const GACHA_FIGURES = [
  { id: "mini_car", label: "빨간 미니카", crop: [58, 170, 350, 180] },
  { id: "roadster", label: "초록 클래식카", crop: [484, 168, 340, 180] },
  { id: "mini_robot", label: "노란 덤프트럭", crop: [882, 166, 342, 184] },
  { id: "police_car", label: "경찰 순찰차", crop: [74, 468, 336, 170] },
  { id: "offroad_car", label: "갈색 몬스터카", crop: [484, 468, 338, 170] },
  { id: "blue_bus", label: "파란 시내버스", crop: [884, 468, 338, 170] },
  { id: "fire_truck", label: "빨간 소방차", crop: [70, 96, 405, 260], sheet: "sheet2", rarity: "new" },
  { id: "airport_tug", label: "공항 견인차", crop: [620, 126, 300, 190], sheet: "sheet2" },
  { id: "rail_repair", label: "노란 철도차", crop: [1000, 126, 220, 190], sheet: "sheet2" },
  { id: "space_rover", label: "달 탐사차", crop: [88, 468, 310, 174], sheet: "sheet2" },
  { id: "amphibious_car", label: "초록 물놀이차", crop: [510, 468, 310, 174], sheet: "sheet2" },
  { id: "science_truck", label: "하얀 연구트럭", crop: [900, 452, 330, 190], sheet: "sheet2" },
];
const CHICKEN_COOP_ZONES = {
  yellow: { x: 742, y: 338, w: 176, h: 126, label: "노란 달걀" },
  cream: { x: 972, y: 338, w: 176, h: 126, label: "크림색 달걀" },
};
const CHICKEN_COOP_PAYLOAD = {
  stage_info: {
    map: "chicken_coop",
    grade_level: 3,
    problem_type: "conditional_classification",
  },
  assets_required: [
    "basket_empty",
    "egg_yellow_3",
    "egg_cream_2",
    "egg_blue_3",
  ],
  logic_rules: {
    target_basket_yellow: { color: "yellow", target_count: 3 },
    target_basket_cream: { color: "cream", target_count: 2 },
  },
  feedback_fx: {
    on_drag_hover: "watercolor_glow",
    on_error: "confused_chick",
  },
};

const airSpawnZones = [
  { name: "left_flowers", x: 90, y: 260, w: 260, h: 170 },
  { name: "center_clover", x: 430, y: 250, w: 300, h: 180 },
  { name: "right_log", x: 720, y: 230, w: 230, h: 210 },
];
const groundSpawnZones = [
  { name: "left_ground", x: 90, y: 360, w: 300, h: 104 },
  { name: "center_ground", x: 370, y: 390, w: 370, h: 105 },
  { name: "right_ground", x: 690, y: 370, w: 310, h: 115 },
];

function loadImage(src) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      images.set(src, image);
      resolve();
    };
    image.onerror = () => {
      console.warn(`Failed to load ${src}`);
      resolve();
    };
    image.src = src;
  });
}

function allAssetPaths() {
  return [
    ASSETS.yard,
    ASSETS.insectMap,
    ASSETS.fireflyNightMap,
    ASSETS.kitchenMap,
    ASSETS.chickenCoopMap,
    ASSETS.streamMap,
    ASSETS.storeMap,
    ASSETS.storeShopping.snacks,
    ASSETS.storeShopping.money,
    ASSETS.storeGacha.sheet,
    ASSETS.storeGacha.machine,
    ...Object.values(ASSETS.streamCrayfish),
    ...Object.values(ASSETS.streamSkipping),
    ASSETS.storeFigures.sheet,
    ASSETS.storeFigures.sheet2,
    ...Object.values(ASSETS.chickenCoop),
    ...Object.values(ASSETS.chickenFamily),
    ASSETS.titleLogo,
    ASSETS.diaryBook,
    ...Object.values(ASSETS.diaryScenes),
    ...Object.values(ASSETS.praiseStickers),
    ASSETS.subitizeObjects,
    ASSETS.watermelonSlice,
    ...Object.values(ASSETS.insectCards),
    ASSETS.plumWash.basinEmpty,
    ASSETS.plumWash.basinFull,
    ASSETS.plumWash.plumA,
    ASSETS.plumWash.plumB,
    ...ASSETS.plumWash.ripple,
    ASSETS.plumWash.splash,
    ...Object.values(ASSETS.woodFire),
    ASSETS.soban.empty,
    ASSETS.soban.guide,
    ASSETS.soban.full,
    ASSETS.soban.bowl,
    ASSETS.soban.spoon,
    ASSETS.catSnack.plate,
    ASSETS.catSnack.potato,
    ASSETS.catSnack.sausage,
    ASSETS.catSnack.cat,
    ...ASSETS.catSnack.watermelonBites,
    ...ASSETS.dongwoo.idle,
    ...ASSETS.dongwoo.walk,
    ...ASSETS.dongwoo.catch,
    ...ASSETS.butterfly,
    ...ASSETS.dragonfly,
    ...ASSETS.ladybug,
    ...ASSETS.rhinoceros_beetle,
    ...ASSETS.stag_beetle,
    ...ASSETS.cicada,
    ...ASSETS.mantis,
    ...ASSETS.grasshopper,
    ...ASSETS.firefly,
    ...ASSETS.dung_beetle,
    ...ASSETS.frog,
    ...ASSETS.red_eyed_frog,
    ...ASSETS.golden_dung_beetle,
    ...ASSETS.crayfish,
  ];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function randomSignedVelocity(min, max) {
  return randomBetween(min, max) * (Math.random() < 0.5 ? -1 : 1);
}

function choose(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function setScene(scene) {
  state.scene = scene;
  hideNayeonHint();
  if (scene !== "insects") state.collectionCompleteToastUntil = 0;
  if (scene !== "store") resetStoreMission();
  if (scene !== "stream") resetStreamMission();
  state.activeQuestion = null;
  ui.questionPanel?.classList.remove("is-hint-stage", "is-concrete-stage");
  ui.question?.classList.remove("is-wrong");
  ui.feedback?.classList.remove("is-wrong");
  ui.feedback.textContent = "";
  hideStoryPanel();
  ui.questionPanel?.classList.toggle("is-hidden", ["yard", "diary", "wood", "stream", "store"].includes(scene));
  ui.shell?.classList.toggle("is-kitchen", scene === "wood");
  ui.collectionPanel.classList.toggle("is-visible", scene === "insects");
  updateControlVisibility(scene);

  if (scene === "insects") {
    resetKitchenMissions();
    resetChickenCoopState();
    state.dongwoo.x = 180;
    state.dongwoo.y = 536;
    state.dongwoo.scale = 0.46;
    state.dongwoo.action = "walk";
    state.dongwoo.facing = 1;
    const remainingInsectsToday = Math.max(0, QUEST_TARGET - state.quests);
    const activeInsects = state.butterflies.filter((insect) => !insect.caught).length;
    if (
      state.butterflies.length === 0
      || activeInsects > remainingInsectsToday
      || (activeInsects === 0 && remainingInsectsToday > 0)
    ) {
      resetButterflies();
    }
    ui.mode.textContent = "뒷뜰";
    ui.question.textContent = remainingInsectsToday > 0
      ? `오늘 관찰할 곤충이 ${remainingInsectsToday}마리 남았어요. 곤충을 직접 눌러보세요.`
      : "오늘 곤충 관찰 일지를 모두 채웠어요!";
  } else if (scene === "coop") {
    resetKitchenMissions();
    resetChickenCoopState();
    state.dongwoo.x = 170;
    state.dongwoo.y = 548;
    state.dongwoo.scale = 0.46;
    state.dongwoo.action = "idle";
    state.dongwoo.facing = 1;
    ui.mode.textContent = "닭장";
    const nextCoopRound = state.todayMission?.rounds?.find((round) => round.scene === "coop" && !round.completed);
    ui.question.textContent = nextCoopRound
      ? `오늘의 닭장 활동은 '${nextCoopRound.label}'이에요.`
      : "닭장에서 할 활동을 골라보세요.";
    ui.feedback.textContent = nextCoopRound?.action === "flyGame"
      ? "아래 파리 잡기를 눌러 시작하세요."
      : nextCoopRound?.action === "chickenCoop"
        ? "달걀 놀이를 시작하면 활동이 열려요."
        : "오늘 할 일이 정해지면 활동이 열려요.";
  } else if (scene === "wood") {
    resetChickenCoopState();
    resetKitchenMissions();
    state.dongwoo.x = 332;
    state.dongwoo.y = 588;
    state.dongwoo.scale = 0.46;
    state.dongwoo.action = "idle";
    state.dongwoo.facing = 1;
    ui.mode.textContent = "부엌";
    ui.question.textContent = "부엌에서 할 활동을 골라보세요.";
    ui.feedback.textContent = "아래 장작 넣기, 자두 씻기, 소반 차리기를 눌러보세요.";
  } else if (scene === "stream") {
    resetKitchenMissions();
    resetChickenCoopState();
    state.dongwoo.x = 208;
    state.dongwoo.y = 590;
    state.dongwoo.scale = 0.44;
    state.dongwoo.action = "idle";
    state.dongwoo.facing = 1;
    ui.mode.textContent = "개울가";
    ui.question.textContent = "개울가에 도착했어요.";
    ui.feedback.textContent = "가재잡기를 누르면 물속 바위를 살펴볼 수 있어요.";
  } else if (scene === "store") {
    resetKitchenMissions();
    resetChickenCoopState();
    state.dongwoo.x = 1040;
    state.dongwoo.y = 610;
    state.dongwoo.scale = 0.44;
    state.dongwoo.action = "idle";
    state.dongwoo.facing = -1;
    ui.mode.textContent = "슈퍼";
    ui.question.textContent = "동네 슈퍼에 도착했어요.";
    ui.feedback.textContent = "슈퍼 심부름을 눌러 부탁받은 과자를 사 와요.";
  } else if (scene === "diary") {
    resetKitchenMissions();
    resetChickenCoopState();
    state.dongwoo.x = 1060;
    state.dongwoo.y = 558;
    state.dongwoo.scale = 0.48;
    state.dongwoo.action = "idle";
    state.dongwoo.facing = -1;
    ui.mode.textContent = "그림일기";
    ui.question.textContent = "오늘 동우가 한 활동을 그림일기로 모아봐요.";
    ui.feedback.textContent = "완료한 활동 기록이 여기에 모여요.";
  } else {
    resetKitchenMissions();
    resetChickenCoopState();
    state.dongwoo.x = 604;
    state.dongwoo.y = 538;
    state.dongwoo.scale = 0.54;
    state.dongwoo.action = "idle";
    state.dongwoo.facing = 1;
    ui.mode.textContent = "마당";
    ui.question.textContent = "그림일기, 뒷뜰, 부엌, 닭장 중 갈 곳을 골라요.";
  }

  renderAnswers([]);
  renderCollection();
}

function resetKitchenMissions() {
  state.woodMission = null;
  state.woodMissionActive = false;
  state.draggingWoodId = null;
  state.plumMission = null;
  state.plumMissionActive = false;
  state.draggingPlumId = null;
  state.sobanMission = null;
  state.sobanMissionActive = false;
  state.draggingSobanId = null;
  state.catSnackMission = null;
  state.catSnackMissionActive = false;
}

function resetChickenCoopState() {
  state.chickenCoopMission = null;
  state.chickenCoopActive = false;
  state.draggingEggId = null;
  state.flyMission = null;
}

function resetStoreMission() {
  state.storeMission = null;
  state.storeMissionActive = false;
  state.draggingStoreMoney = null;
  state.storeGachaMission = null;
  state.storeGachaActive = false;
  state.draggingGachaCoin = false;
}

function resetStreamMission() {
  state.streamCrayfishMission = null;
  state.streamCrayfishActive = false;
  state.streamSkippingMission = null;
  state.streamSkippingActive = false;
}

function activateKitchenMission(activeMission) {
  if (activeMission !== "wood") {
    state.woodMission = null;
    state.woodMissionActive = false;
    state.draggingWoodId = null;
  }
  if (activeMission !== "plum") {
    state.plumMission = null;
    state.plumMissionActive = false;
    state.draggingPlumId = null;
  }
  if (activeMission !== "soban") {
    state.sobanMission = null;
    state.sobanMissionActive = false;
    state.draggingSobanId = null;
  }
  if (activeMission !== "cat") {
    state.catSnackMission = null;
    state.catSnackMissionActive = false;
  }
  state.activeQuestion = null;
  renderAnswers([]);
  ui.questionPanel?.classList.add("is-hidden");
}

function todayMissionCompleted() {
  return Boolean(state.todayMission?.rounds?.length)
    && state.todayMission.rounds.every((round) => round.completed);
}

function sceneEntryAction(scene) {
  return {
    insects: "insects",
    coop: "chickenCoop",
    wood: "kitchen",
    store: "store",
    stream: "stream",
    yard: null,
    diary: "diary",
  }[scene] || null;
}

function todayMissionAllowedControls() {
  const allowed = new Set(["yard", "todayMission", "diary", "diaryGuide", "guideNext", "diaryJournal"]);
  if (!state.todayMission?.rounds?.length) return allowed;

  const incompleteRounds = state.todayMission.rounds.filter((round) => !round.completed);
  for (const round of incompleteRounds) {
    const sceneAction = sceneEntryAction(round.scene);
    if (sceneAction) allowed.add(sceneAction);
    allowed.add(round.action);
  }

  if (canUseTodayGacha() || todayMissionCompleted()) {
    allowed.add("store");
    allowed.add("storeGacha");
  }

  return allowed;
}

function isTodayMissionActionAllowed(action) {
  const allowed = todayMissionAllowedControls();
  return !allowed || allowed.has(action);
}

function isTodayMissionSceneAllowed(scene) {
  if (!state.todayMission?.rounds?.length) return true;
  if (["yard", "diary"].includes(scene)) return true;
  if (scene === "store" && (canUseTodayGacha() || todayMissionCompleted())) return true;
  return state.todayMission.rounds.some((round) => round.scene === scene);
}

function showTodayMissionLockedMessage() {
  const message = state.todayMission?.rounds?.length
    ? "오늘은 할머니가 정해준 활동만 열려 있어요."
    : "먼저 오늘미션을 눌러 할머니에게 오늘 할 일을 받아보세요.";
  ui.question.textContent = "지금은 이 활동을 할 수 없어요.";
  ui.feedback.textContent = message;
  showStoryMission(message, 3000);
}

function updateControlVisibility(scene = state.scene) {
  const controlsByScene = {
    yard: new Set(["diary", "todayMission", "insects", "kitchen", "chickenCoop", "cat", "stream", "store"]),
    insects: new Set(["yard"]),
    coop: new Set(["yard", "flyGame"]),
    wood: new Set(["yard", "woodMission", "plum", "soban"]),
    diary: new Set(["yard", "diaryGuide", "guideNext", "diaryJournal"]),
    stream: new Set(["yard", "streamCrayfish", "streamSkipping"]),
    store: new Set(["yard", "storeShopping", "storeGacha"]),
  };
  const visible = new Set(controlsByScene[scene] || controlsByScene.yard);
  const dailyAllowed = todayMissionAllowedControls();
  if (dailyAllowed) {
    for (const action of [...visible]) {
      if (!dailyAllowed.has(action)) visible.delete(action);
    }
  }

  document.querySelectorAll(".controls button[data-action]").forEach((button) => {
    button.classList.toggle("is-hidden", !visible.has(button.dataset.action));
  });
}

function resetGame(options = {}) {
  const clearProgress = Boolean(options.clearProgress);
  if (clearProgress) {
    try {
      localStorage.removeItem(GAME_SAVE_KEY);
    } catch {
      // Ignore storage failures and continue with an in-memory reset.
    }
  }
  state.stars = 0;
  state.bugs = 0;
  state.quests = 0;
  state.butterflies = [];
  state.collected = {};
  state.figureCollection = {};
  state.gachaReward = { earned: false, used: false, dateKey: localDateKey() };
  state.dailyCaught = {};
  state.activeQuestion = null;
  state.secretMission = null;
  state.todayMission = null;
  state.dailyMissionHistory = [];
  resetKitchenMissions();
  resetChickenCoopState();
  resetStoreMission();
  resetStreamMission();
  ui.questionPanel?.classList.add("is-hidden");
  hideStoryPanel();
  state.activityLog = [];
  state.latestPraiseSticker = null;
  state.diaryStamps = {
    subitize: 0,
    interleaving: 0,
    embodied: 0,
    mission: 0,
  };
  state.learningProfile = loadLearningProfile();
  state.problemLog = loadProblemLog();
  state.insectQuestionIndex = 0;
  document.documentElement.dataset.learningGrade = String(state.learningProfile.currentGrade);
  state.sessionPlan = createAdaptiveSessionPlan(state.learningProfile);
  state.missionToastUntil = 0;
  state.collectionCompleteToastUntil = 0;
  state.activityFlow = null;
  ui.activityOverlay?.classList.add("is-hidden");
  setScene("yard");
  syncHud();
  if (clearProgress) saveGameProgress();
}

const DAILY_ACTIVITY_POOL = [
  { label: "뒷뜰 곤충 관찰", scene: "insects", action: "catch", minutes: 5, category: "nature" },
  { label: "닭장 달걀 고르기", scene: "coop", action: "chickenCoop", minutes: 5, category: "coop" },
  { label: "닭장 파리 잡기", scene: "coop", action: "flyGame", minutes: 4, category: "coop" },
  { label: "부엌 장작 넣기", scene: "wood", action: "woodMission", minutes: 5, category: "kitchen" },
  { label: "자두 씻기", scene: "wood", action: "plum", minutes: 5, category: "kitchen" },
  { label: "소반 차리기", scene: "wood", action: "soban", minutes: 4, category: "kitchen" },
  { label: "수박 먹기", scene: "yard", action: "cat", minutes: 4, category: "yard" },
  { label: "개울가 가재잡기", scene: "stream", action: "streamCrayfish", minutes: 5, category: "stream" },
  { label: "개울가 물수제비", scene: "stream", action: "streamSkipping", minutes: 4, category: "stream" },
  { label: "슈퍼 심부름", scene: "store", action: "storeShopping", minutes: 5, category: "store" },
];

function recentDailyMissionActions(limitDays = 7) {
  return (state.dailyMissionHistory || [])
    .slice(-limitDays)
    .flatMap((entry) => Array.isArray(entry.actions) ? entry.actions : []);
}

function daysSinceAction(action) {
  const history = state.dailyMissionHistory || [];
  for (let offset = 0; offset < history.length; offset += 1) {
    const entry = history[history.length - 1 - offset];
    if (entry?.actions?.includes(action)) return offset;
  }
  return 99;
}

function scoreDailyActivity(activity, selected, recentActions) {
  const recentCount = recentActions.filter((action) => action === activity.action).length;
  const categoryCount = selected.filter((item) => item.category === activity.category).length;
  const staleBonus = Math.min(5, daysSinceAction(activity.action));
  const categoryPenalty = categoryCount * 2.25;
  return Math.random() * 1.8 + staleBonus * 0.95 + (3 - Math.min(3, recentCount)) * 1.35 - categoryPenalty;
}

function createBalancedDailyRounds() {
  const selected = [];
  const recentActions = recentDailyMissionActions(7);
  let totalMinutes = 0;

  while (
    selected.length < 6
    && (totalMinutes < DAILY_MISSION_TARGET_MINUTES.ideal || selected.length < 4)
  ) {
    const candidates = DAILY_ACTIVITY_POOL
      .filter((activity) => !selected.some((item) => item.action === activity.action))
      .filter((activity) => totalMinutes + activity.minutes <= DAILY_MISSION_TARGET_MINUTES.max)
      .filter((activity) => selected.filter((item) => item.category === activity.category).length < 2);

    if (!candidates.length) break;

    candidates.sort((a, b) =>
      scoreDailyActivity(b, selected, recentActions) - scoreDailyActivity(a, selected, recentActions)
    );
    const picked = candidates[0];
    selected.push(picked);
    totalMinutes += picked.minutes;
  }

  if (totalMinutes < DAILY_MISSION_TARGET_MINUTES.min) {
    const fillers = DAILY_ACTIVITY_POOL
      .filter((activity) => !selected.some((item) => item.action === activity.action))
      .sort((a, b) => scoreDailyActivity(b, selected, recentActions) - scoreDailyActivity(a, selected, recentActions));
    for (const filler of fillers) {
      if (totalMinutes + filler.minutes > DAILY_MISSION_TARGET_MINUTES.max) continue;
      selected.push(filler);
      totalMinutes += filler.minutes;
      if (totalMinutes >= DAILY_MISSION_TARGET_MINUTES.min) break;
    }
  }

  return {
    rounds: selected.map((activity, index) => ({
      label: activity.label,
      scene: activity.scene,
      action: activity.action,
      phase: index + 1,
      minutes: activity.minutes,
      category: activity.category,
      completed: false,
    })),
    estimatedMinutes: totalMinutes,
  };
}

function rememberDailyMissionPlan(plan) {
  const entry = {
    dateKey: localDateKey(),
    actions: plan.rounds.map((round) => round.action),
    estimatedMinutes: plan.estimatedMinutes,
  };
  const withoutToday = (state.dailyMissionHistory || []).filter((item) => item.dateKey !== entry.dateKey);
  state.dailyMissionHistory = [...withoutToday, entry].slice(-14);
}

function createTodayMissionPlan() {
  const balanced = createBalancedDailyRounds();
  const dateKey = localDateKey();
  return {
    title: "오늘의 미션",
    dateKey,
    rounds: balanced.rounds,
    estimatedMinutes: balanced.estimatedMinutes,
    generatedAt: new Date().toISOString(),
    current: 0,
    startedAt: Math.floor(state.time / 1000),
  };
}

function showActivityIntro(key) {
  const definition = ACTIVITY_DEFS[key];
  if (!definition || !ui.activityOverlay) return;

  state.activityFlow = { key, status: "intro" };
  ui.activityStage.textContent = "활동 준비";
  ui.activityTitle.textContent = definition.title;
  ui.activityDiscoveryImage?.classList.add("is-hidden");
  ui.activityPraiseSticker?.classList.add("is-hidden");
  ui.activityDescription.textContent = definition.description;
  ui.activityPrimary.textContent = "시작";
  ui.activityExit.textContent = "취소";
  ui.activityExit.hidden = false;
  ui.activityOverlay.classList.remove("is-hidden");
}

function launchActivity() {
  const flow = state.activityFlow;
  const definition = flow ? ACTIVITY_DEFS[flow.key] : null;
  if (!flow || flow.status !== "intro" || !definition) return;

  flow.status = "playing";
  ui.activityOverlay.classList.add("is-hidden");
  definition.start();
}

function finishActivity(key, description) {
  const definition = ACTIVITY_DEFS[key];
  if (!definition || !ui.activityOverlay) return;

  addDiaryIllustration(key);
  const sticker = choosePraiseSticker(key);
  state.latestPraiseSticker = sticker;
  state.activityFlow = { key, status: "complete" };
  ui.activityStage.textContent = "활동 완료";
  ui.activityTitle.textContent = `${definition.title} 완료!`;
  ui.activityDiscoveryImage?.classList.add("is-hidden");
  if (ui.activityPraiseSticker) {
    ui.activityPraiseSticker.src = ASSETS.praiseStickers[sticker];
    ui.activityPraiseSticker.classList.remove("is-hidden");
  }
  ui.activityDescription.textContent = `${description}\n${difficultySummaryText()}`;
  ui.activityPrimary.textContent = "닫기";
  ui.activityExit.hidden = true;
  ui.activityOverlay.classList.remove("is-hidden");
  saveGameProgress();
}

function choosePraiseSticker(activityKey) {
  const byActivity = {
    insects: ["explorer", "best"],
    streamCrayfish: ["explorer", "effort"],
    streamSkipping: ["explorer", "growth"],
    flyGame: ["effort", "greatJob"],
    chickenCoop: ["smart", "growth"],
    woodMission: ["smart", "effort"],
    plum: ["friend", "greatJob"],
    storeShopping: ["growth", "best"],
    storeGacha: ["best", "greatJob"],
  };
  return choose(byActivity[activityKey] || ["greatJob", "best", "effort", "growth", "praise"]);
}

const DIARY_ILLUSTRATION_DEFS = {
  chickenCoop: {
    id: "coopEggs",
    title: "닭장에서 달걀을 모았어요",
    caption: "닭들과 함께 달걀을 하나씩 세어 보았어요.",
    diaryText: "오늘 닭장에서 달걀을 하나씩 세었다. 닭들이 꼬꼬 하고 울어서 재미있었다.",
    image: () => ASSETS.diaryScenes.coopEggs,
  },
  flyGame: {
    id: "coopFly",
    title: "닭장에서 파리를 잡았어요",
    caption: "날아다니는 파리를 세며 손으로 잡았어요.",
    diaryText: "오늘 파리를 콕콕 잡았다. 빨랐지만 끝까지 세어서 뿌듯했다.",
    image: () => ASSETS.diaryScenes.coopFly,
  },
  insects: {
    id: "insectHunt",
    title: "뒷뜰에서 곤충을 만났어요",
    caption: "돋보기와 채집망으로 곤충을 관찰했어요.",
    diaryText: "오늘 뒷뜰에서 곤충을 찾았다. 나비가 날아가서 나도 따라 뛰었다.",
    image: () => ASSETS.diaryScenes.insectHunt,
  },
  woodMission: {
    id: "kitchenWood",
    title: "아궁이에 장작을 넣었어요",
    caption: "필요한 장작 수를 생각하며 불을 지폈어요.",
    diaryText: "오늘 장작을 답만큼 넣었다. 아궁이 불이 따뜻하게 보여서 좋았다.",
    image: () => ASSETS.diaryScenes.kitchenWood,
  },
  plum: {
    id: "kitchenPlum",
    title: "나연이와 자두를 씻었어요",
    caption: "자두를 세고 깨끗한 물에 함께 씻었어요.",
    diaryText: "오늘 나연이와 자두를 씻었다. 고양이가 가져가서 깜짝 놀랐다.",
    image: () => ASSETS.diaryScenes.kitchenPlum,
  },
  storeShopping: {
    id: "storeErrand",
    title: "할머니 심부름으로 슈퍼에 갔어요",
    caption: "필요한 물건을 골라 슈퍼 심부름을 했어요.",
    diaryText: "오늘 할머니 심부름으로 슈퍼에 갔다. 필요한 과자를 잘 골라서 기뻤다.",
    image: () => ASSETS.diaryScenes.storeErrand,
  },
  streamCrayfish: {
    id: "streamCrayfish",
    title: "개울가에서 가재를 찾았어요",
    caption: "돌을 살짝 들고 개울가 가재를 관찰했어요.",
    diaryText: "오늘 개울가 돌을 살짝 들었다. 가재를 찾아서 아주 신기했다.",
    image: () => ASSETS.diaryScenes.streamCrayfish,
  },
  streamSkipping: {
    id: "streamSkipping",
    title: "개울가에서 물수제비를 했어요",
    caption: "돌멩이가 통통 튄 횟수를 물결로 세어 보았어요.",
    diaryText: "오늘 개울가에서 물수제비를 했다. 돌이 통통 튀어서 물결을 세었다.",
    image: () => ASSETS.streamMap,
  },
};

function addDiaryIllustration(activityKey) {
  const definition = DIARY_ILLUSTRATION_DEFS[activityKey];
  if (!definition || state.diaryIllustrations[definition.id]) return;

  state.diaryIllustrations[definition.id] = {
    id: definition.id,
    title: definition.title,
    caption: definition.caption,
    diaryText: definition.diaryText,
    image: definition.image(),
  };

  if (!state.diaryHighlightLocked) {
    state.diaryHighlightKey = definition.id;
  }
  saveGameProgress();
}

function chooseDiaryHighlight() {
  const entries = Object.values(state.diaryIllustrations || {});
  if (!entries.length) {
    state.diaryHighlightKey = null;
    state.diaryHighlightLocked = false;
    return null;
  }
  if (state.diaryHighlightLocked && state.diaryHighlightKey && state.diaryIllustrations[state.diaryHighlightKey]) {
    return state.diaryIllustrations[state.diaryHighlightKey];
  }
  const pick = entries[Math.floor(Math.random() * entries.length)];
  state.diaryHighlightKey = pick.id;
  state.diaryHighlightLocked = true;
  saveGameProgress();
  return pick;
}

function currentDiaryHighlight() {
  const entries = state.diaryIllustrations || {};
  return entries[state.diaryHighlightKey] || Object.values(entries)[0] || null;
}

function clearCompletedActivityUi(key) {
  state.activeQuestion = null;
  renderAnswers([]);
  ui.questionPanel?.classList.remove("is-hint-stage", "is-concrete-stage", "has-number-pad");
  ui.questionPanel?.classList.add("is-hidden");

  if (["woodMission", "plum", "soban", "cat"].includes(key)) {
    resetKitchenMissions();
  }
  if (["chickenCoop", "flyGame"].includes(key)) {
    resetChickenCoopState();
  }
  if (["storeShopping", "storeGacha"].includes(key)) {
    resetStoreMission();
  }
  if (["streamCrayfish", "streamSkipping"].includes(key)) {
    resetStreamMission();
  }
  const idleTextByScene = {
    yard: "마당에서 다음에 할 활동을 골라요.",
    insects: "뒷뜰에서 곤충을 더 관찰하거나 다른 곳으로 이동해요.",
    coop: "닭장에서 다른 활동을 고르거나 이동해요.",
    wood: "부엌에서 다른 활동을 고르거나 이동해요.",
    diary: "그림일기에서 기록을 확인해요.",
    stream: "개울가를 둘러보고 다른 곳으로 이동해요.",
    store: "슈퍼를 둘러보고 다른 곳으로 이동해요.",
  };
  ui.feedback.textContent = "";
  ui.question.textContent = idleTextByScene[state.scene] || "다음 활동을 골라요.";
  renderCollection();
}

function closeActivityFlow() {
  const completedKey = state.activityFlow?.status === "complete" ? state.activityFlow.key : null;
  if (completedKey) clearCompletedActivityUi(completedKey);
  ui.activityOverlay?.classList.add("is-hidden");
  state.activityFlow = null;
}

function cancelActivityIntro() {
  if (state.activityFlow?.status !== "intro") return;
  ui.activityOverlay?.classList.add("is-hidden");
  state.activityFlow = null;
}

function startTodayMission() {
  if (state.todayMission?.rounds?.length) {
    const done = state.todayMission.rounds.filter((round) => round.completed).length;
    const list = state.todayMission.rounds.map((round, index) => `${index + 1}. ${round.label}`).join("  ");
    showStoryMission(`오늘 할 일은 이미 정해졌어. ${list}`, 5200);
    ui.question.textContent = todayMissionCompleted()
      ? "오늘 할 일을 모두 완료했어요."
      : `오늘미션 ${done}/${state.todayMission.rounds.length} 진행 중이에요.`;
    ui.feedback.textContent = todayMissionCompleted()
      ? "슈퍼에서 오늘 뽑기 보상권을 사용할 수 있어요."
      : "오늘 정해진 활동만 열려 있어요.";
    updateControlVisibility();
    return;
  }

  state.todayMission = createTodayMissionPlan();
  rememberDailyMissionPlan(state.todayMission);
  state.sessionPlan = createAdaptiveSessionPlan(state.learningProfile);
  const list = state.todayMission.rounds.map((round, index) => `${index + 1}. ${round.label}`).join("  ");
  showStoryMission(`동우야, 오늘 할 일은 이거야. 예상 ${state.todayMission.estimatedMinutes}분 정도 해보자. ${list}`, 7600);
  recordActivity({
    stamp: null,
    title: "오늘의 미션 시작",
    detail: `${state.todayMission.estimatedMinutes}분 · ${state.todayMission.rounds.map((round) => round.label).join(", ")}`,
    result: "-",
  });
  const first = state.todayMission.rounds[0];
  ui.question.textContent = `오늘미션이 열렸어요. 첫 활동은 ${first.label}이에요.`;
  ui.feedback.textContent = `오늘은 정해진 활동만 열려요. 예상 활동량은 약 ${state.todayMission.estimatedMinutes}분이에요.`;
  state.feedbackUntil = state.time + 3600;
  updateControlVisibility();
  saveGameProgress();
}

function completeTodayMission(actionKey) {
  if (!state.todayMission) return;
  const round = state.todayMission.rounds.find((item) => item.action === actionKey && !item.completed);
  if (!round) return;

  round.completed = true;
  const done = state.todayMission.rounds.filter((item) => item.completed).length;
  state.todayMission.current = done;

  if (done >= state.todayMission.rounds.length) {
    state.stars += 3;
    if (!state.gachaReward.used) {
      state.gachaReward = { earned: true, used: false, dateKey: localDateKey() };
    }
    showStoryMission("오늘 미션을 모두 해냈구나. 할머니가 뽑기 하라고 500원을 주셨어!", 5600);
    recordActivity({
      stamp: "mission",
      title: "오늘의 미션 완료",
      detail: `${state.todayMission.rounds.length}가지 · ${state.todayMission.estimatedMinutes || 20}분 활동 완료`,
      result: "O",
    });
    ui.question.textContent = "오늘 정해진 미션을 모두 완료했어요!";
    ui.feedback.textContent = state.gachaReward.used
      ? "별 3개를 받고 그림일기에 도장이 찍혔어요."
      : "별 3개와 뽑기 500원 보상권을 받았어요. 슈퍼에서 오늘 한 번 뽑을 수 있어요.";
    syncHud();
    updateControlVisibility();
    saveGameProgress();
    return;
  }

  const next = state.todayMission.rounds.find((item) => !item.completed);
  const directions = {
    insects: "원하면 뒷뜰 버튼을 눌러 이어갈 수 있어요.",
    coop: "원하면 닭장 버튼을 눌러 이어갈 수 있어요.",
    wood: "원하면 부엌 버튼을 눌러 이어갈 수 있어요.",
    store: "원하면 슈퍼 버튼을 눌러 이어갈 수 있어요.",
    yard: "원하면 마당에서 이어갈 수 있어요.",
    diary: "원하면 그림일기 버튼을 눌러 확인할 수 있어요.",
  };
  const direction = directions[next.scene] || "다음 활동으로 가자.";
  ui.question.textContent = `오늘미션 ${done}/${state.todayMission.rounds.length} 완료. 다음은 ${next.label}!`;
  ui.feedback.textContent = direction;
  showStoryMission(`잘했구나! 다음은 ${next.label}이야. ${direction}`, 3200);
  state.feedbackUntil = state.time + 3200;
  updateControlVisibility();
  saveGameProgress();
}

function showStoryMission(text, duration = 4200) {
  if (!ui.storyPanel || !ui.story) return;
  ui.story.textContent = text;
  ui.storyPanel.classList.remove("is-hidden");
  state.storyUntil = state.time + duration;
}

function hideStoryPanel() {
  ui.storyPanel?.classList.add("is-hidden");
  state.storyUntil = 0;
}

function createAdaptiveSessionPlan(profile) {
  const grade = clamp(profile.currentGrade || 1, 1, 4);
  const nextGrade = clamp(grade + 1, 1, 4);
  const blend = profile.readyForNext
    ? ADAPTIVE_LEVELING.blendStages[clamp(profile.blendStage || 1, 1, ADAPTIVE_LEVELING.blendStages.length - 1)]
    : ADAPTIVE_LEVELING.blendStages[0];
  const currentActivities = ADAPTIVE_LEVELING.gradeMap[grade].activities;
  const previewActivities = ADAPTIVE_LEVELING.gradeMap[nextGrade].activities;
  const rounds = [];

  for (let index = 0; index < blend.current; index++) {
    rounds.push({
      round: rounds.length + 1,
      grade,
      difficulty: `grade_${grade}`,
      type: currentActivities[index % currentActivities.length],
    });
  }

  for (let index = 0; index < blend.preview; index++) {
    rounds.push({
      round: rounds.length + 1,
      grade: nextGrade,
      difficulty: `grade_${nextGrade}_preview`,
      type: previewActivities[index % previewActivities.length],
    });
  }

  return {
    totalRounds: rounds.length,
    currentGrade: grade,
    nextGrade,
    blendRatio: {
      currentGradeRounds: blend.current,
      previewGradeRounds: blend.preview,
    },
    roundQueue: rounds,
  };
}

function recordActivity(entry) {
  const record = {
    time: Math.floor(state.time / 1000),
    ...entry,
  };

  state.activityLog.unshift(record);
  state.activityLog = state.activityLog.slice(0, 8);

  if (entry.stamp && state.diaryStamps[entry.stamp] !== undefined) {
    state.diaryStamps[entry.stamp] += 1;
  }
  saveGameProgress();
}

function chooseTodayInsectLineup(limit = QUEST_TARGET) {
  const commonPool = INSECT_ORDER.filter((type) => !state.dailyCaught[type]);
  const fallbackPool = INSECT_ORDER.filter((type) => !state.collected[type]);
  const pool = commonPool.length ? commonPool : (fallbackPool.length ? fallbackPool : [...INSECT_ORDER]);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const lineup = shuffled.slice(0, limit);

  UNIQUE_INSECT_ORDER.forEach((type) => {
    if (state.dailyCaught[type] || Math.random() >= UNIQUE_SPAWN_CHANCE) return;
    if (lineup.length < limit) {
      lineup.push(type);
    } else if (!lineup.includes(type)) {
      lineup[lineup.length - 1] = type;
    }
  });

  while (lineup.length < limit) {
    const candidate = choose(INSECT_ORDER);
    if (!lineup.includes(candidate) || lineup.length >= INSECT_ORDER.length) lineup.push(candidate);
  }

  return lineup.slice(0, limit);
}

function resetButterflies() {
  const remainingToday = Math.max(0, QUEST_TARGET - state.quests);
  const lineup = remainingToday > 0 ? chooseTodayInsectLineup(remainingToday) : [];
  const nextInsects = [];
  lineup.forEach((type, index) => {
    const config = INSECT_CONFIG[type];
    const zones = config.movement === "fly" ? airSpawnZones : groundSpawnZones;
    const zone = zones[index % zones.length];
    const spot = findInsectSpawnSpot(zone, config.width, nextInsects);
    nextInsects.push({
      id: index,
      type,
      x: spot.x,
      y: spot.y,
      vx: randomSignedVelocity(0.28, 0.72) * config.speed,
      vy: config.movement === "fly" ? randomSignedVelocity(0.16, 0.46) * config.speed : 0,
      zone,
      frameOffset: Math.floor(randomBetween(0, ASSETS[type].length)),
      phase: randomBetween(0, Math.PI * 2),
      turnAt: randomBetween(550, 1700),
      hopAt: randomBetween(420, 980),
      hopPower: 0,
      caught: false,
    });
  });
  state.butterflies = nextInsects;
}

function resetInsectSessionProgress() {
  state.quests = 0;
  state.dailyCaught = {};
  state.activeQuestion = null;
  state.collectionCompleteToastUntil = 0;
  resetButterflies();
  syncHud();
  saveGameProgress();
}

function resetWoodMission() {
  const spots = [
    [190, 528],
    [318, 572],
    [430, 552],
    [545, 584],
    [675, 554],
    [930, 538],
    [1030, 570],
    [1135, 528],
  ];
  const level = chooseActivityGrade("wood_mission");
  const grade = level.grade;
  let mode;
  let target;
  let initialValue = 0;
  let equationText;
  let instruction;

  if (grade === 1) {
    mode = "count_answer";
    target = nextRandomInt("woodCountAnswer", 2, 4);
    equationText = `장작 ${target}개`;
    instruction = `장작을 ${target}개만 아궁이에 넣고 확인을 눌러보세요.`;
  } else if (grade === 2) {
    mode = "addition_answer";
    const first = nextRandomInt("woodAddFirst", 1, 3);
    const second = nextRandomInt("woodAddSecond", 1, 4);
    target = first + second;
    equationText = `${first} + ${second} = ?`;
    instruction = `${equationText} 답만큼 장작을 넣고 확인을 눌러보세요.`;
  } else if (grade === 3) {
    mode = "subtraction_answer";
    const total = nextRandomInt("woodSubtractTotal", 5, 8);
    const takeAway = nextRandomInt("woodSubtractAway", 1, Math.max(1, total - 2));
    target = total - takeAway;
    equationText = `${total} - ${takeAway} = ?`;
    instruction = `${equationText} 답만큼 장작을 넣고 확인을 눌러보세요.`;
  } else {
    mode = "mixed_answer";
    const first = nextRandomInt("woodMixedFirst", 3, 5);
    const second = nextRandomInt("woodMixedSecond", 2, 4);
    const takeAway = nextRandomInt("woodMixedAway", 1, Math.min(3, first + second - 2));
    target = first + second - takeAway;
    equationText = `${first} + ${second} - ${takeAway} = ?`;
    instruction = `${equationText} 답만큼 장작을 넣고 확인을 눌러보세요.`;
  }

  const specs = Array.from({ length: 8 }, (_, index) => ({
    kind: index % 3 === 0 ? "kindling" : index % 2 === 0 ? "rough" : "smooth",
    value: 1,
    accepted: true,
  }));

  state.woodMission = {
    grade,
    isPreview: level.isPreview,
    mode,
    type: `grade_${grade}_${mode}`,
    interactionMode: "select_count_then_confirm",
    learningGoal: grade === 1 ? "cardinality"
      : grade === 2 ? "addition_result_modeling"
      : grade === 3 ? "subtraction_result_modeling"
      : "mixed_operation_modeling",
    target,
    equationText,
    initialValue,
    placed: initialValue,
    acceptedCount: 0,
    errorCount: 0,
    usedHint: false,
    instruction,
    startedAtMs: performance.now(),
    completed: false,
    pieces: specs.map((spec, index) => ({
      id: index,
      kind: spec.kind,
      value: spec.value,
      accepted: spec.accepted !== false,
      sprite: spec.kind === "kindling" ? ASSETS.woodFire.kindling
        : spec.kind === "rough" ? ASSETS.woodFire.logRough
        : ASSETS.woodFire.logSmooth,
      lengthScale: spec.kind === "kindling" ? 0.92 : 1,
      bundle: spec.kind === "kindling",
      homeX: spots[index][0],
      homeY: spots[index][1],
      x: spots[index][0],
      y: spots[index][1],
      targetX: spots[index][0],
      targetY: spots[index][1],
      angle: randomBetween(-0.45, 0.45),
      placed: false,
      heavy: 0.16 + index * 0.018,
      offsetX: 0,
      offsetY: 0,
    })),
  };
  state.draggingWoodId = null;
}

function startWoodMission() {
  if (state.scene !== "wood") {
    setScene("wood");
    return;
  }

  activateKitchenMission("wood");
  resetWoodMission();
  state.woodMissionActive = true;
  ui.mode.textContent = "장작 넣기";
  ui.question.textContent = state.woodMission.instruction;
  ui.feedback.textContent = "필요한 수만큼만 넣은 뒤 활동판의 확인을 눌러보세요.";
}

function woodPanelButtonZones() {
  const y = sideMissionPanelY();
  return {
    remove: { x: 52, y: y + 112, w: 126, h: 40 },
    confirm: { x: 194, y: y + 112, w: 142, h: 40 },
  };
}

function removeLastWoodPiece() {
  const mission = state.woodMission;
  if (!mission || mission.completed) return;
  const piece = [...mission.pieces].reverse().find((item) => item.placed);
  if (!piece) {
    ui.feedback.textContent = "아직 아궁이에 넣은 장작이 없어요.";
    return;
  }
  piece.placed = false;
  piece.x = piece.homeX;
  piece.y = piece.homeY;
  piece.targetX = piece.homeX;
  piece.targetY = piece.homeY;
  mission.placed = Math.max(0, mission.placed - 1);
  mission.acceptedCount = Math.max(0, mission.acceptedCount - 1);
  ui.feedback.textContent = `장작 하나를 뺐어요. 지금 ${mission.placed}개예요.`;
}

function completeWoodMission() {
  const mission = state.woodMission;
  if (!mission || mission.completed) return;
  mission.completed = true;
  state.stars += 2;
  recordActivityOutcome(mission, "wood_mission");
  recordActivity({
    stamp: "embodied",
    title: "장작 수식 미션 완료",
    detail: `${mission.equationText} 정답 ${mission.target}개`,
    result: "O",
  });
  completeTodayMission("woodMission");
  ui.question.textContent = `${mission.equationText} 정답은 ${mission.target}개예요!`;
  ui.feedback.textContent = "필요한 장작 수를 정확히 넣었어요. 별 2개를 받았어요.";
  syncHud();
  finishActivity("woodMission", `${mission.equationText} 정답에 맞게 장작 ${mission.target}개를 넣었어요.`);
}

function checkWoodAnswer() {
  const mission = state.woodMission;
  if (!mission || mission.completed) return;
  const correct = mission.placed === mission.target;
  recordActivityInteraction(mission, "wood_mission", correct, correct ? null : "wrong_quantity");
  if (correct) {
    showAnswerReveal(mission.target);
    completeWoodMission();
    return;
  }
  mission.errorCount += 1;
  if (mission.errorCount >= 2) {
    showAnswerReveal(mission.target);
    mission.completed = true;
    recordActivity({
      stamp: null,
      title: "장작 수식 정답 확인",
      detail: `${mission.equationText} 정답 ${mission.target}개`,
      result: "X",
    });
    setQuestion(`틀렸어요. 정답은 ${mission.target}개예요.`, "wrong");
    setFeedback(`${mission.equationText}의 답은 ${mission.target}개예요. 장작을 함께 확인하고 넘어가요.`);
    finishActivity("woodMission", `틀렸어요. 정답은 장작 ${mission.target}개예요. ${mission.equationText}를 함께 확인했어요.`);
    return;
  }
  ui.feedback.textContent = mission.placed < mission.target
    ? `아쉬워요. 한 번 더 해봐요. 지금 ${mission.placed}개이니 조금 더 넣어보세요.`
    : `아쉬워요. 한 번 더 해봐요. 지금 ${mission.placed}개이니 하나 빼기를 눌러보세요.`;
  state.feedbackUntil = state.time + 2200;
}

function resetPlumMission() {
  const spots = [
    [118, 520],
    [190, 566],
    [420, 590],
    [555, 548],
    [690, 590],
    [960, 532],
    [1082, 536],
    [1170, 574],
  ];
  const basinSpots = [
    [704, 442],
    [766, 420],
    [828, 448],
    [742, 478],
    [808, 480],
    [856, 424],
    [884, 470],
    [680, 474],
  ];
  const level = chooseActivityGrade("plum_wash");
  const grade = level.grade;
  let mode;
  let target;
  let initialValue = 0;
  let specs;
  let instruction;

  if (grade === 1) {
    target = nextRandomInt("plumCatTotal1", 4, 5);
  } else if (grade === 2) {
    target = nextRandomInt("plumCatTotal2", 5, 6);
  } else if (grade === 3) {
    target = nextRandomInt("plumCatTotal3", 6, 7);
  } else {
    target = 8;
  }
  mode = "cat_surprise";
  const stolen = grade === 1 ? 1 : nextRandomInt(`plumCatStolen${grade}`, 1, Math.min(3, target - 2));
  const answer = target - stolen;
  specs = Array.from({ length: target }, (_, index) => ({
    kind: index % 2 === 0 ? "large" : "small",
    value: 1,
    accepted: true,
  }));
  instruction = `자두 ${target}개를 하나씩 세어 대야에 씻어주세요.`;

  state.plumMission = {
    grade,
    isPreview: level.isPreview,
    mode,
    type: `grade_${grade}_${mode}`,
    interactionMode: "count_then_surprise_subtraction",
    learningGoal: "subtraction_after_quantity_change",
    target,
    stolen,
    answer,
    phase: "collect",
    catAt: 0,
    questionReady: false,
    answered: false,
    initialValue,
    placed: initialValue,
    acceptedCount: 0,
    errorCount: 0,
    usedHint: false,
    instruction,
    startedAtMs: performance.now(),
    completed: false,
    ripples: [],
    plums: specs.map((spec, index) => ({
      id: index,
      kind: spec.kind,
      value: spec.value,
      accepted: spec.accepted,
      scale: spec.kind === "large" ? 1.04 : 0.92,
      x: spots[index][0],
      y: spots[index][1],
      targetX: spots[index][0],
      targetY: spots[index][1],
      homeX: spots[index][0],
      homeY: spots[index][1],
      basinX: basinSpots[Math.min(basinSpots.length - 1, index + initialValue)][0],
      basinY: basinSpots[Math.min(basinSpots.length - 1, index + initialValue)][1],
      angle: randomBetween(-0.25, 0.25),
      placed: false,
      stolen: false,
      sprite: index % 2 === 0 ? ASSETS.plumWash.plumA : ASSETS.plumWash.plumB,
      offsetX: 0,
      offsetY: 0,
    })),
  };
  state.draggingPlumId = null;
}

function startPlumMission() {
  if (state.scene !== "wood") {
    setScene("wood");
    return;
  }

  activateKitchenMission("plum");
  resetPlumMission();
  state.plumMissionActive = true;
  ui.mode.textContent = "자두 씻기";
  ui.question.textContent = state.plumMission.instruction;
  ui.feedback.textContent = "자두를 하나씩 씻으며 지금 몇 개인지 세어보세요.";
}

function makePlumCatQuestion(mission) {
  return {
    kind: "plum-cat-subtraction",
    grade: mission.grade,
    isPreview: mission.isPreview,
    text: `자두 ${mission.target}개 중 고양이가 ${mission.stolen}개를 가져갔어요. 몇 개가 남았을까요?`,
    answer: mission.answer,
    operands: [mission.target, mission.stolen],
    visual: { mode: "plum-cat", total: mission.target, stolen: mission.stolen },
    startedAtMs: mission.startedAtMs,
  };
}

function resetSobanMission() {
  const bowlSpots = [
    [218, 560],
    [310, 535],
    [410, 575],
    [510, 540],
    [590, 570],
  ];
  const spoonSpots = [
    [945, 510],
    [1025, 472],
    [1098, 520],
    [1165, 475],
    [1218, 545],
  ];
  const bowlTargets = [
    [724, 440],
    [802, 420],
    [872, 448],
    [770, 486],
  ];
  const spoonTargets = [
    [710, 392],
    [848, 392],
    [834, 500],
    [914, 468],
  ];
  const level = chooseActivityGrade("soban_setting");
  const grade = level.grade;
  const familyCount = grade === 1
    ? nextRandomInt("sobanFamilyCount", 2, 3)
    : nextRandomInt("sobanFamilyCount", 3, 4);
  const initialBowls = grade === 1 ? 0 : grade === 2 ? 1 : nextRandomInt("sobanInitialBowls", 0, 2);
  const initialSpoons = grade <= 2 ? initialBowls : nextRandomInt("sobanInitialSpoons", 0, 2);
  const extraCount = grade >= 3 ? 1 : 0;
  const supplyCount = familyCount + extraCount;

  const bowls = bowlSpots.slice(0, supplyCount).map(([x, y], index) => ({
    id: `bowl-${index}`,
    kind: "bowl",
    x,
    y,
    targetX: x,
    targetY: y,
    homeX: x,
    homeY: y,
    slotX: bowlTargets[Math.min(index, familyCount - 1)][0],
    slotY: bowlTargets[Math.min(index, familyCount - 1)][1],
    angle: randomBetween(-0.18, 0.18),
    placed: index < initialBowls,
    guideSlot: index < familyCount,
    offsetX: 0,
    offsetY: 0,
  }));
  const spoons = spoonSpots.slice(0, supplyCount).map(([x, y], index) => ({
    id: `spoon-${index}`,
    kind: "spoon",
    x,
    y,
    targetX: x,
    targetY: y,
    homeX: x,
    homeY: y,
    slotX: spoonTargets[Math.min(index, familyCount - 1)][0],
    slotY: spoonTargets[Math.min(index, familyCount - 1)][1],
    angle: randomBetween(-0.45, 0.45),
    placed: index < initialSpoons,
    guideSlot: index < familyCount,
    offsetX: 0,
    offsetY: 0,
  }));

  [...bowls, ...spoons].forEach((item) => {
    if (!item.placed) return;
    item.x = item.slotX;
    item.y = item.slotY;
    item.targetX = item.slotX;
    item.targetY = item.slotY;
  });

  const mode = grade === 1 ? "one_to_one"
    : grade === 2 ? "missing_pair"
    : grade === 3 ? "select_exact"
    : "mixed_missing";
  state.sobanMission = {
    grade,
    isPreview: level.isPreview,
    mode,
    type: `grade_${grade}_${mode}`,
    interactionMode: "pair_setting",
    learningGoal: grade === 1 ? "one_to_one_correspondence"
      : grade === 2 ? "missing_pair"
      : "exact_selection_and_inhibition",
    startedAtMs: performance.now(),
    errorCount: 0,
    usedHint: false,
    familyCount,
    targetBowls: familyCount,
    targetSpoons: familyCount,
    targetSlots: {
      bowl: bowlTargets.slice(0, familyCount),
      spoon: spoonTargets.slice(0, familyCount),
    },
    bowlsPlaced: initialBowls,
    spoonsPlaced: initialSpoons,
    completed: false,
    taps: [],
    items: [...bowls, ...spoons],
  };
  state.draggingSobanId = null;
}

function startSobanMission() {
  if (state.scene !== "wood") {
    setScene("wood");
    return;
  }

  activateKitchenMission("soban");
  resetSobanMission();
  state.sobanMissionActive = true;
  // Keep Dongwoo outside the loose bowls on the left and spoons on the right.
  state.dongwoo.x = 106;
  state.dongwoo.y = 610;
  state.dongwoo.scale = 0.38;
  state.dongwoo.facing = 1;
  const mission = state.sobanMission;
  const missingBowls = mission.targetBowls - mission.bowlsPlaced;
  const missingSpoons = mission.targetSpoons - mission.spoonsPlaced;
  ui.mode.textContent = "소반 차리기";
  ui.question.textContent = mission.grade === 1
    ? `가족 ${mission.familyCount}명에게 밥그릇과 숟가락을 하나씩 놓아주세요.`
    : `가족 ${mission.familyCount}명 식탁이에요. 빈자리에는 그릇 ${missingBowls}개, 숟가락 ${missingSpoons}개가 더 필요해요.`;
  ui.feedback.textContent = mission.grade >= 3
    ? "남는 식기가 있어요. 필요한 수만 정확히 골라 놓으세요."
    : "그릇과 숟가락을 하나씩 맞춰 놓아보세요.";
}

function resetCatSnackMission() {
  const level = chooseActivityGrade("cat_subtraction");
  const grade = level.grade;
  const total = grade === 1
    ? 3
    : grade === 2
    ? nextRandomInt("catGrade2Pieces", 3, 4)
    : nextRandomInt("catGrade3Pieces", 4, 5);
  const eatenTarget = grade === 1
    ? nextRandomInt("catGrade1Pieces", 1, 2)
    : grade === 2
    ? nextRandomInt("catGrade2EatPieces", 1, total - 1)
    : nextRandomInt("catGrade3EatPieces", 2, total - 1);
  const catEventRoll = nextRandomInt("catWatermelonEvent", 0, 99);
  const hasCatEvent = grade >= 2 && catEventRoll < (grade >= 3 ? 70 : 45);
  const catStolen = hasCatEvent
    ? Math.min(total - eatenTarget, grade >= 4 ? nextRandomInt("catGrade4StealPieces", 1, 2) : 1)
    : 0;
  const stolen = eatenTarget + catStolen;
  const parts = catStolen ? [eatenTarget, catStolen] : [eatenTarget];
  const mode = catStolen ? "pieces_then_cat" : "piece_subtraction";

  const signature = `${grade}-${total}-${stolen}-${parts.join("-")}`;
  state.problemHistory.catSubtraction = signature;
  const answer = total - stolen;
  const distractors = [answer, clamp(answer - 1, 0, 20), clamp(answer + 1, 0, 20), clamp(answer + 2, 0, 20)];
  const options = [...new Set(distractors)].slice(0, 3).sort(() => Math.random() - 0.5);

  state.catSnackMission = {
    grade,
    isPreview: level.isPreview,
    mode,
    type: `grade_${grade}_${mode}`,
    total,
    stolen,
    parts,
    pieces: Array.from({ length: total }, (_, index) => ({
      id: index,
      stage: 0,
      eaten: false,
      stolen: false,
    })),
    eaten: 0,
    eatenTarget,
    catStolen,
    answer,
    options,
    phase: "eating",
    startTime: state.time,
    catAt: 0,
    startedAtMs: performance.now(),
    errorCount: 0,
    questionReady: false,
    answered: false,
  };
}

function makeCatSnackQuestion(mission) {
  let text = `수박 ${mission.total}조각 중 동우가 ${mission.eatenTarget}조각을 다 먹었어요. 남은 수박 조각은 몇 개일까요?`;
  if (mission.catStolen > 0) {
    text = `수박 ${mission.total}조각 중 동우가 ${mission.eatenTarget}조각을 먹고, 고양이가 ${mission.catStolen}조각을 가져갔어요. 남은 수박 조각은 몇 개일까요?`;
  }
  return {
    kind: "cat-snack-subtraction",
    grade: mission.grade,
    isPreview: mission.isPreview,
    text,
    answer: mission.answer,
    options: mission.options,
    visual: { mode: "cat-snack", equationMode: mission.mode },
    startedAtMs: mission.startedAtMs,
  };
}

function startCatSnackMission() {
  if (state.scene !== "yard") {
    setScene("yard");
  }

  resetKitchenMissions();
  resetChickenCoopState();
  state.storeGachaMission = null;
  state.storeGachaActive = false;
  state.activeQuestion = null;
  renderAnswers([]);
  ui.questionPanel?.classList.add("is-hidden");
  resetCatSnackMission();
  state.catSnackMissionActive = true;
  ui.mode.textContent = "수박 먹기";
  ui.question.textContent = `${state.catSnackMission.grade}단계 · 수박 ${state.catSnackMission.total}조각이 있어요. 조각을 눌러 한입씩 먹어보세요.`;
  ui.feedback.textContent = `수박 조각을 누르면 한입씩 줄어요. ${state.catSnackMission.eatenTarget}조각을 다 먹으면 문제가 나와요.`;
}

function makeStoreSnackOptions(grade) {
  const shuffledSnacks = [...STORE_SNACKS].sort(() => Math.random() - 0.5).slice(0, 4);
  const pricePools = {
    1: [200, 300, 400, 500],
    2: [500, 600, 700, 800],
    3: [900, 1000, 1200, 1500],
    4: [1200, 1500, 1700, 2000],
  };
  const prices = [...(pricePools[grade] || pricePools[1])].sort(() => Math.random() - 0.5);
  return shuffledSnacks.map((snack, index) => ({
    ...snack,
    price: prices[index] || prices[0],
  }));
}

function resetStoreShoppingMission() {
  const level = chooseActivityGrade("store_shopping");
  const grade = level.grade;
  const options = makeStoreSnackOptions(grade);
  const target = choose(options);
  const moneyOptions = grade <= 2
    ? STORE_MONEY.filter((money) => money.value <= 500)
    : STORE_MONEY.filter((money) => money.value <= 1000);

  state.draggingStoreMoney = null;
  state.storeMission = {
    grade,
    isPreview: level.isPreview,
    type: `grade_${grade}_store_shopping`,
    interactionMode: "select_item_and_pay",
    learningGoal: grade <= 1 ? "money_counting_100_units"
      : grade === 2 ? "coin_combination"
      : grade === 3 ? "coin_bill_combination"
      : "multi_step_money_composition",
    options,
    target,
    moneyOptions,
    selectedSnackId: null,
    paid: 0,
    paidItems: [],
    phase: "choose",
    wrongAttempts: 0,
    errorCount: 0,
    startedAtMs: performance.now(),
    completed: false,
    notice: "부탁받은 과자를 먼저 골라요.",
    noticeTone: "normal",
    snackZones: [],
    moneyZones: [],
  };
}

function startStoreShoppingMission() {
  if (state.scene !== "store") {
    setScene("store");
  }

  resetKitchenMissions();
  resetChickenCoopState();
  state.activeQuestion = null;
  renderAnswers([]);
  ui.questionPanel?.classList.add("is-hidden");
  resetStoreShoppingMission();
  state.storeMissionActive = true;
  ui.mode.textContent = "슈퍼 심부름";
  ui.question.textContent = `할머니가 ${state.storeMission.target.label}을 부탁했어요.`;
  ui.feedback.textContent = `먼저 ${state.storeMission.target.label}을 고른 다음, 돈을 끌어서 ${state.storeMission.target.price}원을 맞춰 내요.`;
}

function finishStoreShoppingMission(successText) {
  const mission = state.storeMission;
  if (!mission || mission.completed) return;
  mission.completed = true;
  recordActivityOutcome(mission, "store_shopping");
  completeTodayMission("storeShopping");
  state.stars += 1;
  syncHud();
  saveGameProgress();
  showAnswerReveal(mission.target.price);
  finishActivity("storeShopping", successText);
}

const STORE_PAY_DROP_ZONE = { x: 932, y: 464, w: 220, h: 82 };

function storeMoneyDrawRect(money, point) {
  const isBill = money?.shape === "bill";
  return {
    x: point.x - (isBill ? 104 : 48),
    y: point.y - (isBill ? 42 : 48),
    w: isBill ? 208 : 96,
    h: isBill ? 84 : 96,
  };
}

function addStorePayment(mission, money) {
  mission.paid += money.value;
  mission.paidItems.push(money);
  mission.notice = `지금 ${mission.paid}원을 냈어요.`;
  mission.noticeTone = mission.paid > mission.target.price ? "wrong" : "normal";
  recordActivityInteraction(mission, "store_shopping", true);
  ui.question.textContent = `${mission.target.label} 값은 ${mission.target.price}원. 지금 ${mission.paid}원을 냈어요.`;
  ui.feedback.textContent = mission.paid === mission.target.price
    ? "금액이 딱 맞아요. 확인을 눌러보세요."
    : mission.paid > mission.target.price
    ? "조금 많이 냈어요. 하나 빼기를 누르거나 다시 생각해봐요."
    : "더 내야 해요. 돈을 더 끌어다 놓아보세요.";
  state.feedbackUntil = state.time + 1200;
}

function makeGachaOptions(answer) {
  if (answer === 0) {
    return [0, 100, 200, 300].sort(() => Math.random() - 0.5);
  }
  const set = new Set([answer]);
  while (set.size < 4) {
    const delta = choose([-200, -100, -1, 1, 100, 200]);
    const candidate = Math.max(0, answer + delta);
    if (answer >= 100 ? candidate % 100 === 0 : candidate <= 6) set.add(candidate);
  }
  return [...set].sort(() => Math.random() - 0.5);
}

function chooseGachaRewardFigure() {
  const hasMissing = GACHA_FIGURES.some((figure) => !state.figureCollection[figure.id]);
  const weighted = [];
  GACHA_FIGURES.forEach((figure) => {
    const alreadyOwned = Boolean(state.figureCollection[figure.id]);
    const weight = hasMissing
      ? (alreadyOwned ? 1 : 4)
      : 1;
    for (let index = 0; index < weight; index += 1) {
      weighted.push(figure);
    }
  });
  return choose(weighted.length ? weighted : GACHA_FIGURES);
}

function canUseTodayGacha() {
  return Boolean(state.gachaReward?.earned) && !state.gachaReward?.used && state.gachaReward?.dateKey === localDateKey();
}

function explainGachaUnavailable() {
  if (state.gachaReward?.used && state.gachaReward?.dateKey === localDateKey()) {
    return "오늘 뽑기는 이미 했어요. 내일 오늘미션을 끝내면 다시 할 수 있어요.";
  }
  return "뽑기는 오늘 할 일을 모두 끝내고 할머니에게 500원을 받은 뒤 하루에 한 번만 할 수 있어요.";
}

function resetStoreGachaMission() {
  const level = chooseActivityGrade("store_gacha");
  const grade = level.grade;
  const pulls = 5;
  const totalMoney = 500;
  const questionMode = grade <= 1 ? "coin_count" : grade === 2 ? "total_value" : "change";
  const answer = questionMode === "coin_count" ? pulls
    : questionMode === "total_value" ? totalMoney
    : 0;

  state.storeGachaMission = {
    grade,
    isPreview: level.isPreview,
    type: `grade_${grade}_store_gacha`,
    interactionMode: "coin_insert_then_answer",
    learningGoal: questionMode === "change" ? "hundreds_subtraction_money_change"
      : questionMode === "total_value" ? "hundreds_coin_total_value"
      : "one_to_one_coin_counting",
    pulls,
    totalMoney,
    inserted: 0,
    capsules: 0,
    phase: "insert",
    coin: {
      x: GACHA_COIN_HOME.x,
      y: GACHA_COIN_HOME.y,
      homeX: GACHA_COIN_HOME.x,
      homeY: GACHA_COIN_HOME.y,
      offsetX: 0,
      offsetY: 0,
    },
    questionMode,
    answer,
    options: makeGachaOptions(answer),
    rewardFigure: chooseGachaRewardFigure(),
    rewardIsNew: false,
    wrongAttempts: 0,
    errorCount: 0,
    startedAtMs: performance.now(),
    completed: false,
    notice: "할머니가 준 500원으로 오늘 한 번 뽑아보세요. 100원 동전 5개를 넣어요.",
    noticeTone: "normal",
  };
}

function startStoreGachaMission() {
  if (!canUseTodayGacha()) {
    if (state.scene !== "store") setScene("store");
    ui.mode.textContent = "슈퍼 뽑기";
    ui.question.textContent = "아직 뽑기를 할 수 없어요.";
    ui.feedback.textContent = explainGachaUnavailable();
    showStoryMission(explainGachaUnavailable(), 3600);
    return;
  }

  if (state.scene !== "store") {
    setScene("store");
  }

  resetKitchenMissions();
  resetChickenCoopState();
  state.storeMission = null;
  state.storeMissionActive = false;
  state.activeQuestion = null;
  renderAnswers([]);
  ui.questionPanel?.classList.add("is-hidden");
  resetStoreGachaMission();
  state.storeGachaActive = true;
  state.draggingGachaCoin = false;
  ui.mode.textContent = "슈퍼 뽑기";
  ui.question.textContent = "할머니가 준 500원으로 오늘 한 번 뽑기를 해요.";
  ui.feedback.textContent = state.storeGachaMission.notice;
}

function finishStoreGachaMission(successText) {
  const mission = state.storeGachaMission;
  if (!mission || mission.completed) return;
  mission.completed = true;
  state.gachaReward = { earned: false, used: true, dateKey: localDateKey() };
  mission.rewardIsNew = !state.figureCollection[mission.rewardFigure.id];
  state.figureCollection[mission.rewardFigure.id] = true;
  recordActivityOutcome(mission, "store_gacha");
  completeTodayMission("storeGacha");
  state.stars += 1;
  syncHud();
  saveGameProgress();
  showAnswerReveal(mission.answer);
  const rewardText = mission.rewardIsNew
    ? `새 피규어 '${mission.rewardFigure.label}'도 그림일기에 붙였어요.`
    : `'${mission.rewardFigure.label}' 피규어가 한 번 더 나왔어요.`;
  finishActivity("storeGacha", `${successText} ${rewardText}`);
}

const STREAM_CRAYFISH_SPAWN_CHANCE = 0.25;
const STREAM_CRAYFISH_PITY_TAPS = 4;
const STREAM_CRAYFISH_WATER_RECT = { x: 132, y: 118, w: 1016, h: 500 };

function streamCrayfishRockRects() {
  return [
    { x: 360, y: 300, w: 170, h: 82, angle: -0.12 },
    { x: 586, y: 258, w: 188, h: 92, angle: 0.08 },
    { x: 742, y: 408, w: 174, h: 84, angle: -0.04 },
    { x: 486, y: 454, w: 154, h: 72, angle: 0.14 },
  ];
}

function makeStreamCrayfishQuestion(mission) {
  const grade = mission.grade;
  let a = nextRandomInt("stream_crayfish_a", 2, grade <= 1 ? 5 : 8);
  let b = nextRandomInt("stream_crayfish_b", 1, grade <= 2 ? 4 : 7);
  let answer = a + b;
  let text = `바위 아래 가재가 ${a}마리, 물풀 옆 가재가 ${b}마리 있어요. 모두 몇 마리일까요?`;
  let kind = "stream-crayfish-addition";

  if (grade >= 3 && Math.random() < 0.45) {
    const total = nextRandomInt("stream_crayfish_total", 5, 10);
    const hidden = nextRandomInt("stream_crayfish_hidden", 1, Math.min(4, total - 1));
    a = total;
    b = hidden;
    answer = total - hidden;
    text = `가재 ${total}마리 중 ${hidden}마리가 바위 밑으로 숨었어요. 보이는 가재는 몇 마리일까요?`;
    kind = "stream-crayfish-subtraction";
  }

  return {
    kind,
    grade,
    isPreview: mission.isPreview,
    text,
    answer,
    operands: [a, b],
    visual: { mode: "stream-crayfish", total: a, found: b },
    gameType: "stream_crayfish",
    affectsMastery: true,
  };
}

function resetStreamCrayfishMission() {
  const level = chooseActivityGrade("stream_crayfish");
  const rocks = streamCrayfishRockRects().map((rock, index) => ({
    ...rock,
    id: index,
    searched: false,
    wiggleUntil: 0,
  }));

  state.streamCrayfishMission = {
    grade: level.grade,
    isPreview: level.isPreview,
    type: `grade_${level.grade}_stream_crayfish`,
    interactionMode: "rock_search_then_number_pad",
    learningGoal: level.grade >= 3 ? "situational_subtraction_after_discovery" : "situational_addition_after_discovery",
    phase: "search",
    rocks,
    searchCount: 0,
    foundRockId: null,
    question: null,
    completed: false,
    startedAtMs: performance.now(),
    errorCount: 0,
    notice: "물속 바위를 눌러 가재가 숨어 있는지 살펴보세요.",
    noticeTone: "normal",
  };
}

function startStreamCrayfishMission() {
  if (state.scene !== "stream") {
    setScene("stream");
  }

  resetKitchenMissions();
  resetChickenCoopState();
  resetStoreMission();
  state.activeQuestion = null;
  renderAnswers([]);
  ui.questionPanel?.classList.add("is-hidden");
  resetStreamCrayfishMission();
  state.streamCrayfishActive = true;
  state.streamSkippingMission = null;
  state.streamSkippingActive = false;
  ui.mode.textContent = "개울가 가재잡기";
  ui.question.textContent = "물속 바위를 하나씩 눌러보세요.";
  ui.feedback.textContent = state.streamCrayfishMission.notice;
}

function finishStreamCrayfishMission(isCorrect) {
  const mission = state.streamCrayfishMission;
  if (!mission || mission.completed) return;
  mission.completed = true;
  state.streamCrayfishActive = false;
  state.collected.crayfish = true;
  state.dailyCaught.crayfish = true;
  state.bugs += 1;
  state.stars += isCorrect ? 2 : 1;
  recordActivityOutcome(mission, "stream_crayfish");
  recordActivity({
    stamp: isCorrect ? "subitize" : "embodied",
    title: isCorrect ? "가재잡기 성공" : "가재잡기 정답 확인",
    detail: mission.question ? `${mission.question.text} = ${mission.question.answer}` : "개울가 바위 밑 가재 발견",
    result: isCorrect ? "O" : "X",
  });
  completeTodayMission("streamCrayfish");
  syncHud();
  saveGameProgress();
  finishActivity("streamCrayfish", isCorrect
    ? "바위 밑에서 가재를 발견하고 문제를 맞혀 그림일기에 기록했어요."
    : `가재를 발견했어요. 정답은 ${mission.question?.answer ?? "?"}였고, 함께 확인했어요.`);
}

function showStreamCrayfishDiscovery(mission) {
  state.activityFlow = { key: "streamCrayfish", status: "found" };
  ui.activityStage.textContent = "발견!";
  ui.activityTitle.textContent = "가재를 찾았어요!";
  ui.activityPraiseSticker?.classList.add("is-hidden");
  if (ui.activityDiscoveryImage) {
    ui.activityDiscoveryImage.src = ASSETS.streamCrayfish.crayfish;
    ui.activityDiscoveryImage.alt = "바위 밑에서 나온 가재";
    ui.activityDiscoveryImage.classList.remove("is-hidden");
  }
  ui.activityDescription.textContent = "바위 밑에서 가재가 쏙 나왔어요. 가재를 잡으려면 문제를 풀어보세요.";
  ui.activityPrimary.textContent = "문제 풀기";
  ui.activityExit.hidden = true;
  ui.activityOverlay.classList.remove("is-hidden");
}

function beginStreamCrayfishQuestion() {
  const mission = state.streamCrayfishMission;
  if (!mission || mission.phase !== "discovered") return;

  mission.phase = "question";
  state.activityFlow = { key: "streamCrayfish", status: "playing" };
  ui.activityDiscoveryImage?.classList.add("is-hidden");
  ui.activityOverlay.classList.add("is-hidden");
  ui.feedback.textContent = "가재가 도망가기 전에 천천히 수를 생각해보세요.";
  beginProblemSession(mission.question, {
    gameType: "stream_crayfish",
    target: { type: "crayfish" },
    feedback: "가재가 도망가기 전에 천천히 수를 생각해보세요.",
  });
}

function handleStreamCrayfishTap(event) {
  const mission = state.streamCrayfishMission;
  if (state.scene !== "stream" || !state.streamCrayfishActive || !mission || mission.completed) return false;
  if (mission.phase !== "search") return false;
  const point = canvasPoint(event);
  const rock = mission.rocks.find((item) => pointInRect(point, item));
  if (!rock) return false;

  mission.searchCount += 1;
  rock.searched = true;
  rock.wiggleUntil = state.time + 420;
  const forced = mission.searchCount >= STREAM_CRAYFISH_PITY_TAPS;
  const found = forced || Math.random() < STREAM_CRAYFISH_SPAWN_CHANCE;

  if (!found) {
    mission.notice = "여긴 비었어요. 다른 바위도 살펴보세요.";
    mission.noticeTone = "normal";
    ui.feedback.textContent = mission.notice;
    state.feedbackUntil = state.time + 1200;
    event.preventDefault();
    return true;
  }

  mission.phase = "discovered";
  mission.foundRockId = rock.id;
  mission.question = makeStreamCrayfishQuestion(mission);
  ui.feedback.textContent = "가재가 나왔어요! 그림을 보고 문제 풀기를 눌러보세요.";
  showStreamCrayfishDiscovery(mission);
  event.preventDefault();
  return true;
}

const STREAM_SKIPPING_STONES = [
  { id: 0, x: 210, y: 474, w: 138, h: 86, image: "stoneFlat", angle: -0.14 },
  { id: 1, x: 386, y: 484, w: 132, h: 88, image: "stoneRound", angle: 0.08 },
  { id: 2, x: 548, y: 470, w: 126, h: 82, image: "stoneFlat", angle: 0.12 },
];
const STREAM_SKIPPING_WATER_RECT = { x: 142, y: 118, w: 1000, h: 490 };

function makeStreamSkippingQuestion(mission) {
  if (mission.questionMode === "missing") {
    const missing = Math.max(0, mission.targetBounces - mission.bounces);
    return {
      kind: "stream-skipping-missing",
      grade: mission.grade,
      isPreview: mission.isPreview,
      text: `목표는 ${mission.targetBounces}번 튀기예요. 지금 ${mission.bounces}번 튀었어요. 몇 번 더 튀면 목표가 될까요?`,
      answer: missing,
      operands: [mission.bounces, missing],
      visual: { mode: "stream-skipping", bounces: mission.bounces, target: mission.targetBounces },
      gameType: "stream_skipping",
      affectsMastery: true,
    };
  }

  return {
    kind: "stream-skipping-count",
    grade: mission.grade,
    isPreview: mission.isPreview,
    text: `돌멩이가 물 위에서 ${mission.bounces}번 통통 튀었어요. 몇 번 튀었나요?`,
    answer: mission.bounces,
    operands: [mission.bounces],
    visual: { mode: "stream-skipping", bounces: mission.bounces },
    gameType: "stream_skipping",
    affectsMastery: true,
  };
}

function resetStreamSkippingMission() {
  const level = chooseActivityGrade("stream_skipping");
  state.streamSkippingMission = {
    grade: level.grade,
    isPreview: level.isPreview,
    type: `grade_${level.grade}_stream_skipping`,
    interactionMode: "touch_stone_then_count_ripples",
    learningGoal: "one_to_one_counting_from_action_result",
    phase: "ready",
    stones: STREAM_SKIPPING_STONES.map((stone) => ({ ...stone, used: false })),
    selectedStoneId: null,
    bounces: 0,
    targetBounces: 0,
    questionMode: "count",
    question: null,
    completed: false,
    startedAtMs: performance.now(),
    errorCount: 0,
    notice: "돌멩이를 하나 눌러 물수제비를 해보세요.",
    noticeTone: "normal",
  };
}

function startStreamSkippingMission() {
  if (state.scene !== "stream") {
    setScene("stream");
  }

  resetKitchenMissions();
  resetChickenCoopState();
  resetStoreMission();
  state.streamCrayfishMission = null;
  state.streamCrayfishActive = false;
  state.activeQuestion = null;
  renderAnswers([]);
  ui.questionPanel?.classList.add("is-hidden");
  resetStreamSkippingMission();
  state.streamSkippingActive = true;
  ui.mode.textContent = "개울가 물수제비";
  ui.question.textContent = "납작한 돌멩이를 골라 물 위로 던져보세요.";
  ui.feedback.textContent = state.streamSkippingMission.notice;
}

function beginStreamSkippingQuestion() {
  const mission = state.streamSkippingMission;
  if (!mission || mission.completed || mission.phase !== "skipped") return;
  mission.phase = "question";
  mission.question = makeStreamSkippingQuestion(mission);
  ui.feedback.textContent = mission.questionMode === "missing"
    ? "먼저 물결을 세고, 목표까지 모자란 만큼을 생각해보세요."
    : "물결이 생긴 횟수를 천천히 세어보세요.";
  beginProblemSession(mission.question, {
    gameType: "stream_skipping",
    feedback: mission.questionMode === "missing"
      ? "목표 횟수에서 지금 튄 횟수를 빼면 돼요."
      : "물결 하나가 통통 한 번이에요. 물결을 차례로 세어보세요.",
  });
}

function finishStreamSkippingMission(isCorrect) {
  const mission = state.streamSkippingMission;
  if (!mission || mission.completed) return;
  mission.completed = true;
  state.streamSkippingActive = false;
  state.stars += isCorrect ? 2 : 1;
  recordActivityOutcome(mission, "stream_skipping");
  recordActivity({
    stamp: isCorrect ? "subitize" : "embodied",
    title: isCorrect ? "물수제비 수 세기 성공" : "물수제비 수 같이 확인",
    detail: mission.questionMode === "missing"
      ? `목표 ${mission.targetBounces}번, 실제 ${mission.bounces}번, 부족 ${Math.max(0, mission.targetBounces - mission.bounces)}번`
      : `돌멩이가 ${mission.bounces}번 튐`,
    result: isCorrect ? "O" : "X",
  });
  completeTodayMission("streamSkipping");
  syncHud();
  saveGameProgress();
  finishActivity("streamSkipping", isCorrect
    ? mission.questionMode === "missing"
      ? `목표 ${mission.targetBounces}번까지 몇 번 더 필요한지 잘 찾았어요.`
      : `돌멩이가 ${mission.bounces}번 통통 튄 것을 잘 세었어요.`
    : mission.questionMode === "missing"
      ? `목표 ${mission.targetBounces}번까지는 ${Math.max(0, mission.targetBounces - mission.bounces)}번 더 필요했어요.`
      : `돌멩이는 ${mission.bounces}번 튀었어요. 물결을 하나씩 같이 세어봤어요.`);
}

function handleStreamSkippingTap(event) {
  const mission = state.streamSkippingMission;
  if (state.scene !== "stream" || !state.streamSkippingActive || !mission || mission.completed) return false;
  if (mission.phase !== "ready") return false;
  const point = canvasPoint(event);
  const stone = mission.stones.find((item) => pointInRect(point, item));
  if (!stone) return false;

  stone.used = true;
  mission.selectedStoneId = stone.id;
  const useMissingMode = mission.grade >= 2 && Math.random() < 0.55;
  mission.questionMode = useMissingMode ? "missing" : "count";
  mission.bounces = useMissingMode
    ? nextRandomInt("stream_skipping_bounces", 1, 4)
    : nextRandomInt("stream_skipping_bounces", 1, 5);
  mission.targetBounces = useMissingMode
    ? nextRandomInt("stream_skipping_target", mission.bounces + 1, Math.min(6, mission.bounces + 3))
    : 0;
  mission.phase = "skipped";
  mission.notice = useMissingMode
    ? `${mission.bounces}번 통통! 목표 ${mission.targetBounces}번까지 몇 번 더 필요할까요?`
    : `${mission.bounces}번 통통! 물결을 보고 몇 번 튀었는지 세어보세요.`;
  ui.feedback.textContent = mission.notice;
  state.feedbackUntil = state.time + 1200;
  window.setTimeout(() => beginStreamSkippingQuestion(), 720);
  event.preventDefault();
  return true;
}

function resetChickenCoopMission(payload = CHICKEN_COOP_PAYLOAD) {
  const eggSpecs = [
    ["yellow", 250, 430],
    ["yellow", 350, 504],
    ["yellow", 484, 458],
    ["cream", 324, 388],
    ["cream", 560, 520],
    ["cream", 615, 438],
    ["blue", 520, 372],
    ["blue", 430, 396],
  ];
  const level = chooseActivityGrade("chicken_coop");
  const grade = level.grade;
  let mode;
  let instruction;
  let targetTotal;
  let initialCount = 0;
  let rules;

  if (grade === 1) {
    mode = "observe_yellow";
    targetTotal = 2;
    instruction = "여러 달걀을 살펴보고 노란 달걀만 2개 찾아 눌러보세요.";
    rules = {
      yellow: { color: "yellow", target_count: targetTotal, label: "찾은 노란 달걀" },
      cream: { disabled: true, target_count: 0, label: "사용하지 않아요" },
    };
  } else if (grade === 2) {
    mode = "observe_blue";
    targetTotal = 2;
    instruction = "노란색과 크림색 사이에서 파란 달걀만 2개 찾아 눌러보세요.";
    rules = {
      yellow: { color: "blue", target_count: targetTotal, label: "찾은 파란 달걀" },
      cream: { disabled: true, target_count: 0, label: "사용하지 않아요" },
    };
  } else if (grade === 3) {
    mode = "classify";
    const yellowTarget = nextRandomInt("chickenYellowTarget", 1, 3);
    const creamTarget = nextRandomInt("chickenCreamTarget", 1, 3);
    targetTotal = yellowTarget + creamTarget;
    instruction = `노란 달걀 ${yellowTarget}개와 크림색 달걀 ${creamTarget}개를 알맞게 분류하세요.`;
    rules = {
      yellow: { color: "yellow", target_count: yellowTarget, label: "노란 달걀" },
      cream: { color: "cream", target_count: creamTarget, label: "크림색 달걀" },
    };
  } else {
    mode = "split";
    targetTotal = nextRandomInt("chickenSplitTarget", 5, 7);
    instruction = `달걀 ${targetTotal}개를 두 바구니에 나누어 담으세요. 양쪽에 적어도 1개씩 필요해요.`;
    rules = {
      yellow: { acceptAny: true, target_count: targetTotal, label: "바구니 A" },
      cream: { acceptAny: true, target_count: targetTotal, label: "바구니 B" },
    };
  }

  const eggs = eggSpecs.map(([color, x, y], index) => ({
    id: index,
    color,
    x,
    y,
    targetX: x,
    targetY: y,
    homeX: x,
    homeY: y,
    angle: randomBetween(-0.32, 0.32),
    placed: false,
    offsetX: 0,
    offsetY: 0,
  }));

  for (let index = 0; index < initialCount; index++) {
    const egg = eggs[index];
    egg.placed = true;
    egg.x = CHICKEN_COOP_ZONES.yellow.x + 54 + (index % 3) * 42;
    egg.y = CHICKEN_COOP_ZONES.yellow.y + 84 - Math.floor(index / 3) * 22;
    egg.targetX = egg.x;
    egg.targetY = egg.y;
  }

  state.chickenCoopMission = {
    payload,
    grade,
    isPreview: level.isPreview,
    mode,
    type: `grade_${grade}_${mode}`,
    interactionMode: grade <= 2 ? "tap_select" : "drag_drop",
    learningGoal: grade === 1 ? "visual_color_matching"
      : grade === 2 ? "visual_discrimination"
      : grade === 3 ? "conditional_classification"
      : "open_number_partition",
    instruction,
    targetTotal,
    initialCount,
    startedAtMs: performance.now(),
    rules,
    placed: { yellow: initialCount, cream: 0 },
    errors: [],
    errorCount: 0,
    usedHint: false,
    completed: false,
    eggs,
  };
  state.draggingEggId = null;
}

function startChickenCoopMission() {
  if (state.scene !== "coop") setScene("coop");
  resetChickenCoopMission();
  state.chickenCoopActive = true;
  ui.mode.textContent = "닭장 · 달걀 놀이";
  ui.question.textContent = state.chickenCoopMission.instruction;
  ui.feedback.textContent = state.chickenCoopMission.grade <= 2
    ? "달걀의 색을 천천히 살펴보고 조건에 맞는 것만 눌러보세요."
    : "달걀을 조건에 맞는 바구니로 옮겨보세요.";
}

function createFlyTarget(grade = 1) {
  const speed = [0.10, 0.13, 0.16, 0.19][clamp(grade, 1, 4) - 1];
  return {
    x: randomBetween(560, 1120),
    y: randomBetween(180, 430),
    vx: randomSignedVelocity(speed * 0.72, speed),
    vy: randomSignedVelocity(speed * 0.42, speed * 0.7),
    mode: "flying",
    modeUntil: state.time + randomBetween(1500, 2800),
    caughtAt: 0,
    frameSeed: Math.floor(randomBetween(0, 4)),
  };
}

function startFlyGame() {
  if (state.scene !== "coop") setScene("coop");
  const level = chooseActivityGrade("fly_catching");
  state.chickenCoopMission = null;
  state.chickenCoopActive = false;
  state.draggingEggId = null;
  state.flyMission = {
    grade: level.grade,
    isPreview: level.isPreview,
    type: `grade_${level.grade}_visual_tracking`,
    interactionMode: "tap_tracking",
    learningGoal: "visual_tracking_inhibition_and_counting",
    target: 5,
    caught: 0,
    errorCount: 0,
    startedAtMs: performance.now(),
    completed: false,
    fly: createFlyTarget(level.grade),
  };
  ui.mode.textContent = "닭장 · 파리 잡기";
  ui.question.textContent = "파리 5마리를 찾아 톡 눌러 잡아보세요.";
  ui.feedback.textContent = "날아갈 때도, 잠깐 앉았을 때도 잡을 수 있어요.";
}

function completeFlyGame() {
  const mission = state.flyMission;
  if (!mission || mission.completed) return;
  mission.completed = true;
  showAnswerReveal(mission.target);
  state.stars += 2;
  recordActivityOutcome(mission, "fly_catching");
  recordActivity({
    stamp: "embodied",
    title: "닭장 파리 잡기 완료",
    detail: `움직이는 파리 ${mission.target}마리를 찾아 수를 세며 잡음`,
    result: "O",
  });
  completeTodayMission("flyGame");
  ui.question.textContent = `파리 ${mission.target}마리를 모두 잡았어요!`;
  ui.feedback.textContent = "닭장이 깨끗해졌어요. 별 2개를 받았어요.";
  syncHud();
  saveGameProgress();
  finishActivity("flyGame", `파리 ${mission.target}마리를 눈으로 따라가며 정확히 찾았어요.`);
}

function createRandomProblemAudit(sampleCount = 8) {
  const samples = [];
  const previousQuestCount = state.quests;

  for (let index = 0; index < sampleCount; index++) {
    resetWoodMission();
    resetPlumMission();
    resetSobanMission();
    resetCatSnackMission();
    resetChickenCoopMission();
    state.quests = index % 2 === 0 ? 1 : 7;
    const insectQuestion = makeQuestion({ type: index % 3 === 0 ? "firefly" : "butterfly" });

    samples.push({
      wood: state.woodMission.target,
      plum: state.plumMission.target,
      soban: state.sobanMission.familyCount,
      cat: `${state.catSnackMission.total}-${state.catSnackMission.stolen}`,
      chicken: `${state.chickenCoopMission.rules.yellow.target_count}-${state.chickenCoopMission.rules.cream.target_count}`,
      insect: questionSignature(insectQuestion),
    });
  }

  state.quests = previousQuestCount;
  return samples;
}

function findInsectSpawnSpot(zone, width, placedInsects = state.butterflies) {
  const minDistance = Math.max(110, width * 0.98);
  let best = null;
  let bestDistance = -Infinity;

  for (let attempt = 0; attempt < 70; attempt++) {
    const candidate = {
      x: randomBetween(zone.x + 42, zone.x + zone.w - 42),
      y: randomBetween(zone.y + 32, zone.y + zone.h - 32),
    };

    const nearest = placedInsects.reduce((distance, insect) => {
      if (insect.caught) return distance;
      return Math.min(distance, Math.hypot(candidate.x - insect.x, candidate.y - insect.y));
    }, Infinity);

    if (nearest >= minDistance) return candidate;
    if (nearest > bestDistance) {
      best = candidate;
      bestDistance = nearest;
    }
  }

  return best || {
    x: randomBetween(zone.x + 42, zone.x + zone.w - 42),
    y: randomBetween(zone.y + 32, zone.y + zone.h - 32),
  };
}

function syncHud() {
  ui.stars.textContent = state.stars;
  ui.bugs.textContent = state.bugs;
  ui.quests.textContent = state.quests;
  if (ui.questGoal) ui.questGoal.textContent = QUEST_TARGET;
  renderCollection();
}

function insectThumbSrc(type) {
  const config = INSECT_CONFIG[type] || INSECT_CONFIG.butterfly;
  const frame = config.frames?.[0] ?? 0;
  return ASSETS[type]?.[frame] || ASSETS.butterfly[0];
}

function renderCollection() {
  if (!ui.collectionPanel) return;

  const caughtTypes = COLLECTION_ORDER.filter((type) => state.collected[type]);
  ui.collectionSummary.textContent = `${caughtTypes.length} / ${COLLECTION_ORDER.length}`;

  ui.collectionList.replaceChildren();

  COLLECTION_ORDER.forEach((type) => {
    const config = INSECT_CONFIG[type];
    const caught = Boolean(state.collected[type]);
    const item = document.createElement("div");
    item.className = `collection-item${caught ? " is-caught" : ""}${config.rarity === "unique" ? " is-unique" : ""}`;

    const thumb = document.createElement("img");
    thumb.src = insectThumbSrc(type);
    thumb.alt = "";

    const label = document.createElement("span");
    label.textContent = config.label;

    const status = document.createElement("em");
    status.textContent = config.rarity === "unique" ? (caught ? "유니크" : "희귀") : (caught ? "완료" : "필요");

    item.append(thumb, label, status);
    ui.collectionList.append(item);
  });

  if (ui.jarImage) {
    const frame = String(Math.min(INSECT_ORDER.length, caughtTypes.length)).padStart(2, "0");
    ui.jarImage.src = `assets/ui-sprites/collection_box_${frame}.png`;
  }
}

function renderAnswers(answers) {
  ui.answers.replaceChildren();
  ui.answers.classList.remove("number-pad");
  ui.questionPanel?.classList.remove("has-number-pad");
  for (const value of answers) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = value;
    button.addEventListener("click", () => answerQuestion(value));
    ui.answers.append(button);
  }
}

function renderNumberPad(question) {
  ui.answers.replaceChildren();
  ui.answers.classList.add("number-pad");
  ui.questionPanel?.classList.add("has-number-pad");

  const display = document.createElement("output");
  display.className = "number-pad-display";
  display.setAttribute("aria-live", "polite");
  display.textContent = question.answerBuffer || "?";
  ui.answers.append(display);

  const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9, "back", 0, "submit"];
  for (const key of keys) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `number-key number-key-${key}`;
    button.textContent = key === "back" ? "←" : key === "submit" ? "확인" : String(key);
    button.setAttribute("aria-label", key === "back" ? "한 글자 지우기" : key === "submit" ? "정답 확인" : `숫자 ${key}`);
    button.addEventListener("click", () => handleNumberPadKey(key));
    ui.answers.append(button);
  }
}

function createProblemSession(question, options = {}) {
  return {
    ...question,
    gameType: options.gameType || question.gameType || "general",
    affectsMastery: options.affectsMastery ?? question.affectsMastery ?? false,
    target: options.target ?? question.target ?? null,
    startedAtMs: performance.now(),
    inputStage: "symbolic",
    answerBuffer: "",
    wrongAttempts: 0,
    usedHint: false,
    hintOffered: false,
    interactionMode: "number_pad",
    concreteModel: null,
    nayeonVariant: (state.problemLog.length + state.learningProfile.totalAttempts) % 2 === 0 ? "pigtails" : "hat",
  };
}

function beginProblemSession(question, options = {}) {
  hideNayeonHint();
  state.activeQuestion = createProblemSession(question, options);
  ui.questionPanel?.classList.remove("is-hidden", "is-hint-stage", "is-concrete-stage");
  setQuestion(state.activeQuestion.text);
  setFeedback(options.feedback || "숫자를 알고 있다면 숫자패드로 바로 입력해보세요.");
  renderNumberPad(state.activeQuestion);
  return state.activeQuestion;
}

function clearProblemSession() {
  hideNayeonHint();
  state.activeQuestion = null;
  ui.questionPanel?.classList.remove("is-hint-stage", "is-concrete-stage", "has-number-pad");
  renderAnswers([]);
}

function handleNumberPadKey(key) {
  const question = state.activeQuestion;
  if (!question) return;

  if (key === "back") {
    question.answerBuffer = question.answerBuffer.slice(0, -1);
  } else if (key === "submit") {
    if (!question.answerBuffer) return;
    question.interactionMode = "number_pad";
    answerQuestion(Number(question.answerBuffer));
    return;
  } else if (question.answerBuffer.length < 2) {
    question.answerBuffer += String(key);
  }

  const display = ui.answers.querySelector(".number-pad-display");
  if (display) display.textContent = question.answerBuffer || "?";
}

function parseArithmeticText(text = "") {
  const compact = String(text).replace(/\s+/g, "");
  const missing = compact.match(/^(\d+)\+\?=(\d+)/);
  if (missing) {
    const known = Number(missing[1]);
    const total = Number(missing[2]);
    return Number.isFinite(known) && Number.isFinite(total)
      ? { kind: "missing-addend", operands: [known, total - known], known, total, answer: total - known }
      : null;
  }

  const binary = compact.match(/^(\d+)([+\-−])(\d+)=?\??/);
  if (!binary) return null;
  const a = Number(binary[1]);
  const b = Number(binary[3]);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  const isSubtraction = binary[2] === "-" || binary[2] === "−";
  return {
    kind: isSubtraction ? "subtraction" : "addition",
    operands: [a, b],
    answer: isSubtraction ? a - b : a + b,
  };
}

function createConcreteModel(questionOrAnswer) {
  const question = typeof questionOrAnswer === "object" ? questionOrAnswer : null;
  const parsedArithmetic = parseArithmeticText(question?.text);
  const normalizedKind = parsedArithmetic?.kind || question?.kind;
  const answer = question ? (question.answer ?? parsedArithmetic?.answer) : questionOrAnswer;
  const operands = question?.operands || parsedArithmetic?.operands || null;

  if ((normalizedKind === "subtraction" || normalizedKind === "badugi-subtraction" || normalizedKind === "cat-snack-subtraction" || normalizedKind === "plum-cat-subtraction")) {
    const parsedTotal = Number(question?.text?.match(/\d+/)?.[0]);
    const total = operands?.[0] ?? question?.visual?.total ?? (Number.isFinite(parsedTotal) ? parsedTotal : answer);
    const takeAway = operands?.[1] ?? question?.visual?.stolen ?? Math.max(0, total - answer);
    const source = { x: 330, y: 164, w: 390, h: 190 };
    return {
      mode: "take_away",
      total,
      takeAway,
      source,
      target: { x: 756, y: 164, w: 190, h: 190 },
      items: Array.from({ length: total }, (_, index) => {
        const x = source.x + 36 + (index % 8) * 43;
        const y = source.y + 62 + Math.floor(index / 8) * 34;
        return { id: index, value: 1, x, y, homeX: x, homeY: y, offsetX: 0, offsetY: 0, collected: false };
      }),
      draggingId: null,
      collectedValue: 0,
    };
  }

  if (normalizedKind === "missing-addend") {
    const known = Number(parsedArithmetic?.known ?? Math.max(0, (Number(answer) || 0)));
    const total = Number(parsedArithmetic?.total ?? known + (Number(answer) || 0));
    const source = { x: 330, y: 164, w: 300, h: 190 };
    return {
      mode: "fill_missing",
      known,
      total,
      source,
      target: { x: 668, y: 164, w: 278, h: 190 },
      items: Array.from({ length: Math.max(0, total - known) }, (_, index) => {
        const x = source.x + 48 + (index % 4) * 58;
        const y = source.y + 68 + Math.floor(index / 4) * 42;
        return { id: index, value: 1, x, y, homeX: x, homeY: y, offsetX: 0, offsetY: 0, collected: false };
      }),
      draggingId: null,
      collectedValue: known,
    };
  }

  if (normalizedKind === "addition" && operands?.length === 2) {
    const groups = [
      { id: 0, label: `${operands[0]}개 바구니`, x: 318, y: 164, w: 190, h: 190, color: "yellow" },
      { id: 1, label: `${operands[1]}개 바구니`, x: 526, y: 164, w: 190, h: 190, color: "blue" },
    ];
    const items = operands.flatMap((count, groupIndex) => Array.from({ length: count }, (_, index) => {
      const group = groups[groupIndex];
      const x = group.x + 32 + (index % 4) * 40;
      const y = group.y + 62 + Math.floor(index / 4) * 32;
      return {
        id: `${groupIndex}-${index}`,
        group: groupIndex,
        value: 1,
        x,
        y,
        homeX: x,
        homeY: y,
        offsetX: 0,
        offsetY: 0,
        collected: false,
      };
    }));

    return {
      mode: "combine",
      operands,
      sourceGroups: groups,
      target: { x: 748, y: 164, w: 210, h: 190 },
      items,
      draggingId: null,
      collectedValue: 0,
    };
  }

  const safeAnswer = Math.max(0, Math.round(answer));
  const values = safeAnswer === 0 ? [0] : [
    ...Array.from({ length: Math.floor(safeAnswer / 10) }, () => 10),
    ...Array.from({ length: safeAnswer % 10 }, () => 1),
  ];

  return {
    target: { x: 780, y: 164, w: 164, h: 196 },
    items: values.map((value, index) => {
      const x = 350 + (index % 5) * 72;
      const y = 184 + Math.floor(index / 5) * 74;
      return {
        id: index,
        value,
        x,
        y,
        homeX: x,
        homeY: y,
        offsetX: 0,
        offsetY: 0,
        collected: false,
      };
    }),
    draggingId: null,
    collectedValue: 0,
  };
}

function nayeonSpriteForQuestion(question) {
  return question?.nayeonVariant === "pigtails"
    ? "assets/characters/nayeon/nayeon_pigtails.png?v=20260621-nayeon"
    : "assets/characters/nayeon/nayeon_hint.png?v=20260621-nayeon";
}

function nayeonHintPlanForQuestion(question) {
  const kind = question?.kind;
  if (kind === "missing-addend") {
    const match = question.text?.match(/^\s*(\d+)\s*\+\s*\?\s*=\s*(\d+)/);
    const known = Number(match?.[1] || 0);
    const target = Number(match?.[2] || 0);
    return {
      title: "빈칸은 얼마나 더 필요할까?",
      text: `${known}개를 먼저 놓고, ${target}개가 될 때까지 하나씩 더 채워보자. 새로 넣은 개수만 세면 빈칸을 찾을 수 있어!`,
      handLabel: "빈칸 채워보기",
    };
  }

  if (kind === "subtraction" || kind === "badugi-subtraction" || kind === "cat-snack-subtraction" || kind === "plum-cat-subtraction" || question?.text?.includes("-")) {
    const textNumbers = (question?.text?.match(/\d+/g) || []).map(Number);
    const total = question?.operands?.[0] ?? question?.visual?.total ?? textNumbers[0];
    const takeAway = question?.operands?.[1] ?? question?.visual?.stolen
      ?? (textNumbers.length > 1 ? textNumbers.slice(1).reduce((sum, value) => sum + value, 0) : undefined);
    return {
      title: "가져간 만큼 빼보자",
      text: Number.isFinite(total) && Number.isFinite(takeAway)
        ? `${total}개를 먼저 놓고, 가져간 ${takeAway}개를 옆 상자로 하나씩 옮겨보자. 처음 상자에 남은 것만 세면 돼!`
        : "처음 수만큼 놓고, 가져간 수만큼 옆으로 하나씩 빼보자. 남은 것만 세면 돼!",
      handLabel: "직접 빼보기",
    };
  }

  if (kind === "subitize" || kind === "firefly-subitize") {
    const layout = question?.visual?.layout;
    const text = layout === "dice"
      ? "주사위 점처럼 놓인 자리를 한눈에 살펴보자. 익숙한 모양이면 하나씩 세지 않아도 보여!"
      : layout === "cluster"
      ? "가까이 모인 왼쪽 묶음과 오른쪽 묶음을 따로 보고, 두 묶음을 이어 세어보자!"
      : "흩어진 것을 위에서 아래로 천천히 짚어보자. 이미 센 것은 다시 세지 않도록 눈으로 길을 만들어봐!";
    return {
      title: "어떤 모양으로 모여 있을까?",
      text,
      handLabel: "옮기며 세어보기",
    };
  }

  if (kind === "addition") {
    const [first, second] = question?.operands || [];
    const crossesTen = Number.isFinite(first) && Number.isFinite(second) && first < 10 && first + second > 10;
    const usesTens = Number.isFinite(first) && Number.isFinite(second) && first >= 10;
    return {
      title: crossesTen ? "먼저 10을 만들어볼까?" : usesTens ? "10묶음과 낱개로 볼까?" : "두 무리를 한곳에 모아보자",
      text: crossesTen
        ? `${first}에서 10이 되려면 몇 개가 더 필요한지 먼저 찾아보자. 그만큼 옮긴 뒤 남은 것을 이어 세면 쉬워!`
        : usesTens
        ? `${first}를 10묶음과 낱개로 나누어 보고, ${second}개를 낱개부터 하나씩 더해보자!`
        : Number.isFinite(first) && Number.isFinite(second)
        ? `첫 상자 ${first}개와 두 번째 상자 ${second}개를 마지막 상자에 하나씩 모아보자. 옮길 때마다 수가 하나씩 커져!`
        : "두 무리를 따로 살펴본 다음 마지막 상자에 하나씩 모으며 이어 세어보자!",
      handLabel: "두 상자 합치기",
    };
  }

  return {
    title: "천천히 한 단계씩 보자",
    text: "문제에서 알고 있는 수를 먼저 놓고, 바뀌는 수를 하나씩 움직이며 살펴보자!",
    handLabel: "손으로 살펴보기",
  };
}

function nayeonHintForQuestion(question) {
  return nayeonHintPlanForQuestion(question).text;
}

function addNayeonHintOffer(question) {
  if (!question || ui.answers.querySelector(".nayeon-hint-offer")) return;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "nayeon-hint-offer";
  button.setAttribute("aria-label", "나연이에게 힌트 물어보기");
  const portrait = document.createElement("img");
  portrait.src = nayeonSpriteForQuestion(question);
  portrait.alt = "";
  const label = document.createElement("span");
  label.textContent = "나연이에게 물어보기";
  button.append(portrait, label);
  button.addEventListener("click", showNayeonHint);
  ui.answers.append(button);
}

function showNayeonHint() {
  const question = state.activeQuestion;
  if (!question) return;
  question.inputStage = "hint";
  question.usedHint = true;
  question.answerBuffer = "";
  question.interactionMode = "nayeon_hint";
  question.concreteModel ||= createConcreteModel(question);
  renderAnswers([]);
  ui.questionPanel?.classList.remove("has-number-pad");
  ui.questionPanel?.classList.add("is-hint-stage");
  ui.nayeonHintImage.src = nayeonSpriteForQuestion(question);
  const hintPlan = nayeonHintPlanForQuestion(question);
  if (ui.nayeonHintTitle) ui.nayeonHintTitle.textContent = hintPlan.title;
  ui.nayeonHintText.textContent = hintPlan.text;
  ui.nayeonTryNumber.textContent = "숫자로 풀기";
  ui.nayeonTryDrag.textContent = hintPlan.handLabel;
  ui.nayeonTryDrag.setAttribute("aria-label", hintPlan.handLabel);
  ui.nayeonHintPanel?.classList.remove("is-hidden");
  ui.feedback.textContent = "나연이의 생각을 보고, 풀 방법을 골라보세요.";
}

function hideNayeonHint() {
  ui.nayeonHintPanel?.classList.add("is-hidden");
}

function returnToNumberPadFromNayeon() {
  const question = state.activeQuestion;
  if (!question) return;
  hideNayeonHint();
  question.inputStage = "symbolic";
  question.answerBuffer = "";
  question.interactionMode = "number_pad";
  ui.questionPanel?.classList.remove("is-hint-stage", "is-concrete-stage");
  renderNumberPad(question);
  addNayeonHintOffer(question);
  ui.feedback.textContent = "나연이의 생각을 떠올리며 숫자로 다시 풀어보세요.";
}

function startConcreteFromNayeon() {
  const question = state.activeQuestion;
  if (!question) return;
  hideNayeonHint();
  question.inputStage = "concrete";
  question.concreteModel ||= createConcreteModel(question);
  question.interactionMode = question.concreteModel?.mode || "drag_drop";
  ui.questionPanel?.classList.remove("is-hint-stage", "has-number-pad");
  ui.questionPanel?.classList.add("is-concrete-stage");
  renderAnswers([]);
  ui.feedback.textContent = question.concreteModel?.mode === "take_away"
    ? "가져갈 수만큼 옆 상자로 직접 빼보세요."
    : question.concreteModel?.mode === "fill_missing"
    ? "목표 수가 될 때까지 부족한 만큼만 채워보세요."
    : "물체를 직접 옮기며 수가 바뀌는 모습을 살펴보세요.";
}

function updateQuestionInputStages() {
  const question = state.activeQuestion;
  if (!question || !question.startedAtMs) return;
  const elapsed = performance.now() - question.startedAtMs;

  if (question.inputStage === "symbolic" && elapsed >= 5000 && !question.hintOffered) {
    question.hintOffered = true;
    addNayeonHintOffer(question);
    ui.feedback.textContent = "어려우면 나연이에게 물어볼 수 있어요.";
  }
}

function makeQuestion(target) {
  const level = chooseInsectQuestionLevel();
  let question;
  for (let attempt = 0; attempt < 8; attempt++) {
    question = normalizeQuestionText(makeQuestionCandidate(target, level.grade));
    if (rememberProblem("insectQuestion", questionSignature(question))) {
      return { ...question, grade: level.grade, isPreview: level.isPreview };
    }
  }
  return { ...question, grade: level.grade, isPreview: level.isPreview };
}

function makeQuestionCandidate(target, grade = 1) {
  if (target?.type === "firefly") {
    return makeFireflySubitizeQuestion(grade);
  }

  if (grade >= 3 && Math.random() < 0.28) {
    return makeBadugiSubtractionQuestion();
  }

  if (grade === 2 && Math.random() < 0.34) {
    return makeMissingAddendQuestion();
  }

  const subitizeChance = grade === 1 ? 0.72 : grade === 2 ? 0.4 : 0.18;
  if (Math.random() < subitizeChance) {
    return makeSubitizeQuestion(grade);
  }

  return makeArithmeticQuestion(grade);
}

function questionSignature(question) {
  if (!question) return "none";
  if (question.kind === "badugi-subtraction") {
    return `${question.kind}:${question.visual.total}-${question.visual.stolen}`;
  }
  if (question.kind === "firefly-subitize") {
    return `${question.kind}:${question.visual.amount}:${question.visual.layout}`;
  }
  if (question.kind === "subitize") {
    return `${question.kind}:${question.visual.object.type}:${question.visual.amount}:${question.visual.layout}`;
  }
  return `${question.kind}:${question.text}`;
}

function normalizeQuestionText(question) {
  if (!question) return question;

  if (question.kind === "firefly-subitize") {
    question.text = "반딧불이가 몇 마리일까요?";
  } else if (question.kind === "badugi-subtraction") {
    question.text = `바둑이가 옥수수 ${question.visual.stolen}개를 가져갔어요. 몇 개가 남았을까요?`;
  } else if (question.kind === "subitize") {
    question.text = `${question.visual.object.label}은 몇 개일까요?`;
  }

  return question;
}

function makeBadugiSubtractionQuestion() {
  const total = Math.floor(randomBetween(4, 9));
  const stolen = Math.floor(randomBetween(1, Math.min(4, total)));
  const answer = total - stolen;
  const options = new Set([answer]);

  while (options.size < 3) {
    options.add(clamp(answer + Math.floor(randomBetween(-3, 4)), 0, 9));
  }

  return {
    kind: "badugi-subtraction",
    text: `바둑이가 옥수수 ${stolen}개를 가져갔어요. 몇 개 남았을까요?`,
    answer,
    options: [...options].sort(() => Math.random() - 0.5),
    visual: {
      mode: "badugi",
      total,
      stolen,
      answer,
    },
  };
}

function makeFireflySubitizeQuestion(grade = 1) {
  const maxAmount = [5, 7, 9, 10][clamp(grade, 1, 4) - 1];
  const amount = Math.floor(randomBetween(3, maxAmount + 1));
  const layout = chooseSubitizeLayout(amount, grade);
  const options = new Set([amount]);

  while (options.size < 3) {
    options.add(clamp(amount + Math.floor(randomBetween(-2, 3)), 1, 9));
  }

  return {
    kind: "firefly-subitize",
    text: "반딧불이가 몇 마리일까요?",
    answer: amount,
    options: [...options].sort(() => Math.random() - 0.5),
    visual: {
      amount,
      layout,
      mode: "firefly",
      positions: createSubitizePositions(amount, layout),
    },
  };
}

function makeArithmeticQuestion(grade = 1) {
  const numberMax = [10, 15, 20, 30][clamp(grade, 1, 4) - 1];
  const subtractionChance = grade === 1 ? 0.2 : grade === 2 ? 0.35 : 0.5;
  const plus = Math.random() > subtractionChance;
  let a;
  let b;
  let answer;
  let text;

  if (plus) {
    if (grade >= 4) {
      a = Math.floor(randomBetween(6, 16));
      b = Math.floor(randomBetween(Math.max(2, 11 - (a % 10)), Math.min(15, numberMax - a) + 1));
    } else {
      a = Math.floor(randomBetween(1, numberMax));
      b = Math.floor(randomBetween(1, numberMax - a + 1));
    }
    answer = a + b;
    text = `${a} + ${b} = ?`;
  } else {
    a = Math.floor(randomBetween(2, numberMax + 1));
    b = Math.floor(randomBetween(1, a));
    answer = a - b;
    text = `${a} - ${b} = ?`;
  }

  const options = new Set([answer]);
  while (options.size < 3) {
    options.add(clamp(answer + Math.floor(randomBetween(-4, 5)), 0, numberMax));
  }

  return {
    kind: plus ? "addition" : "subtraction",
    text,
    answer,
    operands: [a, b],
    options: [...options].sort(() => Math.random() - 0.5),
  };
}

function makeMissingAddendQuestion() {
  const target = Math.floor(randomBetween(7, 16));
  const known = Math.floor(randomBetween(2, target));
  const answer = target - known;
  const options = new Set([answer]);

  while (options.size < 3) {
    options.add(clamp(answer + Math.floor(randomBetween(-3, 4)), 0, 15));
  }

  return {
    kind: "missing-addend",
    text: `${known} + ? = ${target}`,
    answer,
    options: [...options].sort(() => Math.random() - 0.5),
  };
}

function makeSubitizeQuestion(grade = 1) {
  const maxAmount = [5, 7, 9, 10][clamp(grade, 1, 4) - 1];
  const amount = Math.floor(randomBetween(2, maxAmount + 1));
  const layout = chooseSubitizeLayout(amount, grade);
  const object = choose(SUBITIZE_OBJECTS);
  const positions = createSubitizePositions(amount, layout);
  const options = new Set([amount]);

  while (options.size < 3) {
    options.add(clamp(amount + Math.floor(randomBetween(-2, 3)), 1, 9));
  }

  return {
    kind: "subitize",
    text: `${object.label}은(는) 몇 개일까요?`,
    answer: amount,
    options: [...options].sort(() => Math.random() - 0.5),
    visual: {
      amount,
      layout,
      object,
      positions,
    },
  };
}

function chooseSubitizeLayout(amount, grade = 1) {
  if (grade === 1 && amount <= 4) return "dice";
  if (grade <= 2) return Math.random() < 0.75 ? "cluster" : "scattered";
  return Math.random() < 0.35 ? "cluster" : "scattered";
}

function createSubitizePositions(amount, layout) {
  if (layout === "dice") {
    const dice = {
      1: [[0.5, 0.5]],
      2: [[0.34, 0.36], [0.66, 0.64]],
      3: [[0.32, 0.34], [0.5, 0.5], [0.68, 0.66]],
      4: [[0.34, 0.34], [0.66, 0.34], [0.34, 0.66], [0.66, 0.66]],
    };
    return dice[amount] || [];
  }

  if (layout === "cluster") {
    const leftCount = Math.ceil(amount / 2);
    const rightCount = amount - leftCount;
    return [
      ...createCluster(leftCount, 0.38, 0.5, 0),
      ...createCluster(rightCount, 0.64, 0.5, Math.PI / 6),
    ];
  }

  const positions = [];
  for (let index = 0; index < amount; index++) {
    let candidate = null;
    for (let attempt = 0; attempt < 30; attempt++) {
      candidate = [randomBetween(0.25, 0.75), randomBetween(0.25, 0.75)];
      const nearest = positions.reduce((best, point) => {
        return Math.min(best, Math.hypot(candidate[0] - point[0], candidate[1] - point[1]));
      }, Infinity);
      if (nearest > 0.15) break;
    }
    positions.push(candidate);
  }
  return positions;
}

function createCluster(count, centerX, centerY, phase) {
  if (count <= 0) return [];
  if (count === 1) return [[centerX, centerY]];

  const positions = [];
  const radius = count <= 3 ? 0.105 : 0.13;
  for (let index = 0; index < count; index++) {
    const angle = phase + (Math.PI * 2 * index) / count;
    positions.push([
      centerX + Math.cos(angle) * radius,
      centerY + Math.sin(angle) * radius,
    ]);
  }
  return positions;
}

function nearestButterfly() {
  let best = null;
  let bestDistance = Infinity;

  for (const butterfly of state.butterflies) {
    if (butterfly.caught) continue;
    const dx = butterfly.x - state.dongwoo.x;
    const dy = butterfly.y - (state.dongwoo.y - 160);
    const distance = Math.hypot(dx, dy);
    if (distance < bestDistance) {
      best = butterfly;
      bestDistance = distance;
    }
  }

  return { butterfly: best, distance: bestDistance };
}

function insectHitRadius(insect) {
  const config = INSECT_CONFIG[insect?.type] || INSECT_CONFIG.butterfly;
  return {
    x: Math.max(44, config.width * 0.72),
    y: Math.max(38, (config.height || config.width * 0.7) * 0.78),
  };
}

function insectAtPoint(point) {
  if (!point) return null;
  return [...state.butterflies].reverse().find((insect) => {
    if (insect.caught) return false;
    if (isFireflyNightEvent() && insect.type !== "firefly") return false;
    const radius = insectHitRadius(insect);
    const dx = point.x - insect.x;
    const dy = point.y - insect.y;
    return Math.abs(dx) <= radius.x && Math.abs(dy) <= radius.y;
  }) || null;
}

function startCatch(targetInsect = null) {
  if (state.scene !== "insects" || state.activeQuestion) return;

  const target = targetInsect || nearestButterfly().butterfly;
  state.dongwoo.action = "catch";
  state.dongwoo.actionUntil = state.time + 900;

  if (!target) {
    ui.question.textContent = "곤충을 직접 눌러 잡아보세요.";
    ui.feedback.textContent = "오늘 나온 곤충 이미지를 터치하면 문제가 나와요.";
    state.feedbackUntil = state.time + 1400;
    return;
  }

  ui.question.textContent = `${INSECT_CONFIG[target.type]?.label || "곤충"}을(를) 찾았어요.`;
  ui.feedback.textContent = "문제를 풀면 채집함에 기록돼요.";
  beginProblemSession(makeQuestion(target), {
    gameType: "insect_collection",
    affectsMastery: true,
    target,
  });
  state.insectQuestionIndex += 1;
}

function handleInsectTap(event) {
  if (state.scene !== "insects" || state.activeQuestion || hasBlockingOverlay()) return false;
  const point = canvasPoint(event);
  const target = insectAtPoint(point);
  if (!target) return false;
  startCatch(target);
  event.preventDefault();
  return true;
}

function feedbackForQuestion(question) {
  if (question?.visual?.mode === "badugi") {
    return "가져간 만큼 빼서 생각해요.";
  }
  if (question?.visual?.mode === "firefly") {
    return "반딧불이 빛 무리를 한눈에 봐요.";
  }
  if (question?.visual?.mode === "stream-crayfish") {
    return "가재가 나온 상황을 천천히 더하거나 빼서 생각해요.";
  }
  if (question?.visual?.mode === "stream-skipping") {
    return "물결 하나가 돌멩이가 통통 튄 한 번이에요.";
  }
  if (question?.visual) {
    return "하나씩 세기 전에 묶음으로 먼저 봐요.";
  }
  return "정답을 고르면 관찰에 성공해요.";
}

function allowRetryAfterWrongAnswer(question) {
  question.wrongAttempts = Math.max(0, Number(question.wrongAttempts) || 0) + 1;
  question.errorCount = Math.max(0, Number(question.errorCount) || 0) + 1;
  if (question.wrongAttempts < 2) {
    ui.answerReveal?.classList.add("is-hidden");
    question.answerBuffer = "";
    question.startedAtMs = performance.now();
    question.hintOffered = false;
    setQuestion(`틀렸어요. 다시 생각해보세요. ${question.text}`, "wrong");
    setFeedback("틀렸어요. 다시 생각해보세요.", "wrong");
    state.feedbackUntil = state.time + 1500;
    if (ui.answers.classList.contains("number-pad")) {
      renderNumberPad(question);
    } else if (Array.isArray(question.options)) {
      renderAnswers(question.options);
    }
    return true;
  }
  return false;
}

function answerQuestion(value) {
  if (!state.activeQuestion) return;
  const solvedQuestion = state.activeQuestion;
  if (solvedQuestion.resolved) return;
  const isCorrect = value === solvedQuestion.answer;
  if (!isCorrect && allowRetryAfterWrongAnswer(solvedQuestion)) return;
  solvedQuestion.resolved = true;
  if (isCorrect || solvedQuestion.wrongAttempts >= 2) showAnswerReveal(solvedQuestion.answer);

  if (solvedQuestion.kind === "plum-cat-subtraction") {
    const mission = state.plumMission;
    if (!mission) return;
    recordLearningAttempt(solvedQuestion, isCorrect);
    if (!isCorrect) mission.errorCount += 1;
    mission.answered = true;
    mission.completed = true;
    state.plumMissionActive = false;
    state.stars += isCorrect ? 2 : 1;
    const count = Math.max(0, Number(state.learningProfile.activityCounts.plum_wash) || 0);
    state.learningProfile.activityCounts.plum_wash = count + 1;
    saveLearningProfile();
    recordActivity({
      stamp: isCorrect ? "interleaving" : "embodied",
      title: isCorrect ? "자두 돌발 뺄셈 성공" : "자두 돌발 뺄셈 확인",
      detail: `${mission.target} - ${mission.stolen} = ${mission.answer}`,
      result: isCorrect ? "O" : "X",
    });
    completeTodayMission("plum");
    if (isCorrect) {
      setQuestion(`고양이가 가져가고 자두 ${mission.answer}개가 남았어요.`);
      setFeedback("맞았어요! 자두 돌발 뺄셈을 해결했어요.");
    } else {
      setQuestion(`틀렸어요. 정답은 ${mission.answer}개예요.`, "wrong");
      setFeedback(`대야에 남은 자두는 ${mission.answer}개예요. 함께 확인해요.`);
    }
    clearProblemSession();
    ui.questionPanel?.classList.add("is-hidden");
    syncHud();
    finishActivity("plum", `자두 ${mission.target}개 중 ${mission.stolen}개를 가져가서 ${mission.answer}개가 남았어요.`);
    return;
  }

  if (solvedQuestion.kind === "cat-snack-subtraction") {
    const catMission = state.catSnackMission;
    recordLearningAttempt(solvedQuestion, isCorrect);
    if (isCorrect) {
      state.stars += 2;
      recordActivity({
        stamp: "interleaving",
        title: `고양이 수박 뺄셈 ${catMission.grade}단계 완료`,
        detail: catMission.catStolen
          ? `${catMission.total} - ${catMission.eatenTarget} - ${catMission.catStolen} = ${catMission.answer}`
          : `${catMission.total} - ${catMission.eatenTarget} = ${catMission.answer}`,
        result: "O",
      });
      ui.question.textContent = `맞아요. 수박 ${catMission.answer}조각이 남았어요!`;
      ui.feedback.textContent = catMission.catStolen
        ? "먹은 수와 고양이가 가져간 수를 모두 잘 뺐어요. 별 2개!"
        : "먹은 뒤 남은 수를 잘 찾았어요. 별 2개!";
      if (state.catSnackMission) state.catSnackMission.answered = true;
      state.catSnackMissionActive = false;
      const activityCount = Math.max(0, Number(state.learningProfile.activityCounts.cat_subtraction) || 0);
      state.learningProfile.activityCounts.cat_subtraction = activityCount + 1;
      saveLearningProfile();
      syncHud();
      completeTodayMission("cat");
      state.feedbackUntil = state.time + 1800;
      clearProblemSession();
      ui.questionPanel?.classList.add("is-hidden");
      finishActivity("cat", `수박 ${catMission.total}조각 중 ${catMission.stolen}조각이 없어져서 ${catMission.answer}조각이 남았어요.`);
    } else {
      catMission.errorCount += 1;
      recordActivity({
        stamp: null,
        title: "고양이 수박 뺄셈 연습",
        detail: `수박 ${catMission.total}조각 중 ${catMission.stolen}조각이 없어져서 ${catMission.answer}조각이 남음`,
        result: "X",
      });
      if (state.catSnackMission) {
        state.catSnackMission.answered = true;
        state.catSnackMission.completed = true;
      }
      state.catSnackMissionActive = false;
      const activityCount = Math.max(0, Number(state.learningProfile.activityCounts.cat_subtraction) || 0);
      state.learningProfile.activityCounts.cat_subtraction = activityCount + 1;
      saveLearningProfile();
      completeTodayMission("cat");
      setQuestion(`틀렸어요. 정답은 ${catMission.answer}조각이에요.`, "wrong");
      setFeedback(`수박 ${catMission.total}조각 중 ${catMission.stolen}조각이 없어져서 ${catMission.answer}조각이 남아요. 같이 확인해요.`);
      clearProblemSession();
      ui.questionPanel?.classList.add("is-hidden");
      finishActivity("cat", `틀렸어요. 정답은 ${catMission.answer}조각이에요. 수박 ${catMission.total}조각 중 ${catMission.stolen}조각이 없어졌어요.`);
    }
    return;
  }

  if (solvedQuestion.kind === "stream-crayfish-addition" || solvedQuestion.kind === "stream-crayfish-subtraction") {
    const mission = state.streamCrayfishMission;
    if (!mission) return;
    recordLearningAttempt(solvedQuestion, isCorrect);
    if (!isCorrect) mission.errorCount += 1;
    mission.question = solvedQuestion;

    if (isCorrect) {
      setQuestion("맞아요. 가재를 조심히 관찰했어요!");
      setFeedback("가재가 그림일기에 기록됐어요. 별 2개!");
    } else {
      setQuestion(`틀렸어요. 정답은 ${solvedQuestion.answer}이에요.`, "wrong");
      setFeedback("가재는 발견했어요. 정답을 같이 확인하고 기록해요.", "wrong");
    }

    clearProblemSession();
    ui.questionPanel?.classList.add("is-hidden");
    showAnswerReveal(solvedQuestion.answer);
    finishStreamCrayfishMission(isCorrect);
    return;
  }

  if (solvedQuestion.kind === "stream-skipping-count" || solvedQuestion.kind === "stream-skipping-missing") {
    const mission = state.streamSkippingMission;
    if (!mission) return;
    recordLearningAttempt(solvedQuestion, isCorrect);
    if (!isCorrect) mission.errorCount += 1;
    mission.question = solvedQuestion;

    if (isCorrect) {
      setQuestion(solvedQuestion.kind === "stream-skipping-missing"
        ? `맞아요. ${solvedQuestion.answer}번 더 튀면 목표예요!`
        : `맞아요. 돌멩이가 ${solvedQuestion.answer}번 튀었어요!`);
      setFeedback(solvedQuestion.kind === "stream-skipping-missing"
        ? "현재 횟수와 목표 횟수의 차이를 잘 찾았어요. 별 2개!"
        : "물결을 하나씩 잘 세었어요. 별 2개!");
    } else {
      setQuestion(`틀렸어요. 정답은 ${solvedQuestion.answer}번이에요.`, "wrong");
      setFeedback(solvedQuestion.kind === "stream-skipping-missing"
        ? "목표 횟수에서 지금 튄 횟수를 빼서 같이 확인해요."
        : "물결 하나가 통통 한 번이에요. 같이 확인해요.", "wrong");
    }

    clearProblemSession();
    ui.questionPanel?.classList.add("is-hidden");
    finishStreamSkippingMission(isCorrect);
    return;
  }

  recordLearningAttempt(solvedQuestion, isCorrect);

  if (isCorrect) {
    const wasCollectionIncomplete = state.quests < QUEST_TARGET;
    solvedQuestion.target.caught = true;
    const caughtConfig = INSECT_CONFIG[solvedQuestion.target.type] || INSECT_CONFIG.butterfly;
    const isUniqueCatch = caughtConfig.rarity === "unique";
    state.stars += isUniqueCatch ? 3 : 1;
    state.bugs += 1;
    state.quests = Math.min(QUEST_TARGET, state.quests + 1);
    if (wasCollectionIncomplete && state.quests >= QUEST_TARGET) {
      state.collectionCompleteToastUntil = state.time + 3200;
    }
    const label = caughtConfig.label || "곤충";
    ui.feedback.textContent = isUniqueCatch
      ? `유니크 발견! ${label} 관찰 성공. 별 3개!`
      : `정답! ${label} 관찰 성공.`;
    state.collected[solvedQuestion.target.type] = true;
    state.dailyCaught[solvedQuestion.target.type] = true;
    saveGameProgress();
    recordQuestionActivity(solvedQuestion, true);
    updateSecretMission(solvedQuestion);
    if (state.quests >= QUEST_TARGET) {
      completeTodayMission("catch");
      finishActivity("catch", `곤충 ${QUEST_TARGET}마리를 관찰하고 숫자 문제를 모두 풀었어요.`);
    } else {
      maybeStartSecretMission();
    }
  } else {
    setQuestion(`틀렸어요. 정답은 ${solvedQuestion.answer}이에요.`, "wrong");
    setFeedback("괜찮아요. 정답을 보고 다음 문제로 넘어가요.");
    recordQuestionActivity(solvedQuestion, false);
  }

  state.feedbackUntil = state.time + 1600;
  clearProblemSession();
  ui.questionPanel?.classList.add("is-hidden");
  syncHud();

  const remaining = state.butterflies.some((butterfly) => !butterfly.caught);
  if (!remaining) {
    setTimeout(resetButterflies, 500);
  }

  if (state.quests >= QUEST_TARGET) {
    ui.question.textContent = "오늘 곤충 관찰 일지를 모두 채웠어요!";
  } else {
    ui.question.textContent = "다른 곤충도 찾아볼까요?";
  }
}

function recordQuestionActivity(question, correct) {
  const insectLabel = INSECT_CONFIG[question.target?.type]?.label || "곤충";

  if (question.kind === "badugi-subtraction") {
    recordActivity({
      stamp: correct ? "interleaving" : null,
      title: correct ? "바둑이 뺄셈 성공" : "바둑이 뺄셈 연습",
      detail: `${question.visual.total}개 중 ${question.visual.stolen}개를 가져감`,
      result: correct ? "O" : "X",
    });
    return;
  }

  if (question.kind === "subitize" || question.kind === "firefly-subitize") {
    recordActivity({
      stamp: correct ? "subitize" : null,
      title: correct ? "묶음 보기 성공" : "묶음 보기 연습",
      detail: question.kind === "firefly-subitize"
        ? `반딧불이 ${question.answer}마리`
        : `${question.visual.object.label} ${question.answer}개`,
      result: correct ? "O" : "X",
    });
    return;
  }

  recordActivity({
    stamp: null,
    title: correct ? `${insectLabel} 연산 성공` : `${insectLabel} 연산 연습`,
    detail: question.text,
    result: correct ? "O" : "X",
  });
}

function maybeStartSecretMission() {
  if (state.secretMission || state.quests < SECRET_MISSION_START) return;
  const todayHasInsectMission = !state.todayMission?.rounds?.length
    || state.todayMission.rounds.some((round) => round.action === "catch" && !round.completed);
  const remainingInsectsToday = QUEST_TARGET - state.quests;
  if (!todayHasInsectMission || remainingInsectsToday <= 0) return;
  if (Math.random() >= SECRET_MISSION_CHANCE) return;

  state.secretMission = {
    title: "비밀 미션",
    description: "할머니가 고른 곤충 1마리 더 관찰하기",
    kind: "insect-success",
    progress: 0,
    target: 1,
    completed: false,
  };
  showStoryMission("우리 동우가 곤충을 잘 찾는구나. 비밀 미션이야. 곤충 1마리만 더 차분히 관찰해볼까?", 4200);
  state.missionToastUntil = state.time + 3200;
  saveGameProgress();
}

function updateSecretMission(question) {
  if (!state.secretMission || state.secretMission.completed) return;

  if (state.secretMission.kind !== "insect-success") return;

  state.secretMission.progress = Math.min(state.secretMission.target, state.secretMission.progress + 1);

  if (state.secretMission.progress >= state.secretMission.target) {
    state.secretMission.completed = true;
    state.stars += 2;
    state.missionToastUntil = state.time + 4200;
    recordActivity({
      stamp: "mission",
      title: "비밀 미션 완료",
      detail: state.secretMission.description,
      result: "O",
    });
    ui.feedback.textContent = "비밀 미션 완료! 별 2개를 더 받았어요.";
    saveGameProgress();
  }
}

function update(delta) {
  state.time += delta;
  updateQuestionInputStages();

  if (state.scene === "wood") {
    updateWoodMission(delta);
    updatePlumMission(delta);
    updateSobanMission(delta);
  } else if (state.scene === "yard") {
    updateCatSnackMission(delta);
    if (state.dongwoo.actionUntil && state.time > state.dongwoo.actionUntil) {
      state.dongwoo.action = "idle";
      state.dongwoo.actionUntil = 0;
    }
  } else if (state.scene === "coop") {
    updateChickenCoopMission(delta);
    updateFlyGame(delta);
  } else if (state.scene === "insects") {
    const walkSpeed = 0.018 * delta;
    state.dongwoo.x += walkSpeed * state.dongwoo.facing;
    if (state.dongwoo.x > 1080) state.dongwoo.facing = -1;
    if (state.dongwoo.x < 160) state.dongwoo.facing = 1;

    if (state.dongwoo.actionUntil && state.time > state.dongwoo.actionUntil) {
      state.dongwoo.action = "walk";
      state.dongwoo.actionUntil = 0;
    }

    for (const butterfly of state.butterflies) {
      if (butterfly.caught) continue;
      updateInsectMotion(butterfly, delta);
    }

    separateInsects(delta);
  } else {
    if (state.dongwoo.actionUntil && state.time > state.dongwoo.actionUntil) {
      state.dongwoo.action = "idle";
      state.dongwoo.actionUntil = 0;
    }
  }

  if (state.feedbackUntil && state.time > state.feedbackUntil) {
    ui.feedback.textContent = "";
    state.feedbackUntil = 0;
  }

  if (state.storyUntil && state.time > state.storyUntil) {
    hideStoryPanel();
  }
}

function updateChickenCoopMission(delta) {
  if (!state.chickenCoopActive || !state.chickenCoopMission) return;

  const follow = Math.min(1, delta / 16);
  for (const egg of state.chickenCoopMission.eggs) {
    const speed = egg.id === state.draggingEggId ? 0.46 : 0.28;
    egg.x += (egg.targetX - egg.x) * speed * follow;
    egg.y += (egg.targetY - egg.y) * speed * follow;
  }

  state.chickenCoopMission.errors = state.chickenCoopMission.errors.filter((error) => state.time - error.start < 900);
}

function updateFlyGame(delta) {
  const mission = state.flyMission;
  const fly = mission?.fly;
  if (!mission || mission.completed || !fly) return;

  if (fly.mode === "caught") {
    if (state.time - fly.caughtAt >= 680) {
      if (mission.caught >= mission.target) completeFlyGame();
      else mission.fly = createFlyTarget(mission.grade);
    }
    return;
  }

  if (fly.mode === "perched") {
    if (state.time >= fly.modeUntil) {
      fly.mode = "flying";
      fly.modeUntil = state.time + randomBetween(1500, 2800);
      const speed = [0.10, 0.13, 0.16, 0.19][clamp(mission.grade, 1, 4) - 1];
      fly.vx = randomSignedVelocity(speed * 0.72, speed);
      fly.vy = randomSignedVelocity(speed * 0.42, speed * 0.7);
    }
    return;
  }

  fly.x += fly.vx * delta;
  fly.y += fly.vy * delta;
  if (fly.x < 535 || fly.x > 1180) {
    fly.x = clamp(fly.x, 535, 1180);
    fly.vx *= -1;
  }
  if (fly.y < 155 || fly.y > 470) {
    fly.y = clamp(fly.y, 155, 470);
    fly.vy *= -1;
  }

  if (state.time >= fly.modeUntil) {
    fly.mode = "perched";
    fly.modeUntil = state.time + randomBetween(620, 1050);
  }
}

function updateInsectMotion(insect, delta) {
  const config = INSECT_CONFIG[insect.type] || INSECT_CONFIG.butterfly;
  const speedScale = delta * 0.035;

  if (config.movement === "fly") {
    insect.turnAt -= delta;
    if (insect.turnAt <= 0) {
      insect.vx += randomSignedVelocity(0.08, 0.22) * config.speed;
      insect.vy += randomSignedVelocity(0.06, 0.18) * config.speed;
      insect.vx = clamp(insect.vx, -0.86 * config.speed, 0.86 * config.speed);
      insect.vy = clamp(insect.vy, -0.58 * config.speed, 0.58 * config.speed);
      insect.turnAt = randomBetween(420, 1300);
    }

    insect.x += insect.vx * speedScale;
    insect.y += insect.vy * speedScale;

    if (insect.x < insect.zone.x + 18 || insect.x > insect.zone.x + insect.zone.w - 18) {
      insect.vx *= -1;
      insect.x = clamp(insect.x, insect.zone.x + 18, insect.zone.x + insect.zone.w - 18);
    }
    if (insect.y < insect.zone.y + 14 || insect.y > insect.zone.y + insect.zone.h - 14) {
      insect.vy *= -1;
      insect.y = clamp(insect.y, insect.zone.y + 14, insect.zone.y + insect.zone.h - 14);
    }
    return;
  }

  insect.hopAt -= delta;
  if (config.movement === "hop" && insect.hopAt <= 0) {
    insect.vx = randomSignedVelocity(0.42, 0.82) * config.speed;
    insect.hopPower = randomBetween(13, 24);
    insect.hopAt = randomBetween(520, 1200);
  } else if (config.movement === "crawl" && insect.hopAt <= 0) {
    insect.vx = randomSignedVelocity(0.22, 0.52) * config.speed;
    insect.hopAt = randomBetween(800, 1800);
  }

  insect.x += insect.vx * speedScale;
  insect.y += Math.sin(state.time / 950 + insect.phase) * 0.05;

  if (insect.x < insect.zone.x + 20 || insect.x > insect.zone.x + insect.zone.w - 20) {
    insect.vx *= -1;
    insect.x = clamp(insect.x, insect.zone.x + 20, insect.zone.x + insect.zone.w - 20);
  }
  insect.y = clamp(insect.y, insect.zone.y + 18, insect.zone.y + insect.zone.h - 14);
}

function updateWoodMission(delta) {
  if (!state.woodMissionActive || !state.woodMission) return;

  const follow = Math.min(1, delta / 16);
  for (const piece of state.woodMission.pieces) {
    if (piece.placed) continue;
    const weight = piece.id === state.draggingWoodId ? piece.heavy : 0.22;
    piece.x += (piece.targetX - piece.x) * weight * follow;
    piece.y += (piece.targetY - piece.y) * weight * follow;
  }
}

function updatePlumMission(delta) {
  if (!state.plumMissionActive || !state.plumMission) return;

  const follow = Math.min(1, delta / 16);
  for (const plum of state.plumMission.plums) {
    const speed = plum.id === state.draggingPlumId ? 0.45 : 0.28;
    plum.x += (plum.targetX - plum.x) * speed * follow;
    plum.y += (plum.targetY - plum.y) * speed * follow;
  }

  state.plumMission.ripples = state.plumMission.ripples.filter((ripple) => state.time - ripple.start < 1050);

  const mission = state.plumMission;
  if (mission.phase === "cat_steal" && state.time - mission.catAt > 1650 && !mission.questionReady) {
    mission.questionReady = true;
    mission.phase = "question";
    const placed = mission.plums.filter((plum) => plum.placed).slice(-mission.stolen);
    placed.forEach((plum) => { plum.stolen = true; });
    beginProblemSession(makePlumCatQuestion(mission), {
      gameType: "plum_subtraction",
      affectsMastery: true,
      feedback: "고양이가 가져간 뒤 대야에 남은 자두 수를 입력해보세요.",
    });
  }
}

function updateSobanMission(delta) {
  if (!state.sobanMissionActive || !state.sobanMission) return;

  const follow = Math.min(1, delta / 16);
  for (const item of state.sobanMission.items) {
    const speed = item.id === state.draggingSobanId ? 0.44 : 0.26;
    item.x += (item.targetX - item.x) * speed * follow;
    item.y += (item.targetY - item.y) * speed * follow;
  }

  state.sobanMission.taps = state.sobanMission.taps.filter((tap) => state.time - tap.start < 720);
}

function updateCatSnackMission(delta) {
  if (!state.catSnackMissionActive || !state.catSnackMission) return;

  const mission = state.catSnackMission;
  if (mission.phase === "cat" && state.time - mission.catAt > 1300 && !mission.questionReady) {
    beginCatSnackQuestion(mission);
  }
}

function beginCatSnackQuestion(mission) {
  if (!mission || mission.questionReady) return;
  mission.phase = "question";
  mission.questionReady = true;
  mission.startedAtMs = performance.now();
  beginProblemSession(makeCatSnackQuestion(mission), {
    gameType: "cat_subtraction",
    affectsMastery: true,
    feedback: "남은 수박 조각 수를 숫자패드로 입력해보세요.",
  });
}

function catSnackPieceSlots(mission) {
  const total = mission?.pieces?.length || 0;
  const centerX = CAT_SNACK_PLATE.x + CAT_SNACK_PLATE.w / 2;
  const baseY = CAT_SNACK_PLATE.y + 96;
  const gap = total >= 5 ? 118 : 132;
  const startX = centerX - ((total - 1) * gap) / 2;
  return (mission?.pieces || []).map((piece, index) => {
    const rowOffset = total >= 5 && index % 2 === 1 ? 24 : 0;
    const x = startX + index * gap;
    const y = baseY + rowOffset;
    return {
      piece,
      x,
      y,
      angle: (index - (total - 1) / 2) * 0.055,
      width: total >= 5 ? 136 : 150,
      rect: { x: x - 76, y: y - 56, w: 152, h: 104 },
    };
  });
}

function handleCatSnackTap(event) {
  if (state.scene !== "yard" || !state.catSnackMissionActive || !state.catSnackMission) return false;
  const mission = state.catSnackMission;
  if (mission.phase !== "eating" || mission.questionReady) return false;
  const point = canvasPoint(event);
  const slots = catSnackPieceSlots(mission);
  const hit = [...slots].reverse().find(({ piece, rect }) => {
    if (piece.eaten || piece.stolen) return false;
    return pointInRect(point, rect);
  });
  if (!hit) return false;

  hit.piece.stage = Math.min(ASSETS.catSnack.watermelonBites.length - 1, hit.piece.stage + 1);
  mission.startTime = state.time;
  if (hit.piece.stage >= ASSETS.catSnack.watermelonBites.length - 1 && !hit.piece.eaten) {
    hit.piece.eaten = true;
    mission.eaten += 1;
  }

  if (mission.eaten < mission.eatenTarget) {
    ui.feedback.textContent = hit.piece.eaten
      ? `${mission.eaten}조각을 다 먹었어요. ${mission.eatenTarget - mission.eaten}조각 더 먹어볼까요?`
      : "한입 먹었어요. 같은 조각을 더 누르면 점점 줄어들어요.";
    state.feedbackUntil = state.time + 900;
  } else if (mission.catStolen > 0) {
    mission.phase = "cat";
    mission.catAt = state.time;
    const available = mission.pieces.filter((piece) => !piece.eaten && !piece.stolen).slice(0, mission.catStolen);
    available.forEach((piece) => {
      piece.stolen = true;
      piece.stage = ASSETS.catSnack.watermelonBites.length - 1;
    });
    ui.feedback.textContent = `앗! 고양이가 남은 수박 ${mission.catStolen}조각을 가져갔어요.`;
    state.feedbackUntil = state.time + 1300;
    playCatMeow();
  } else {
    ui.feedback.textContent = `${mission.eatenTarget}조각을 다 먹었어요. 이제 몇 조각 남았는지 생각해봐요.`;
    state.feedbackUntil = state.time + 1000;
    beginCatSnackQuestion(mission);
  }
  event.preventDefault();
  return true;
}

function handleStoreShoppingTap(event) {
  const mission = state.storeMission;
  if (state.scene !== "store" || !state.storeMissionActive || !mission || mission.completed) return false;
  const point = canvasPoint(event);

  if (mission.phase === "choose") {
    const snackHit = mission.snackZones.find((zone) => pointInRect(point, zone.rect));
    if (!snackHit) return false;

    if (snackHit.snack.id === mission.target.id) {
      mission.selectedSnackId = snackHit.snack.id;
      mission.phase = "pay";
      mission.wrongAttempts = 0;
      mission.notice = `${mission.target.label}을 골랐어요. 이제 ${mission.target.price}원을 맞춰요.`;
      mission.noticeTone = "normal";
      recordActivityInteraction(mission, "store_shopping", true);
      ui.question.textContent = `${mission.target.label}을 골랐어요. 이제 ${mission.target.price}원을 만들어 보세요.`;
      ui.feedback.textContent = "돈을 계산대의 ‘낸 돈’ 칸으로 끌어다 놓고 확인을 누르세요.";
      state.feedbackUntil = state.time + 1800;
    } else {
      mission.wrongAttempts += 1;
      mission.errorCount += 1;
      recordActivityInteraction(mission, "store_shopping", false, "wrong_item");
      if (mission.wrongAttempts >= 2) {
        mission.selectedSnackId = mission.target.id;
        mission.phase = "pay";
        mission.wrongAttempts = 0;
        mission.notice = `틀렸어요. 오늘 살 과자는 ${mission.target.label}이에요.`;
        mission.noticeTone = "wrong";
        setQuestion(`틀렸어요. 오늘 살 과자는 ${mission.target.label}이에요.`, "wrong");
        ui.feedback.textContent = `${mission.target.label} 값은 ${mission.target.price}원이에요. 이제 돈을 맞춰볼게요.`;
      } else {
        mission.notice = "틀렸어요. 다시 생각해보세요.";
        mission.noticeTone = "wrong";
        setQuestion("틀렸어요. 다시 생각해보세요.", "wrong");
        setFeedback(`할머니가 부탁한 과자 이름은 ${mission.target.label}이에요.`, "wrong");
      }
      state.feedbackUntil = state.time + 1800;
    }
    event.preventDefault();
    return true;
  }

  if (mission.phase === "pay") {
    const confirmRect = { x: 964, y: 610, w: 130, h: 54 };
    const removeRect = { x: 1106, y: 610, w: 130, h: 54 };
    if (pointInRect(point, removeRect)) {
      const removed = mission.paidItems.pop();
      if (removed) mission.paid = Math.max(0, mission.paid - removed.value);
      mission.notice = `하나 빼서 지금 ${mission.paid}원이에요.`;
      mission.noticeTone = "normal";
      ui.question.textContent = `${mission.target.label} 값은 ${mission.target.price}원. 지금 ${mission.paid}원을 냈어요.`;
      ui.feedback.textContent = "마지막에 낸 돈을 하나 뺐어요.";
      state.feedbackUntil = state.time + 1000;
      event.preventDefault();
      return true;
    }
    if (pointInRect(point, confirmRect)) {
      if (mission.paid === mission.target.price) {
        recordActivityInteraction(mission, "store_shopping", true);
        finishStoreShoppingMission(`${mission.target.label}을 고르고 ${mission.target.price}원을 정확히 냈어요.`);
      } else {
        mission.wrongAttempts += 1;
        mission.errorCount += 1;
        recordActivityInteraction(mission, "store_shopping", false, mission.paid > mission.target.price ? "overpay" : "underpay");
        if (mission.wrongAttempts >= 2) {
          setQuestion("틀렸어요. 정답을 같이 확인해볼게요.", "wrong");
          ui.feedback.textContent = `${mission.target.label}은 ${mission.target.price}원이에요. ${mission.target.price}원을 내면 딱 맞아요.`;
          showAnswerReveal(mission.target.price);
          finishStoreShoppingMission(`틀렸어요. 정답은 ${mission.target.price}원이에요. ${mission.target.label} 값을 함께 확인했어요.`);
        } else {
          mission.notice = "틀렸어요. 다시 생각해보세요.";
          mission.noticeTone = "wrong";
          setQuestion("틀렸어요. 다시 생각해보세요.", "wrong");
          setFeedback(`지금 낸 돈은 ${mission.paid}원이고, 필요한 돈은 ${mission.target.price}원이에요.`, "wrong");
        }
        state.feedbackUntil = state.time + 1800;
      }
      event.preventDefault();
      return true;
    }
  }

  return false;
}

function startStoreMoneyDrag(event) {
  const mission = state.storeMission;
  if (state.scene !== "store" || !state.storeMissionActive || !mission || mission.completed || mission.phase !== "pay") return false;
  const point = canvasPoint(event);
  const hit = [...mission.moneyZones].reverse().find((zone) => pointInRect(point, zone.rect));
  if (!hit) return false;

  const rect = storeMoneyDrawRect(hit.money, point);
  state.draggingStoreMoney = {
    money: hit.money,
    x: rect.x,
    y: rect.y,
    w: rect.w,
    h: rect.h,
    pointerOffsetX: rect.x - point.x,
    pointerOffsetY: rect.y - point.y,
  };
  mission.notice = `${hit.money.label}을 계산대로 끌어다 놓아요.`;
  mission.noticeTone = "normal";
  canvas.setPointerCapture?.(event.pointerId);
  event.preventDefault();
  return true;
}

function moveStoreMoneyDrag(event) {
  if (!state.draggingStoreMoney) return false;
  const point = canvasPoint(event);
  state.draggingStoreMoney.x = point.x + state.draggingStoreMoney.pointerOffsetX;
  state.draggingStoreMoney.y = point.y + state.draggingStoreMoney.pointerOffsetY;
  event.preventDefault();
  return true;
}

function endStoreMoneyDrag(event) {
  const mission = state.storeMission;
  const drag = state.draggingStoreMoney;
  if (!drag) return false;
  const point = canvasPoint(event);
  state.draggingStoreMoney = null;

  const center = { x: drag.x + drag.w / 2, y: drag.y + drag.h / 2 };
  if (mission && mission.phase === "pay" && (pointInRect(point, STORE_PAY_DROP_ZONE) || pointInRect(center, STORE_PAY_DROP_ZONE))) {
    addStorePayment(mission, drag.money);
  } else if (mission) {
    mission.notice = "계산대의 ‘낸 돈’ 칸에 놓아야 해요.";
    mission.noticeTone = "wrong";
    ui.feedback.textContent = "돈을 손으로 끌어서 오른쪽 아래 ‘낸 돈’ 칸에 놓아보세요.";
    state.feedbackUntil = state.time + 1400;
  }

  event.preventDefault();
  return true;
}

function handleStoreGachaTap(event) {
  const mission = state.storeGachaMission;
  if (state.scene !== "store" || !state.storeGachaActive || !mission || mission.completed) return false;
  const point = canvasPoint(event);

  if (mission.phase === "turn" && pointInRect(point, GACHA_HANDLE_BUTTON)) {
    mission.phase = "question";
    mission.capsules = 1;
    mission.notice = mission.questionMode === "change"
      ? "500원에서 500원을 썼어요. 남은 돈은 얼마일까요?"
      : mission.questionMode === "total_value"
      ? "100원 동전 5개를 넣었어요. 모두 얼마일까요?"
      : "100원 동전을 몇 개 넣었을까요?";
    ui.feedback.textContent = mission.notice;
    state.feedbackUntil = state.time + 1500;
    event.preventDefault();
    return true;
  }

  if (mission.phase === "question") {
    const hit = gachaAnswerZones(mission).find((zone) => pointInRect(point, zone.rect));
    if (!hit) return false;
    if (hit.value === mission.answer) {
      recordActivityInteraction(mission, "store_gacha", true);
      finishStoreGachaMission(mission.questionMode === "change"
        ? "500원 중 500원을 써서 0원이 남았어요."
        : mission.questionMode === "total_value"
        ? "100원 동전 5개는 모두 500원이에요."
        : "100원 동전 5개를 넣고 캡슐 1개를 뽑았어요.");
    } else {
      mission.wrongAttempts += 1;
      mission.errorCount += 1;
      recordActivityInteraction(mission, "store_gacha", false, "wrong_answer");
      if (mission.wrongAttempts >= 2) {
        mission.notice = `틀렸어요. 정답은 ${mission.answer}${mission.questionMode === "coin_count" ? "개" : "원"}예요.`;
        mission.noticeTone = "wrong";
        showAnswerReveal(mission.answer);
        finishStoreGachaMission(mission.notice);
      } else {
        mission.notice = "틀렸어요. 다시 생각해보세요.";
        mission.noticeTone = "wrong";
        ui.feedback.textContent = mission.notice;
        state.feedbackUntil = state.time + 1500;
      }
    }
    event.preventDefault();
    return true;
  }

  return false;
}

function resetGachaCoinPosition(mission) {
  if (!mission?.coin) return;
  mission.coin.x = mission.coin.homeX;
  mission.coin.y = mission.coin.homeY;
  mission.coin.offsetX = 0;
  mission.coin.offsetY = 0;
}

function gachaCoinRect(mission) {
  const coin = mission?.coin;
  if (!coin) return null;
  return { x: coin.x - 44, y: coin.y - 44, w: 88, h: 88 };
}

function startGachaCoinDrag(event) {
  const mission = state.storeGachaMission;
  if (state.scene !== "store" || !state.storeGachaActive || !mission || mission.completed || mission.phase !== "insert") return false;
  const point = canvasPoint(event);
  const rect = gachaCoinRect(mission);
  if (!rect || !pointInRect(point, rect)) return false;

  state.draggingGachaCoin = true;
  mission.coin.offsetX = mission.coin.x - point.x;
  mission.coin.offsetY = mission.coin.y - point.y;
  canvas.setPointerCapture?.(event.pointerId);
  event.preventDefault();
  return true;
}

function moveGachaCoinDrag(event) {
  const mission = state.storeGachaMission;
  if (!state.draggingGachaCoin || !mission?.coin) return false;
  const point = canvasPoint(event);
  mission.coin.x = point.x + mission.coin.offsetX;
  mission.coin.y = point.y + mission.coin.offsetY;
  event.preventDefault();
  return true;
}

function endGachaCoinDrag(event) {
  const mission = state.storeGachaMission;
  if (!state.draggingGachaCoin || !mission?.coin) return false;
  const point = canvasPoint(event);
  state.draggingGachaCoin = false;

  if (pointInRect(point, GACHA_COIN_SLOT) || pointInRect({ x: mission.coin.x, y: mission.coin.y }, GACHA_COIN_SLOT)) {
    mission.inserted += 1;
    recordActivityInteraction(mission, "store_gacha", true);
    resetGachaCoinPosition(mission);
    if (mission.inserted >= mission.pulls) {
      mission.phase = "turn";
      mission.notice = "동전을 다 넣었어요. 손잡이를 돌려보세요.";
    } else {
      mission.notice = `${mission.inserted}개 넣었어요. ${mission.pulls - mission.inserted}개 더 넣어요.`;
    }
    ui.feedback.textContent = mission.notice;
    state.feedbackUntil = state.time + 1200;
  } else {
    resetGachaCoinPosition(mission);
    mission.notice = "동전을 투입구까지 끌어 넣어보세요.";
    ui.feedback.textContent = mission.notice;
    state.feedbackUntil = state.time + 1000;
  }

  event.preventDefault();
  return true;
}

function separateInsects(delta) {
  const active = state.butterflies.filter((insect) => !insect.caught);
  const strength = Math.min(1, delta / 18);

  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i];
      const b = active[j];
      const aConfig = INSECT_CONFIG[a.type] || INSECT_CONFIG.butterfly;
      const bConfig = INSECT_CONFIG[b.type] || INSECT_CONFIG.butterfly;
      const minDistance = Math.max(96, (aConfig.width + bConfig.width) * 0.52);
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distance = Math.max(0.001, Math.hypot(dx, dy));

      if (distance >= minDistance) continue;

      const push = ((minDistance - distance) / 2) * strength;
      const nx = dx / distance;
      const ny = dy / distance;
      a.x -= nx * push;
      a.y -= ny * push;
      b.x += nx * push;
      b.y += ny * push;

      keepInZone(a);
      keepInZone(b);
    }
  }
}

function keepInZone(insect) {
  insect.x = clamp(insect.x, insect.zone.x + 28, insect.zone.x + insect.zone.w - 28);
  insect.y = clamp(insect.y, insect.zone.y + 24, insect.zone.y + insect.zone.h - 24);
}

function drawImageCover(image, x, y, width, height) {
  const scale = Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  ctx.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
}

function drawImageContain(image, x, y, width, height) {
  const scale = Math.min(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  ctx.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
}

function drawSoftSky() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#d9f1f7");
  gradient.addColorStop(0.62, "#fff7df");
  gradient.addColorStop(1, "#e6d0aa");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawBackground() {
  if (state.scene === "yard") {
    const yard = images.get(ASSETS.yard);
    if (yard) drawImageCover(yard, 0, 0, canvas.width, canvas.height);
    drawMainTitleUi();
    return;
  }

  if (state.scene === "wood") {
    const kitchen = images.get(ASSETS.kitchenMap);
    if (kitchen) {
      drawImageCover(kitchen, 0, 0, canvas.width, canvas.height);
    } else {
      drawSoftSky();
    }
    return;
  }

  if (state.scene === "coop") {
    drawChickenCoopBackground();
    return;
  }

  if (state.scene === "stream") {
    const stream = images.get(ASSETS.streamMap);
    if (stream) drawImageCover(stream, 0, 0, canvas.width, canvas.height);
    else drawSoftSky();
    return;
  }

  if (state.scene === "store") {
    const store = images.get(ASSETS.storeMap);
    if (store) drawImageCover(store, 0, 0, canvas.width, canvas.height);
    else drawSoftSky();
    return;
  }

  if (isFireflyNightEvent()) {
    drawFireflyNightBackground();
    return;
  }

  if (state.scene === "diary") {
    const yard = images.get(ASSETS.yard);
    if (yard) drawImageCover(yard, 0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(250, 239, 207, 0.66)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return;
  }

  drawSoftSky();
  ctx.fillStyle = "#f8edc9";
  ctx.fillRect(0, 525, canvas.width, 195);

  const map = images.get(ASSETS.insectMap);
  if (map) {
    drawImageContain(map, 24, 114, 1232, 520);
  }
}

function drawStreamCrayfishMission() {
  const mission = state.streamCrayfishMission;
  if (state.scene !== "stream" || !state.streamCrayfishActive || !mission) return;

  const water = images.get(ASSETS.streamCrayfish.water);
  const rock = images.get(ASSETS.streamCrayfish.rock);
  const crayfish = images.get(ASSETS.streamCrayfish.crayfish);

  ctx.save();
  ctx.fillStyle = "rgba(255, 249, 229, 0.82)";
  ctx.strokeStyle = "rgba(96, 71, 42, 0.22)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(82, 94, 1116, 552, 26);
  ctx.fill();
  ctx.stroke();

  if (water) {
    ctx.save();
    ctx.globalAlpha = 0.94;
    drawImageContain(water, STREAM_CRAYFISH_WATER_RECT.x, STREAM_CRAYFISH_WATER_RECT.y, STREAM_CRAYFISH_WATER_RECT.w, STREAM_CRAYFISH_WATER_RECT.h);
    ctx.restore();
  }

  mission.rocks.forEach((item) => {
    const wiggle = state.time < item.wiggleUntil ? Math.sin(state.time / 38) * 5 : 0;
    ctx.save();
    ctx.translate(item.x + item.w / 2 + wiggle, item.y + item.h / 2);
    ctx.rotate(item.angle || 0);
    ctx.shadowColor = "rgba(42, 54, 54, .22)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 6;
    if (rock) drawImageContain(rock, -item.w / 2, -item.h / 2, item.w, item.h);
    else {
      ctx.fillStyle = "#7c8177";
      ctx.beginPath();
      ctx.ellipse(0, 0, item.w / 2, item.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });

  if (mission.foundRockId !== null && crayfish) {
    const foundRock = mission.rocks.find((item) => item.id === mission.foundRockId) || mission.rocks[0];
    const pulse = 1 + Math.sin(state.time / 120) * 0.035;
    ctx.save();
    ctx.translate(foundRock.x + foundRock.w / 2 + 18, foundRock.y + foundRock.h + 36);
    ctx.scale(pulse, pulse);
    ctx.shadowColor = "rgba(68, 44, 25, .24)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 6;
    drawImageContain(crayfish, -118, -56, 236, 104);
    ctx.restore();
  }

  ctx.fillStyle = "rgba(255, 252, 238, .92)";
  ctx.strokeStyle = "rgba(96, 71, 42, .24)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(128, 126, 480, 76, 18);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = mission.noticeTone === "wrong" ? "#b92525" : "#3f5f30";
  ctx.font = "900 19px Malgun Gothic, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(mission.phase === "search" ? "바위를 눌러 살펴보세요" : "가재 발견!", 154, 158);
  ctx.fillStyle = "#5a422f";
  ctx.font = "800 15px Malgun Gothic, sans-serif";
  ctx.fillText(mission.notice, 154, 184);
  ctx.restore();
}

function drawSkippingRipple(x, y, scale = 1) {
  ctx.save();
  ctx.strokeStyle = "rgba(75, 151, 178, .58)";
  ctx.lineWidth = 3 * scale;
  for (let index = 0; index < 3; index += 1) {
    ctx.globalAlpha = 0.78 - index * 0.18;
    ctx.beginPath();
    ctx.ellipse(x, y, (32 + index * 18) * scale, (11 + index * 8) * scale, -0.08, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawStreamSkippingMission() {
  const mission = state.streamSkippingMission;
  if (state.scene !== "stream" || !state.streamSkippingActive || !mission) return;

  const stoneFlat = images.get(ASSETS.streamSkipping.stoneFlat);
  const stoneRound = images.get(ASSETS.streamSkipping.stoneRound);

  ctx.save();
  ctx.fillStyle = "rgba(255, 249, 229, 0.82)";
  ctx.strokeStyle = "rgba(96, 71, 42, 0.22)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(82, 94, 1116, 552, 26);
  ctx.fill();
  ctx.stroke();

  const water = STREAM_SKIPPING_WATER_RECT;
  const gradient = ctx.createLinearGradient(water.x, water.y, water.x + water.w, water.y + water.h);
  gradient.addColorStop(0, "rgba(166, 218, 226, .72)");
  gradient.addColorStop(0.55, "rgba(116, 190, 205, .68)");
  gradient.addColorStop(1, "rgba(93, 154, 166, .56)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(water.x, water.y, water.w, water.h, 32);
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,.45)";
  ctx.lineWidth = 3;
  for (let i = 0; i < 9; i += 1) {
    const y = water.y + 44 + i * 48 + Math.sin(state.time / 520 + i) * 5;
    ctx.beginPath();
    ctx.moveTo(water.x + 42, y);
    ctx.bezierCurveTo(water.x + 250, y - 22, water.x + 460, y + 28, water.x + 680, y - 6);
    ctx.bezierCurveTo(water.x + 812, y - 24, water.x + 920, y + 20, water.x + 972, y - 8);
    ctx.stroke();
  }

  if (mission.phase !== "ready") {
    const start = { x: 238, y: 508 };
    const step = { x: 138, y: -58 };
    ctx.save();
    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = "rgba(63, 49, 37, .72)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    for (let index = 1; index <= mission.bounces; index += 1) {
      ctx.lineTo(start.x + step.x * index, start.y + step.y * index);
    }
    ctx.stroke();
    ctx.restore();

    for (let index = 0; index < mission.bounces; index += 1) {
      const x = start.x + step.x * index;
      const y = start.y + step.y * index;
      drawSkippingRipple(x, y, index === 0 ? 0.92 : 0.82);
      ctx.fillStyle = "rgba(255, 252, 238, .92)";
      ctx.strokeStyle = "rgba(84, 62, 38, .25)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + 46, y - 28, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#4a6d88";
      ctx.font = "900 17px Malgun Gothic, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(String(index + 1), x + 46, y - 22);
    }

    if (mission.questionMode === "missing" && mission.targetBounces) {
      ctx.fillStyle = "rgba(255, 245, 204, .95)";
      ctx.strokeStyle = "rgba(128, 88, 36, .28)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(820, 142, 260, 86, 20);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#805824";
      ctx.font = "900 20px Malgun Gothic, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`목표 ${mission.targetBounces}번`, 950, 176);
      ctx.fillStyle = "#4f3b2a";
      ctx.font = "800 15px Malgun Gothic, sans-serif";
      ctx.fillText(`지금 ${mission.bounces}번 · 몇 번 더?`, 950, 204);
    }
  }

  mission.stones.forEach((stone) => {
    if (stone.used && mission.phase !== "ready") return;
    const image = stone.image === "stoneRound" ? stoneRound : stoneFlat;
    ctx.save();
    ctx.translate(stone.x + stone.w / 2, stone.y + stone.h / 2);
    ctx.rotate(stone.angle || 0);
    ctx.shadowColor = "rgba(42, 54, 54, .2)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 6;
    if (image) drawImageContain(image, -stone.w / 2, -stone.h / 2, stone.w, stone.h);
    else {
      ctx.fillStyle = "#9a8b73";
      ctx.beginPath();
      ctx.ellipse(0, 0, stone.w / 2, stone.h / 2, -0.1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });

  ctx.fillStyle = "rgba(255, 252, 238, .92)";
  ctx.strokeStyle = "rgba(96, 71, 42, .24)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(128, 126, 520, 78, 18);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = mission.noticeTone === "wrong" ? "#b92525" : "#3f5f30";
  ctx.font = "900 19px Malgun Gothic, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(mission.phase === "ready" ? "돌멩이를 눌러 던져보세요" : `${mission.bounces}번 통통!`, 154, 158);
  ctx.fillStyle = "#5a422f";
  ctx.font = "800 15px Malgun Gothic, sans-serif";
  ctx.fillText(mission.notice, 154, 184);
  ctx.restore();
}

function isFireflyNightEvent() {
  return state.scene === "insects"
    && state.activeQuestion?.visual?.mode === "firefly";
}

function drawFireflyNightBackground() {
  const nightMap = images.get(ASSETS.fireflyNightMap);
  if (nightMap) {
    drawImageCover(nightMap, 0, 0, canvas.width, canvas.height);
  } else {
    const night = ctx.createLinearGradient(0, 0, 0, canvas.height);
    night.addColorStop(0, "#253454");
    night.addColorStop(0.56, "#30445c");
    night.addColorStop(1, "#182a24");
    ctx.fillStyle = night;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.save();
  ctx.fillStyle = "rgba(4, 10, 26, 0.22)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(255, 245, 150, 0.68)";
  for (let i = 0; i < 26; i++) {
    const x = 80 + ((i * 173) % 1120);
    const y = 84 + ((i * 97) % 430);
    const pulse = 0.7 + Math.sin(state.time / 360 + i) * 0.28;
    ctx.shadowColor = "rgba(245, 255, 132, 0.78)";
    ctx.shadowBlur = 14 * pulse;
    ctx.beginPath();
    ctx.ellipse(x, y, 3.6 * pulse, 3.6 * pulse, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawMainTitleUi() {
  const logo = images.get(ASSETS.titleLogo);
  if (logo) {
    const width = 390;
    const height = logo.height * (width / logo.width);
    ctx.drawImage(logo, canvas.width / 2 - width / 2, 68, width, height);
  } else {
    ctx.fillStyle = "#5d3a23";
    ctx.font = "800 44px Malgun Gothic, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("동우의 여름방학", canvas.width / 2, 120);
  }

}

function drawButterflies() {
  if (state.scene !== "insects") return;

  for (const butterfly of state.butterflies) {
    if (butterfly.caught) continue;
    if (isFireflyNightEvent() && butterfly.type !== "firefly") continue;
    const frameSet = ASSETS[butterfly.type] || ASSETS.butterfly;
    const config = INSECT_CONFIG[butterfly.type] || INSECT_CONFIG.butterfly;
    const curatedFrames = config.frames || [0];
    const frameIndex = Math.floor(state.time / config.frameMs + butterfly.frameOffset) % curatedFrames.length;
    const frame = curatedFrames[frameIndex] % frameSet.length;
    const image = images.get(frameSet[frame]);
    if (!image) continue;
    const isFlying = config.movement === "fly";
    const isHopping = config.movement === "hop";
    const bob = isFlying ? Math.sin(state.time / 420 + butterfly.phase) * 7 : 0;
    const sway = isFlying ? Math.sin(state.time / 620 + butterfly.phase) * 5 : 0;
    const hop = isHopping
      ? Math.max(0, Math.sin((state.time + butterfly.phase * 100) / 150)) * butterfly.hopPower
      : 0;
    const flutter = isFlying ? 1 + Math.sin(state.time / 120 + butterfly.phase) * 0.025 : 1;
    const angle = isFlying
      ? Math.atan2(butterfly.vy, butterfly.vx) * 0.18
      : Math.sin(state.time / 520 + butterfly.phase) * 0.025;
    const boxWidth = config.width * flutter;
    const boxHeight = (config.height || config.width * 0.72) * flutter;
    const scale = Math.min(boxWidth / image.width, boxHeight / image.height);
    const width = image.width * scale;
    const height = image.height * scale;
    const facing = butterfly.vx < 0 ? -1 : 1;

    if (config.rarity === "unique") {
      ctx.save();
      const pulse = 1 + Math.sin(state.time / 240 + butterfly.phase) * 0.08;
      ctx.fillStyle = "rgba(255, 214, 80, 0.24)";
      ctx.strokeStyle = "rgba(255, 238, 154, 0.88)";
      ctx.lineWidth = 3;
      ctx.shadowColor = "rgba(255, 193, 45, 0.72)";
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.ellipse(
        butterfly.x + sway,
        butterfly.y + bob - hop,
        width * 0.64 * pulse,
        height * 0.62 * pulse,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    if (!isFlying) {
      ctx.save();
      ctx.fillStyle = "rgba(73, 52, 28, 0.18)";
      ctx.beginPath();
      ctx.ellipse(butterfly.x + sway, butterfly.y + height * 0.34, width * 0.34, height * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(butterfly.x + sway, butterfly.y + bob - hop);
    ctx.rotate(angle);
    ctx.scale(facing, 1);
    ctx.drawImage(image, -width / 2, -height / 2, width, height);
    ctx.restore();
  }
}

function drawChickenCoopBackground() {
  const coopMap = images.get(ASSETS.chickenCoopMap);
  const mission = state.chickenCoopMission;
  const flyMission = state.flyMission;
  const instruction = flyMission ? `잡은 파리 ${flyMission.caught}/${flyMission.target}`
    : !mission ? "오늘의 닭장 활동을 시작해요."
    : mission.mode === "observe_yellow" ? `노란 달걀 찾기 ${mission.placed.yellow}/${mission.targetTotal}`
    : mission.mode === "observe_blue" ? `파란 달걀 찾기 ${mission.placed.yellow}/${mission.targetTotal}`
    : mission.mode === "classify" ? `노랑 ${mission.rules.yellow.target_count}개 · 크림 ${mission.rules.cream.target_count}개 분류`
    : mission.mode === "split" ? `${mission.targetTotal}개를 두 바구니로 나누기`
    : `달걀 ${mission.targetTotal}개 담기`;
  const title = flyMission ? "눈으로 쫓아 톡! 파리 잡기"
    : !mission ? "오늘의 닭장 일"
    : mission.mode === "observe_yellow" ? "색을 보고 노란 달걀 찾기"
    : mission.mode === "observe_blue" ? "여러 색 중 파란 달걀 찾기"
    : mission.mode === "classify" ? "색깔별 달걀 배달"
    : "여러 가지로 수 가르기";
  const footer = flyMission ? "파리가 멈췄을 때 천천히 눌러도 괜찮아요."
    : !mission ? "달걀의 색과 차이를 살펴봐요."
    : mission.interactionMode === "tap_select" ? "조건에 맞는 달걀만 가볍게 눌러요."
    : mission.mode === "classify" ? "달걀을 같은 색 바구니로 끌어 옮겨요."
    : "정답은 여러 가지예요. 두 바구니를 모두 사용해요.";
  if (coopMap) {
    drawImageCover(coopMap, 0, 0, canvas.width, canvas.height);
    drawWatercolorPanel(34, 96, 460, 128, title, instruction, footer);
    return;
  }

  drawSoftSky();

  ctx.save();
  const ground = ctx.createLinearGradient(0, 360, 0, 720);
  ground.addColorStop(0, "#f8efd1");
  ground.addColorStop(1, "#dcc394");
  ctx.fillStyle = ground;
  ctx.fillRect(0, 392, canvas.width, 328);

  ctx.fillStyle = "rgba(172, 129, 70, 0.16)";
  for (let i = 0; i < 42; i++) {
    ctx.beginPath();
    ctx.ellipse(
      80 + (i * 83) % 1120,
      430 + ((i * 47) % 230),
      34 + (i % 4) * 9,
      8 + (i % 3) * 4,
      randomBetween(-0.4, 0.4),
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  drawCoopHouse(705, 132, 360, 250);
  drawNest(260, 360, 150, 76);
  drawNest(482, 345, 150, 76);
  drawWatercolorPanel(34, 96, 460, 128, title, instruction, footer);
  ctx.restore();
}

function drawChickenFamilyAmbience() {
  if (state.scene !== "coop") return;

  const slowStep = Math.floor(state.time / 760);
  const peckStep = Math.floor(state.time / 520);
  const family = ASSETS.chickenFamily;
  const chickStep = slowStep % 2 === 0 ? family.chickStand : family.chickWalk;
  const henStep = slowStep % 2 === 0 ? family.henStand : family.henWalk;
  const roosterStep = slowStep % 2 === 0 ? family.roosterStand : family.roosterWalk;

  drawGroundedSprite(roosterStep, 318, 510, 68, -1, 0.78);
  drawGroundedSprite(henStep, 690, 500, 58, 1, 0.68);
  drawGroundedSprite(peckStep % 2 === 0 ? family.henPeck : family.henStand, 1120, 500, 60, -1, 0.70);

  drawGroundedSprite(chickStep, 738, 508, 32, 1, 0.72);
  drawGroundedSprite(peckStep % 2 === 0 ? family.chickPeck : family.chickStand, 890, 514, 38, 1, 0.72);
  drawGroundedSprite(family.chickPair, 1018, 516, 56, -1, 0.74);
}

function drawGroundedSprite(src, x, baselineY, width, facing = 1, opacity = 1) {
  const image = images.get(src);
  if (!image) return;
  const height = image.height * (width / image.width);

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = "rgba(83, 58, 32, 0.15)";
  ctx.beginPath();
  ctx.ellipse(x, baselineY + 2, width * 0.34, Math.max(5, width * 0.07), 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(x, baselineY - height / 2);
  ctx.scale(facing, 1);
  ctx.drawImage(image, -width / 2, -height / 2, width, height);
  ctx.restore();
}

function drawCoopHouse(x, y, w, h) {
  ctx.save();
  ctx.fillStyle = "rgba(126, 75, 38, 0.18)";
  ctx.beginPath();
  ctx.roundRect(x + 24, y + 35, w - 48, h - 12, 12);
  ctx.fill();

  ctx.fillStyle = "#c97f4f";
  ctx.strokeStyle = "rgba(76, 47, 30, 0.42)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x + 48, y + 72, w - 96, h - 64, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#8c4c35";
  ctx.beginPath();
  ctx.moveTo(x + 28, y + 82);
  ctx.lineTo(x + w / 2, y + 8);
  ctx.lineTo(x + w - 28, y + 82);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#f4d19b";
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(x + 76 + i * 46, y + 118, 18, 112);
  }
  ctx.fillStyle = "#6b3d2b";
  ctx.beginPath();
  ctx.roundRect(x + w / 2 - 42, y + 154, 84, 104, 38);
  ctx.fill();
  ctx.restore();
}

function drawWatercolorPanel(x, y, w, h, title, body, footer = "천천히 살펴보고 시작해요.") {
  ctx.save();
  ctx.fillStyle = "rgba(255, 248, 226, 0.9)";
  ctx.strokeStyle = "rgba(96, 72, 43, 0.28)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#4c3826";
  ctx.font = "800 24px Malgun Gothic, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(title, x + 20, y + 40);
  ctx.font = "700 17px Malgun Gothic, sans-serif";
  ctx.fillText(body, x + 20, y + 74);
  ctx.fillStyle = "#6b7b3f";
  ctx.font = "700 14px Malgun Gothic, sans-serif";
  ctx.fillText(footer, x + 20, y + 102);
  ctx.restore();
}

function drawNest(x, y, w, h) {
  ctx.save();
  ctx.fillStyle = "rgba(125, 89, 47, 0.18)";
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h / 2 + 18, w / 2, h / 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(93, 63, 33, 0.45)";
  ctx.lineWidth = 5;
  for (let i = 0; i < 9; i++) {
    ctx.beginPath();
    ctx.arc(x + 18 + i * 14, y + 38 + Math.sin(i) * 8, 42, -0.1, Math.PI * 0.9);
    ctx.stroke();
  }
  ctx.restore();
}

function drawChickenCoopMission() {
  if (state.scene !== "coop" || !state.chickenCoopMission) return;
  const mission = state.chickenCoopMission;

  Object.entries(CHICKEN_COOP_ZONES).forEach(([color, zone]) => {
    const rule = mission.rules[color];
    if (rule.disabled) return;
    const count = mission.placed[color];
    const target = rule.target_count;
    const draggedEgg = mission.eggs.find((egg) => egg.id === state.draggingEggId);
    const acceptsEgg = draggedEgg && (rule.acceptAny || rule.color === draggedEgg.color);
    const isHover = Boolean(acceptsEgg && pointInRect({ x: draggedEgg.x, y: draggedEgg.y }, zone));
    drawEggBasket(zone, color, count, target, isHover, rule.label, mission.mode !== "split");
  });

  for (const egg of mission.eggs) {
    if (mission.interactionMode === "tap_select" && !egg.placed) {
      const pulse = 22 + Math.sin(state.time / 260 + egg.id) * 3;
      ctx.save();
      ctx.strokeStyle = "rgba(102, 139, 72, 0.42)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(egg.x, egg.y, pulse, pulse * 0.82, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    drawEggSprite(egg);
  }

  for (const error of mission.errors) {
    drawConfusedChick(error.x, error.y, state.time - error.start);
  }

  if (mission.completed) {
    drawCoopClearFx();
  }
}

function drawFlyGame() {
  const mission = state.flyMission;
  const fly = mission?.fly;
  if (state.scene !== "coop" || !mission || !fly) return;
  const sheet = images.get(ASSETS.chickenCoop.flySheet);
  if (!sheet) return;

  const cellW = sheet.width / 4;
  const cellH = sheet.height / 3;
  let row = 0;
  let column = (Math.floor(state.time / 115) + fly.frameSeed) % 4;
  if (fly.mode === "perched") {
    row = 2;
    column = (Math.floor(state.time / 260) + fly.frameSeed) % 3;
  } else if (fly.mode === "caught") {
    row = 1;
    column = clamp(Math.floor((state.time - fly.caughtAt) / 170), 0, 3);
  }

  const width = fly.mode === "caught" && column === 2 ? 132 : 104;
  const height = width * (cellH / cellW);
  ctx.save();
  if (fly.mode === "flying") {
    const pulse = 0.16 + Math.sin(state.time / 120) * 0.05;
    ctx.fillStyle = `rgba(255, 244, 174, ${pulse})`;
    ctx.beginPath();
    ctx.ellipse(fly.x, fly.y, 58, 42, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.translate(fly.x, fly.y);
  if (fly.vx < 0 && fly.mode === "flying") ctx.scale(-1, 1);
  ctx.drawImage(sheet, column * cellW, row * cellH, cellW, cellH, -width / 2, -height / 2, width, height);
  ctx.restore();

  ctx.save();
  ctx.fillStyle = "rgba(255, 248, 222, 0.9)";
  ctx.strokeStyle = "rgba(93, 67, 39, 0.3)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(1010, 92, 220, 62, 18);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#4b3928";
  ctx.font = "900 22px Malgun Gothic, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`잡은 파리 ${mission.caught} / ${mission.target}`, 1120, 131);
  ctx.restore();
}

function drawEggBasket(zone, color, count, target, isHover, labelText = zone.label, showTarget = true) {
  ctx.save();
  if (isHover) {
    ctx.fillStyle = color === "yellow" ? "rgba(226, 179, 75, 0.28)" : "rgba(236, 218, 177, 0.30)";
    ctx.beginPath();
    ctx.ellipse(zone.x + zone.w / 2, zone.y + zone.h / 2, zone.w * 0.62, zone.h * 0.52, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const basket = images.get(ASSETS.chickenCoop.nestEmpty) || images.get(ASSETS.chickenCoop.basketEmpty);
  if (basket) {
    drawImageContain(basket, zone.x + 8, zone.y + 46, zone.w - 16, zone.h - 16);
  } else {
    ctx.fillStyle = "rgba(153, 102, 50, 0.22)";
    ctx.beginPath();
    ctx.ellipse(zone.x + zone.w / 2, zone.y + zone.h - 22, zone.w / 2, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(93, 61, 31, 0.55)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(zone.x + 18, zone.y + 42, zone.w - 36, 70, 22);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(zone.x + zone.w / 2, zone.y + 54, 62, Math.PI, Math.PI * 2);
    ctx.stroke();
  }

  const label = showTarget ? `${labelText} ${count}/${target}` : `${labelText} ${count}개`;
  ctx.font = "800 17px Malgun Gothic, sans-serif";
  ctx.textAlign = "center";
  const labelWidth = ctx.measureText(label).width + 28;
  ctx.fillStyle = "rgba(255, 247, 219, 0.76)";
  ctx.strokeStyle = "rgba(107, 83, 49, 0.24)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(zone.x + zone.w / 2 - labelWidth / 2, zone.y + 10, labelWidth, 34, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#4a3727";
  ctx.fillText(label, zone.x + zone.w / 2, zone.y + 32);
  ctx.restore();
}

function drawEggSprite(egg) {
  ctx.save();
  ctx.translate(egg.x, egg.y);
  ctx.rotate(egg.angle);
  const eggImage = images.get(eggSpritePath(egg.color));
  if (eggImage) {
    const width = egg.placed ? 34 : 48;
    const height = eggImage.height * (width / eggImage.width);
    ctx.drawImage(eggImage, -width / 2, -height / 2, width, height);
    ctx.restore();
    return;
  }
  const palette = {
    yellow: ["#e6b85d", "#fff0a8"],
    cream: ["#ead9b4", "#fff8df"],
    blue: ["#96d4dc", "#e4fbff"],
  };
  const [base, highlight] = palette[egg.color] || palette.cream;
  const gradient = ctx.createRadialGradient(-10, -14, 4, 0, 0, 36);
  gradient.addColorStop(0, highlight);
  gradient.addColorStop(1, base);
  ctx.fillStyle = gradient;
  ctx.strokeStyle = "rgba(70, 48, 32, 0.42)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, 28, 36, 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function eggSpritePath(color) {
  if (color === "yellow") return ASSETS.chickenCoop.eggYellow;
  if (color === "cream") return ASSETS.chickenCoop.eggCream;
  if (color === "blue") return ASSETS.chickenCoop.eggBlue;
  return ASSETS.chickenCoop.eggCream;
}

function drawConfusedChick(x, y, age) {
  const lift = Math.min(24, age / 20);
  ctx.save();
  ctx.translate(x, y - lift);
  ctx.fillStyle = "rgba(255, 238, 164, 0.96)";
  ctx.strokeStyle = "rgba(97, 70, 34, 0.42)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, 26, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#c46b3c";
  ctx.beginPath();
  ctx.moveTo(23, -2);
  ctx.lineTo(42, 5);
  ctx.lineTo(23, 12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#3c3024";
  ctx.font = "900 25px Malgun Gothic, sans-serif";
  ctx.fillText("?", -7, -30);
  ctx.restore();
}

function drawCoopClearFx() {
  ctx.save();
  ctx.fillStyle = "rgba(255, 235, 155, 0.28)";
  for (let i = 0; i < 18; i++) {
    const x = 230 + (i * 61) % 780;
    const y = 160 + (i * 43) % 360;
    ctx.beginPath();
    ctx.ellipse(x, y, 9 + (i % 3) * 3, 4, i * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawDongwoo() {
  const action = state.dongwoo.action;
  const frames = DONGWOO_ANIMATION[action] || DONGWOO_ANIMATION.idle;
  const speed = action === "idle" ? 360 : action === "catch" ? 150 : 180;
  const index = Math.floor(state.time / speed) % frames.length;
  const image = images.get(frames[index]);
  if (!image) return;

  const width = image.width * state.dongwoo.scale;
  const height = image.height * state.dongwoo.scale;
  const x = state.dongwoo.x - width / 2;
  const y = state.dongwoo.y - height;

  ctx.save();
  if (state.dongwoo.facing < 0 && action !== "idle") {
    ctx.translate(state.dongwoo.x, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(image, -width / 2, y, width, height);
  } else {
    ctx.drawImage(image, x, y, width, height);
  }
  ctx.restore();
}

function drawSubitizePrompt() {
  const question = state.activeQuestion;
  if (!question) return;
  const needsVisualFromStart = question.kind === "subitize" || question.kind === "firefly-subitize";
  if (question.inputStage === "symbolic" && !needsVisualFromStart) return;
  if (question.inputStage === "concrete") {
    drawConcreteManipulationPrompt(question);
    return;
  }

  const visual = question.visual;
  if (!visual) {
    drawWatercolorHint(question);
    return;
  }

  if (visual.mode === "firefly") {
    drawFireflyNightSubitizePrompt(visual);
    return;
  }

  if (visual.mode === "badugi") {
    drawBadugiSubtractionPrompt(visual);
    return;
  }

  if (!Array.isArray(visual.positions)) {
    drawWatercolorHint(question);
    return;
  }

  const x = 410;
  const y = 128;
  const width = 460;
  const height = 250;

  ctx.save();
  ctx.fillStyle = "rgba(255, 250, 236, 0.94)";
  ctx.strokeStyle = "rgba(88, 63, 38, 0.28)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 18);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#4a3a2a";
  ctx.font = "800 24px Malgun Gothic, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("눈으로 먼저 묶어서 보기", x + width / 2, y + 42);

  ctx.fillStyle = "rgba(207, 225, 171, 0.38)";
  ctx.beginPath();
  ctx.ellipse(x + width / 2, y + 145, 160, 78, 0, 0, Math.PI * 2);
  ctx.fill();

  for (let index = 0; index < visual.positions.length; index++) {
    const [px, py] = visual.positions[index];
    const drawX = x + px * width;
    const drawY = y + 62 + py * (height - 92);
    drawSubitizeObject(visual.object, drawX, drawY, index);
  }

  ctx.fillStyle = "#6c5a42";
  ctx.font = "700 15px Malgun Gothic, sans-serif";
  ctx.fillText(
    visual.layout === "scattered" ? "흩어진 것도 묶음으로 모아 봐요" : "하나씩 세기 전에 한눈에 봐요",
    x + width / 2,
    y + height - 24
  );
  ctx.restore();
}

function drawWatercolorHint(question) {
  const pulse = 0.52 + Math.sin(state.time / 330) * 0.12;
  const x = 390;
  const y = 132;
  const width = 500;
  const height = 220;

  ctx.save();
  const wash = ctx.createRadialGradient(640, 236, 16, 640, 236, 238);
  wash.addColorStop(0, `rgba(222, 235, 175, ${0.62 + pulse * 0.15})`);
  wash.addColorStop(0.58, "rgba(198, 226, 213, 0.52)");
  wash.addColorStop(1, "rgba(255, 249, 229, 0.12)");
  ctx.fillStyle = wash;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 28);
  ctx.fill();

  ctx.fillStyle = "#493b2b";
  ctx.font = "900 27px Malgun Gothic, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(question.text, x + width / 2, y + 84);
  ctx.font = "700 18px Malgun Gothic, sans-serif";
  ctx.fillStyle = "#5e7250";
  ctx.fillText("식을 천천히 나누어 생각해봐요.", x + width / 2, y + 128);
  ctx.fillText("잠시 후 손으로 옮겨 볼 수 있어요.", x + width / 2, y + 160);
  ctx.restore();
}

function drawAdditionConcretePrompt(question, model) {
  const x = 296;
  const y = 104;
  const width = 684;
  const height = 292;

  ctx.save();
  ctx.fillStyle = "rgba(255, 250, 232, 0.96)";
  ctx.strokeStyle = "rgba(93, 67, 39, 0.32)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 20);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#493827";
  ctx.font = "900 21px Malgun Gothic, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`${model.operands[0]}개 바구니와 ${model.operands[1]}개 바구니를 합쳐지는 바구니로 옮겨요`, x + 22, y + 38);

  const groupColors = {
    yellow: ["rgba(246, 221, 155, 0.48)", "rgba(156, 111, 51, 0.5)"],
    blue: ["rgba(177, 220, 232, 0.48)", "rgba(67, 118, 135, 0.5)"],
  };
  for (const group of model.sourceGroups) {
    const colors = groupColors[group.color];
    ctx.fillStyle = colors[0];
    ctx.strokeStyle = colors[1];
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(group.x, group.y, group.w, group.h, 15);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#584735";
    ctx.font = "800 15px Malgun Gothic, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(group.label, group.x + group.w / 2, group.y + 27);
  }

  const target = model.target;
  ctx.fillStyle = "rgba(203, 225, 177, 0.48)";
  ctx.strokeStyle = "rgba(89, 119, 67, 0.58)";
  ctx.lineWidth = 3;
  ctx.setLineDash([9, 7]);
  ctx.beginPath();
  ctx.roundRect(target.x, target.y, target.w, target.h, 18);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#49603d";
  ctx.font = "800 15px Malgun Gothic, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("합쳐지는 바구니", target.x + target.w / 2, target.y + 27);
  ctx.font = "900 34px Malgun Gothic, sans-serif";
  ctx.fillText(`${model.collectedValue}`, target.x + target.w / 2, target.y + target.h - 18);

  for (const item of model.items) {
    ctx.save();
    ctx.translate(item.x, item.y);
    ctx.fillStyle = item.collected ? "#9fca6d" : item.group === 0 ? "#ddb85c" : "#75b7c8";
    ctx.strokeStyle = item.group === 0 ? "#765b34" : "#416f78";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 12, -0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

function drawUnitCounterItem(item, fill = "#ddb85c") {
  ctx.save();
  ctx.translate(item.x, item.y);
  ctx.fillStyle = fill;
  ctx.strokeStyle = "#765b34";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, 15, 13, -0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawSpecialConcretePrompt(question, model) {
  const x = 296;
  const y = 104;
  const width = 684;
  const height = 292;
  const isTakeAway = model.mode === "take_away";
  const removed = model.items.filter((item) => item.collected).length;
  const remaining = isTakeAway ? model.total - removed : model.collectedValue;

  ctx.save();
  ctx.fillStyle = "rgba(255, 250, 232, 0.96)";
  ctx.strokeStyle = "rgba(93, 67, 39, 0.32)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 20);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#493827";
  ctx.font = "900 21px Malgun Gothic, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(
    isTakeAway ? `${model.total}개에서 ${model.takeAway}개를 옆 상자로 빼보세요`
      : `${model.known}개가 있어요. ${model.total}개가 되도록 채워보세요`,
    x + 22,
    y + 38
  );

  const source = model.source;
  ctx.fillStyle = isTakeAway ? "rgba(246, 221, 155, 0.42)" : "rgba(177, 220, 232, 0.42)";
  ctx.strokeStyle = "rgba(118, 91, 52, 0.5)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(source.x, source.y, source.w, source.h, 15);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#584735";
  ctx.font = "800 15px Malgun Gothic, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(isTakeAway ? `남아 있는 수: ${remaining}` : `더 넣을 물체`, source.x + source.w / 2, source.y + 28);

  const target = model.target;
  ctx.fillStyle = isTakeAway ? "rgba(238, 190, 170, 0.38)" : "rgba(203, 225, 177, 0.46)";
  ctx.strokeStyle = isTakeAway ? "rgba(151, 87, 64, 0.58)" : "rgba(89, 119, 67, 0.58)";
  ctx.lineWidth = 3;
  ctx.setLineDash([9, 7]);
  ctx.beginPath();
  ctx.roundRect(target.x, target.y, target.w, target.h, 18);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = isTakeAway ? "#7c4c3b" : "#49603d";
  ctx.font = "800 15px Malgun Gothic, sans-serif";
  ctx.fillText(isTakeAway ? `가져간 수: ${removed}/${model.takeAway}` : `현재 수: ${remaining}/${model.total}`, target.x + target.w / 2, target.y + 28);

  if (!isTakeAway) {
    for (let index = 0; index < model.known; index += 1) {
      drawUnitCounterItem({
        x: target.x + 34 + (index % 6) * 38,
        y: target.y + 62 + Math.floor(index / 6) * 34,
      }, "#9fca6d");
    }
  }

  for (const item of model.items) {
    drawUnitCounterItem(item, item.collected ? (isTakeAway ? "#d69272" : "#9fca6d") : "#ddb85c");
  }
  ctx.restore();
}

function drawConcreteManipulationPrompt(question) {
  const model = question.concreteModel;
  if (!model) return;
  if (model.mode === "combine") {
    drawAdditionConcretePrompt(question, model);
    return;
  }
  if (model.mode === "take_away" || model.mode === "fill_missing") {
    drawSpecialConcretePrompt(question, model);
    return;
  }
  const x = 296;
  const y = 104;
  const width = 684;
  const height = 292;

  ctx.save();
  ctx.fillStyle = "rgba(255, 250, 232, 0.95)";
  ctx.strokeStyle = "rgba(93, 67, 39, 0.32)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 20);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#493827";
  ctx.font = "900 22px Malgun Gothic, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("묶음과 낱개를 바구니로 옮겨 세어 보기", x + 26, y + 40);

  const target = model.target;
  ctx.fillStyle = "rgba(203, 225, 177, 0.4)";
  ctx.strokeStyle = "rgba(89, 119, 67, 0.5)";
  ctx.lineWidth = 3;
  ctx.setLineDash([9, 7]);
  ctx.beginPath();
  ctx.roundRect(target.x, target.y, target.w, target.h, 18);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "#49603d";
  ctx.font = "800 16px Malgun Gothic, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("세기 바구니", target.x + target.w / 2, target.y + 30);
  ctx.font = "900 24px Malgun Gothic, sans-serif";
  ctx.fillText(`${model.collectedValue}`, target.x + target.w / 2, target.y + target.h - 20);

  for (const item of model.items) {
    ctx.save();
    ctx.translate(item.x, item.y);
    if (item.value === 10) {
      ctx.fillStyle = "#c9965d";
      ctx.strokeStyle = "#785335";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-29, -19, 58, 38, 9);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#fff6dc";
      ctx.font = "900 17px Malgun Gothic, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("10묶음", 0, 6);
    } else if (item.value === 1) {
      ctx.fillStyle = "#d8b769";
      ctx.strokeStyle = "#765b34";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 22, 18, -0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#5c492e";
      ctx.font = "900 15px Malgun Gothic, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("1", 0, 5);
    } else {
      ctx.fillStyle = "#f1dfb5";
      ctx.strokeStyle = "#765b34";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-27, -21, 54, 42, 9);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#5c492e";
      ctx.font = "900 21px Malgun Gothic, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("0", 0, 7);
    }
    ctx.restore();
  }

  ctx.restore();
}

function drawBadugiSubtractionPrompt(visual) {
  const x = 374;
  const y = 106;
  const width = 532;
  const height = 290;
  const run = Math.sin(state.time / 180) * 5;

  ctx.save();
  ctx.fillStyle = "rgba(255, 247, 224, 0.96)";
  ctx.strokeStyle = "rgba(94, 68, 39, 0.32)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 18);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#533c27";
  ctx.font = "800 24px Malgun Gothic, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("바둑이의 습격!", x + width / 2, y + 42);

  ctx.fillStyle = "rgba(209, 225, 171, 0.48)";
  ctx.beginPath();
  ctx.ellipse(x + 190, y + 204, 145, 48, 0, 0, Math.PI * 2);
  ctx.fill();

  drawCornBasket(x + 86, y + 130, visual.total, visual.stolen);
  drawBadugiDog(x + 350 + run, y + 166 - Math.abs(run * 0.45), visual.stolen);

  ctx.fillStyle = "#4b3a2a";
  ctx.font = "800 19px Malgun Gothic, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(
    `${visual.total}개 중 ${visual.stolen}개를 가져갔어요. 남은 옥수수는?`,
    x + width / 2,
    y + height - 30
  );
  ctx.restore();
}

function drawCornBasket(x, y, total, stolen) {
  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = "rgba(129, 91, 50, 0.28)";
  ctx.beginPath();
  ctx.ellipse(86, 96, 92, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(111, 73, 39, 0.7)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(86, 58, 68, Math.PI * 1.08, Math.PI * 1.92);
  ctx.stroke();

  ctx.fillStyle = "rgba(174, 121, 61, 0.92)";
  ctx.strokeStyle = "rgba(102, 65, 35, 0.72)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(16, 54, 140, 70, 16);
  ctx.fill();
  ctx.stroke();

  for (let index = 0; index < total; index++) {
    const row = index < 4 ? 0 : 1;
    const col = index % 4;
    const offsetX = 38 + col * 28 + (row ? 12 : 0);
    const offsetY = 34 + row * 25;
    const taken = index >= total - stolen;
    if (!taken) drawCorn(offsetX, offsetY, 1, false);
  }

  ctx.restore();
}

function drawCorn(x, y, scale = 1, inMouth = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(inMouth ? -0.12 : -0.35);
  ctx.scale(scale, scale);

  ctx.fillStyle = "#f2c85b";
  ctx.strokeStyle = "#9d7334";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, 11, 27, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = "rgba(151, 109, 42, 0.45)";
  ctx.lineWidth = 1;
  for (let line = -5; line <= 5; line += 5) {
    ctx.beginPath();
    ctx.moveTo(line, -18);
    ctx.lineTo(line * 0.4, 18);
    ctx.stroke();
  }

  ctx.fillStyle = "#86a95f";
  ctx.beginPath();
  ctx.ellipse(-9, 14, 6, 18, -0.6, 0, Math.PI * 2);
  ctx.ellipse(9, 12, 6, 18, 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBadugiDog(x, y, stolen) {
  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = "rgba(119, 86, 56, 0.22)";
  ctx.beginPath();
  ctx.ellipse(64, 82, 78, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#8b623f";
  ctx.strokeStyle = "#5d4028";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(52, 44, 46, 27, 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(103, 34, 24, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#6d4a31";
  ctx.beginPath();
  ctx.ellipse(90, 20, 8, 18, -0.5, 0, Math.PI * 2);
  ctx.ellipse(113, 18, 8, 18, 0.45, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#5d4028";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(14, 40);
  ctx.quadraticCurveTo(-12, 18, 8, 4);
  ctx.stroke();

  ctx.strokeStyle = "#5d4028";
  ctx.lineWidth = 5;
  for (const leg of [[28, 62, 18, 82], [54, 64, 48, 84], [76, 62, 84, 82], [92, 56, 105, 76]]) {
    ctx.beginPath();
    ctx.moveTo(leg[0], leg[1]);
    ctx.lineTo(leg[2], leg[3]);
    ctx.stroke();
  }

  ctx.fillStyle = "#2c231c";
  ctx.beginPath();
  ctx.arc(111, 31, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#3b2b20";
  ctx.beginPath();
  ctx.ellipse(128, 38, 7, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  const held = Math.min(4, stolen);
  for (let index = 0; index < held; index++) {
    drawCorn(140 + (index % 2) * 17, 38 + Math.floor(index / 2) * 15 + index * 2, 0.62, true);
  }

  ctx.restore();
}

function drawWoodMission() {
  if (state.scene !== "wood" || !state.woodMissionActive || !state.woodMission) return;

  drawFurnace();
  if (state.woodMission.completed) {
    drawFurnaceCompleteGlow();
  } else {
    drawFurnaceDropCue();
    drawInitialWoodInFurnace();
    drawWoodPile();
  }
  drawWoodMissionPanel();
}

function drawInitialWoodInFurnace() {
  const mission = state.woodMission;
  if (mission.mode !== "missing" || mission.initialValue <= 0) return;

  ctx.save();
  for (let index = 0; index < mission.initialValue; index++) {
    const x = FURNACE_ZONE.x + 48 + (index % 4) * 30;
    const y = FURNACE_ZONE.y + FURNACE_ZONE.h - 18 - Math.floor(index / 4) * 16;
    ctx.translate(x, y);
    ctx.rotate(index % 2 === 0 ? -0.12 : 0.14);
    ctx.fillStyle = "#8b5d35";
    ctx.strokeStyle = "#5d3d25";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-22, -6, 44, 12, 6);
    ctx.fill();
    ctx.stroke();
    ctx.rotate(index % 2 === 0 ? 0.12 : -0.14);
    ctx.translate(-x, -y);
  }
  ctx.restore();
}

function drawFurnaceCompleteGlow() {
  const centerX = FURNACE_ZONE.x + FURNACE_ZONE.w / 2;
  const centerY = FURNACE_ZONE.y + FURNACE_ZONE.h * 0.72;
  const pulse = 0.86 + Math.sin(state.time / 190) * 0.14;

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = `rgba(255, 156, 62, ${0.22 * pulse})`;
  ctx.shadowColor = "rgba(255, 174, 70, 0.78)";
  ctx.shadowBlur = 30 * pulse;
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, 70 * pulse, 36 * pulse, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFurnaceDropCue() {
  const { x, y, w, h } = FURNACE_ZONE;
  const pulse = 0.5 + Math.sin(state.time / 260) * 0.18;

  ctx.save();
  ctx.fillStyle = `rgba(255, 178, 74, ${0.13 + pulse * 0.08})`;
  ctx.strokeStyle = `rgba(255, 206, 95, ${0.34 + pulse * 0.18})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 24);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "rgba(255, 246, 203, 0.86)";
  ctx.font = "800 16px Malgun Gothic, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("여기에 넣기", x + w / 2, y - 12);
  ctx.restore();
}

function drawFurnace() {
  const { x, y, w, h } = FURNACE_ZONE;
  const image = images.get(ASSETS.woodFire.furnace);
  if (image) {
    drawImageContain(image, x - 74, y - 116, w + 148, h + 184);
    return;
  }

  ctx.save();
  ctx.fillStyle = "rgba(92, 61, 38, 0.18)";
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h + 34, 170, 32, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#b9885c";
  ctx.strokeStyle = "#6e4b31";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(x - 34, y + 48, w + 68, h + 38, 20);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#4b3125";
  ctx.beginPath();
  ctx.roundRect(x + 18, y + 82, w - 36, h - 14, 18);
  ctx.fill();

  const firePulse = Math.sin(state.time / 180) * 8;
  ctx.fillStyle = "rgba(255, 128, 52, 0.78)";
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + 130, 44 + firePulse, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255, 221, 86, 0.86)";
  ctx.beginPath();
  ctx.ellipse(x + w / 2 + 4, y + 126, 24, 26 + firePulse * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#575b5b";
  ctx.strokeStyle = "#333737";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + 36, 112, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#6b7272";
  ctx.beginPath();
  ctx.roundRect(x + 18, y - 22, w - 36, 54, 22);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#4b3a29";
  ctx.font = "800 18px Malgun Gothic, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("아궁이", x + w / 2, y + 74);
  ctx.restore();
}

function drawWoodPile() {
  const pieces = [...state.woodMission.pieces].sort((a, b) => {
    if (a.id === state.draggingWoodId) return 1;
    if (b.id === state.draggingWoodId) return -1;
    return a.id - b.id;
  });

  for (const piece of pieces) {
    drawWoodPiece(piece);
  }
}

function drawWoodPiece(piece) {
  ctx.save();
  ctx.translate(piece.x, piece.y);
  ctx.rotate(piece.angle + Math.sin(state.time / 520 + piece.id) * 0.015);
  ctx.scale(piece.lengthScale || 1, 1);
  ctx.globalAlpha = 1;

  const image = images.get(piece.sprite);
  if (image) {
    const width = piece.bundle ? 148 : 132;
    const height = image.height * (width / image.width);
    ctx.drawImage(image, -width / 2, -height / 2, width, height);
    ctx.restore();
    return;
  }

  ctx.fillStyle = "rgba(87, 58, 35, 0.2)";
  ctx.beginPath();
  ctx.ellipse(8, 22, 62, 13, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#8b5d35";
  ctx.strokeStyle = "#5d3d25";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-58, -17, 116, 34, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#b98552";
  ctx.beginPath();
  ctx.ellipse(-55, 0, 15, 17, 0, 0, Math.PI * 2);
  ctx.ellipse(55, 0, 15, 17, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = "rgba(70, 44, 25, 0.38)";
  ctx.lineWidth = 2;
  for (let line = -30; line <= 28; line += 20) {
    ctx.beginPath();
    ctx.moveTo(line, -12);
    ctx.quadraticCurveTo(line + 10, -2, line + 2, 12);
    ctx.stroke();
  }

  if (piece.bundle) {
    ctx.strokeStyle = "#e3c17b";
    ctx.lineWidth = 5;
    for (const tieX of [-24, 24]) {
      ctx.beginPath();
      ctx.moveTo(tieX, -20);
      ctx.lineTo(tieX, 20);
      ctx.stroke();
    }
    ctx.fillStyle = "#fff3c5";
    ctx.font = "900 15px Malgun Gothic, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("10묶음", 0, 5);
  }

  ctx.restore();
}

function drawWoodMissionPanel() {
  const mission = state.woodMission;
  const x = 34;
  const y = sideMissionPanelY();
  const w = 320;
  const h = 166;

  ctx.save();
  ctx.fillStyle = "rgba(255, 248, 222, 0.94)";
  ctx.strokeStyle = "rgba(93, 66, 39, 0.32)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#563b27";
  ctx.font = "800 20px Malgun Gothic, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(mission.completed ? "장작 미션 완료" : "장작을 아궁이에 넣기", x + 18, y + 33);

  ctx.font = "700 15px Malgun Gothic, sans-serif";
  ctx.fillStyle = "#5f4a34";
  const guide = mission.equationText;
  ctx.fillText(guide, x + 18, y + 62);

  const barX = x + 18;
  const barY = y + 80;
  const barW = w - 36;
  const ratio = clamp(mission.placed / mission.target, 0, 1);

  ctx.fillStyle = "rgba(122, 88, 52, 0.16)";
  ctx.beginPath();
  ctx.roundRect(barX, barY, barW, 16, 8);
  ctx.fill();
  ctx.fillStyle = mission.completed ? "#95bf5a" : "#e4a34f";
  if (mission.placed > 0) {
    ctx.beginPath();
    ctx.roundRect(barX, barY, Math.max(12, barW * ratio), 16, 8);
    ctx.fill();
  }

  ctx.fillStyle = "#4d3a29";
  ctx.font = "800 13px Malgun Gothic, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(`${mission.placed}/${mission.target}`, x + w - 18, y + 94);

  const zones = woodPanelButtonZones();
  ctx.font = "900 15px Malgun Gothic, sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(238, 218, 180, 0.96)";
  ctx.strokeStyle = "rgba(93, 66, 39, 0.34)";
  ctx.beginPath();
  ctx.roundRect(zones.remove.x, zones.remove.y, zones.remove.w, zones.remove.h, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#573f2a";
  ctx.fillText("하나 빼기", zones.remove.x + zones.remove.w / 2, zones.remove.y + 26);

  ctx.fillStyle = "rgba(201, 229, 169, 0.98)";
  ctx.beginPath();
  ctx.roundRect(zones.confirm.x, zones.confirm.y, zones.confirm.w, zones.confirm.h, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#405331";
  ctx.fillText("확인", zones.confirm.x + zones.confirm.w / 2, zones.confirm.y + 26);
  ctx.restore();
}

function drawPlumMission() {
  if (state.scene !== "wood" || !state.plumMissionActive || !state.plumMission) return;

  if (!state.plumMission.completed) {
    drawBasinDropCue();
  }
  drawBasin();
  if (!state.plumMission.completed) {
    drawInitialBasinPlums();
  }
  if (state.plumMission.completed) {
    drawCompletedBasinPlums();
  }
  if (!state.plumMission.completed) {
    drawPlumRipples();
  }
  if (!state.plumMission.completed) {
    drawPlums();
  }
  drawPlumCatSurprise();
  drawPlumMissionPanel();
}

function drawPlumCatSurprise() {
  const mission = state.plumMission;
  if (!mission || !["cat_steal", "question"].includes(mission.phase)) return;
  const image = images.get(ASSETS.catSnack.cat);
  const progress = clamp((state.time - mission.catAt) / 1500, 0, 1);
  const x = 1140 - progress * 360;
  const y = 430 - Math.sin(progress * Math.PI) * 34;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(-1, 1);
  if (image) {
    const width = 190;
    const height = image.height * (width / image.width);
    ctx.drawImage(image, -width / 2, -height / 2, width, height);
  } else {
    ctx.fillStyle = "#d8aa75";
    ctx.beginPath();
    ctx.ellipse(0, 0, 70, 34, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawInitialBasinPlums() {
  const mission = state.plumMission;
  if (mission.mode !== "missing" || mission.initialValue <= 0) return;
  const positions = [[712, 422], [770, 410], [828, 426], [738, 454]];

  for (let index = 0; index < mission.initialValue; index++) {
    const image = images.get(index % 2 === 0 ? ASSETS.plumWash.plumA : ASSETS.plumWash.plumB);
    if (!image) continue;
    const [x, y] = positions[index];
    const width = 40;
    const height = image.height * (width / image.width);
    ctx.drawImage(image, x - width / 2, y - height / 2, width, height);
  }
}

function drawBasinDropCue() {
  const { x, y, w, h } = BASIN_ZONE;
  const pulse = 0.5 + Math.sin(state.time / 280) * 0.18;

  ctx.save();
  ctx.fillStyle = `rgba(112, 190, 204, ${0.12 + pulse * 0.08})`;
  ctx.strokeStyle = `rgba(71, 157, 177, ${0.34 + pulse * 0.16})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 26);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "rgba(247, 255, 251, 0.9)";
  ctx.font = "800 16px Malgun Gothic, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("자두 넣기", x + w / 2, y - 12);
  ctx.restore();
}

function drawBasin() {
  const image = images.get(ASSETS.plumWash.basinEmpty);
  ctx.save();
  if (image) {
    ctx.drawImage(image, BASIN_ZONE.x - 16, BASIN_ZONE.y - 26, BASIN_ZONE.w + 36, BASIN_ZONE.h + 50);
  } else {
    ctx.fillStyle = "rgba(171, 220, 226, 0.82)";
    ctx.beginPath();
    ctx.ellipse(BASIN_ZONE.x + BASIN_ZONE.w / 2, BASIN_ZONE.y + BASIN_ZONE.h / 2, 148, 78, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCompletedBasinPlums() {
  const mission = state.plumMission;
  const positions = [
    [712, 422],
    [770, 410],
    [828, 426],
    [738, 454],
    [798, 456],
    [854, 448],
    [884, 470],
    [680, 474],
  ];

  ctx.save();
  const visibleCount = mission.initialValue + mission.plums.filter((plum) => plum.placed && !plum.stolen).length;
  for (let index = 0; index < visibleCount; index++) {
    const image = images.get(index % 2 === 0 ? ASSETS.plumWash.plumA : ASSETS.plumWash.plumB);
    if (!image) continue;
    const [x, y] = positions[index];
    const width = 42;
    const height = image.height * (width / image.width);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((index - mission.target / 2) * 0.05);
    ctx.drawImage(image, -width / 2, -height / 2, width, height);
    ctx.restore();
  }
  ctx.restore();
}

function drawPlumRipples() {
  const ripples = ASSETS.plumWash.ripple;
  for (const ripple of state.plumMission.ripples) {
    const age = state.time - ripple.start;
    const progress = clamp(age / 1050, 0, 1);
    const image = images.get(ripples[Math.min(ripples.length - 1, Math.floor(progress * ripples.length))]);

    ctx.save();
    ctx.globalAlpha = 1 - progress * 0.78;
    const size = 82 + progress * 72;
    if (image) {
      ctx.drawImage(image, ripple.x - size / 2, ripple.y - size / 2, size, size * 0.58);
    } else {
      ctx.strokeStyle = "rgba(84, 172, 187, 0.45)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(ripple.x, ripple.y, size / 2, size * 0.22, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawPlums() {
  const plums = [...state.plumMission.plums].sort((a, b) => {
    if (a.id === state.draggingPlumId) return 1;
    if (b.id === state.draggingPlumId) return -1;
    return a.placed - b.placed || a.id - b.id;
  });

  for (const plum of plums) {
    drawPlum(plum);
  }
}

function drawPlum(plum) {
  if (plum.stolen) return;
  const image = images.get(plum.sprite);
  const bob = plum.placed ? Math.sin(state.time / 360 + plum.id) * 2 : 0;

  ctx.save();
  ctx.translate(plum.x, plum.y + bob);
  ctx.rotate(plum.angle + Math.sin(state.time / 510 + plum.id) * 0.02);
  ctx.scale(plum.scale || 1, plum.scale || 1);
  ctx.fillStyle = "rgba(85, 58, 42, 0.16)";
  ctx.beginPath();
  ctx.ellipse(4, 32, 34, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  if (image) {
    const width = plum.placed ? 54 : 62;
    const height = image.height * (width / image.width);
    ctx.drawImage(image, -width / 2, -height / 2, width, height);
  } else {
    ctx.fillStyle = "#b64c45";
    ctx.beginPath();
    ctx.ellipse(0, 0, 26, 28, -0.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPlumMissionPanel() {
  const mission = state.plumMission;
  const x = 34;
  const y = sideMissionPanelY();
  const w = 330;
  const h = 124;
  const ratio = mission.placed / mission.target;

  ctx.save();
  ctx.fillStyle = "rgba(255, 250, 231, 0.94)";
  ctx.strokeStyle = "rgba(64, 129, 143, 0.28)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#4f3a2b";
  ctx.font = "800 20px Malgun Gothic, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(
    mission.completed ? "자두 씻기 완료" : "자두 씻기",
    x + 18,
    y + 34
  );

  ctx.font = "700 15px Malgun Gothic, sans-serif";
  ctx.fillStyle = "#5f4a34";
  const guide = mission.phase === "collect" ? `자두 ${mission.target}개를 세어 씻기`
    : mission.phase === "cat_steal" ? `앗! 고양이가 ${mission.stolen}개를 가져가요`
    : `${mission.target} - ${mission.stolen} = ?`;
  ctx.fillText(guide, x + 18, y + 64);

  ctx.fillStyle = "rgba(89, 161, 176, 0.16)";
  ctx.beginPath();
  ctx.roundRect(x + 18, y + 84, w - 36, 16, 8);
  ctx.fill();
  ctx.fillStyle = mission.completed ? "#8fbc5a" : "#68b7c5";
  if (mission.placed > 0) {
    ctx.beginPath();
    ctx.roundRect(x + 18, y + 84, Math.max(12, (w - 36) * ratio), 16, 8);
    ctx.fill();
  }

  ctx.fillStyle = "#4d3a29";
  ctx.font = "800 13px Malgun Gothic, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(`${mission.placed}/${mission.target}`, x + w - 18, y + 98);
  ctx.restore();
}

function drawSobanMission() {
  if (state.scene !== "wood" || !state.sobanMissionActive || !state.sobanMission) return;

  if (!state.sobanMission.completed) {
    drawSobanDropCue();
  }
  drawSobanTable();
  if (state.sobanMission.completed && state.sobanMission.familyCount < 4) {
    drawSobanItems();
  } else if (!state.sobanMission.completed) {
    drawSobanTaps();
    drawSobanItems();
  }
  drawSobanMissionPanel();
}

function drawSobanDropCue() {
  const { x, y, w, h } = SOBAN_ZONE;
  const pulse = 0.5 + Math.sin(state.time / 300) * 0.16;

  ctx.save();
  ctx.fillStyle = `rgba(176, 125, 68, ${0.10 + pulse * 0.07})`;
  ctx.strokeStyle = `rgba(136, 92, 48, ${0.30 + pulse * 0.16})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 24);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "rgba(255, 250, 231, 0.9)";
  ctx.font = "800 16px Malgun Gothic, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("소반 위에 놓기", x + w / 2, y - 12);
  ctx.restore();
}

function drawSobanTable() {
  const mission = state.sobanMission;
  const useFullImage = mission.completed && mission.familyCount === 4;
  const image = images.get(useFullImage ? ASSETS.soban.full : ASSETS.soban.empty);

  ctx.save();
  if (image) {
    ctx.drawImage(image, SOBAN_ZONE.x - 24, SOBAN_ZONE.y - 28, SOBAN_ZONE.w + 58, SOBAN_ZONE.h + 42);
  } else {
    ctx.fillStyle = "#b98552";
    ctx.strokeStyle = "#6d4a2f";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(SOBAN_ZONE.x + 24, SOBAN_ZONE.y + 34, SOBAN_ZONE.w - 48, SOBAN_ZONE.h - 72, 12);
    ctx.fill();
    ctx.stroke();
  }

  if (!mission.completed) {
    for (const item of mission.items) {
      if (item.placed || !item.guideSlot) continue;
      ctx.save();
      ctx.globalAlpha = 0.32;
      ctx.strokeStyle = item.kind === "bowl" ? "#6e5a43" : "#7a613e";
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 8]);
      if (item.kind === "bowl") {
        ctx.beginPath();
        ctx.ellipse(item.slotX, item.slotY, 34, 18, -0.08, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.translate(item.slotX, item.slotY);
        ctx.rotate(item.angle);
        ctx.beginPath();
        ctx.roundRect(-46, -6, 92, 12, 6);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
  ctx.restore();
}

function drawSobanTaps() {
  for (const tap of state.sobanMission.taps) {
    const age = state.time - tap.start;
    const progress = clamp(age / 720, 0, 1);
    ctx.save();
    ctx.globalAlpha = 1 - progress;
    ctx.strokeStyle = "rgba(125, 91, 52, 0.46)";
    ctx.lineWidth = 2;
    for (let index = 0; index < 4; index++) {
      const angle = index * Math.PI / 2 + progress * 0.4;
      const inner = 8 + progress * 8;
      const outer = 20 + progress * 18;
      ctx.beginPath();
      ctx.moveTo(tap.x + Math.cos(angle) * inner, tap.y + Math.sin(angle) * inner);
      ctx.lineTo(tap.x + Math.cos(angle) * outer, tap.y + Math.sin(angle) * outer);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawSobanItems() {
  const items = [...state.sobanMission.items].sort((a, b) => {
    if (a.id === state.draggingSobanId) return 1;
    if (b.id === state.draggingSobanId) return -1;
    return a.placed - b.placed || a.id.localeCompare(b.id);
  });

  for (const item of items) {
    drawSobanItem(item);
  }
}

function drawSobanItem(item) {
  const image = images.get(item.kind === "bowl" ? ASSETS.soban.bowl : ASSETS.soban.spoon);
  const width = item.kind === "bowl" ? (item.placed ? 58 : 68) : (item.placed ? 102 : 118);

  ctx.save();
  ctx.translate(item.x, item.y);
  ctx.rotate(item.angle + Math.sin(state.time / 520 + item.x) * 0.012);
  ctx.fillStyle = "rgba(83, 58, 35, 0.16)";
  ctx.beginPath();
  ctx.ellipse(4, item.kind === "bowl" ? 24 : 18, item.kind === "bowl" ? 30 : 50, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  if (image) {
    const height = image.height * (width / image.width);
    ctx.drawImage(image, -width / 2, -height / 2, width, height);
  } else if (item.kind === "bowl") {
    ctx.fillStyle = "#d7c7a6";
    ctx.beginPath();
    ctx.ellipse(0, 0, 32, 22, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = "#b48659";
    ctx.beginPath();
    ctx.roundRect(-56, -7, 112, 14, 7);
    ctx.fill();
  }
  ctx.restore();
}

function drawSobanMissionPanel() {
  const mission = state.sobanMission;
  const x = 34;
  const y = sideMissionPanelY();
  const w = 350;
  const h = 132;
  const completedSets = Math.min(mission.bowlsPlaced, mission.spoonsPlaced);

  ctx.save();
  ctx.fillStyle = "rgba(255, 250, 231, 0.94)";
  ctx.strokeStyle = "rgba(116, 82, 46, 0.28)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#4f3a2b";
  ctx.font = "800 20px Malgun Gothic, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(
    mission.completed ? "소반 차리기 완료" : `소반 ${mission.grade}단계 · 가족 ${mission.familyCount}명`,
    x + 18,
    y + 34
  );

  ctx.font = "700 15px Malgun Gothic, sans-serif";
  ctx.fillStyle = "#5f4a34";
  ctx.fillText(
    `밥그릇 ${mission.bowlsPlaced}/${mission.targetBowls}  숟가락 ${mission.spoonsPlaced}/${mission.targetSpoons}`,
    x + 18,
    y + 64
  );

  ctx.fillStyle = "rgba(132, 94, 56, 0.16)";
  ctx.beginPath();
  ctx.roundRect(x + 18, y + 88, w - 36, 16, 8);
  ctx.fill();
  ctx.fillStyle = mission.completed ? "#8fbc5a" : "#d9a456";
  ctx.beginPath();
  if (completedSets > 0) {
    ctx.roundRect(x + 18, y + 88, Math.max(12, (w - 36) * (completedSets / mission.familyCount)), 16, 8);
    ctx.fill();
  }

  ctx.fillStyle = "#4d3a29";
  ctx.font = "800 13px Malgun Gothic, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(`완성된 한 벌 ${completedSets}/${mission.familyCount}`, x + w - 18, y + 102);
  ctx.restore();
}

function drawCatSnackMission() {
  if (state.scene !== "yard" || !state.catSnackMissionActive || !state.catSnackMission) return;

  drawCatSnackPlate();
  drawCatSnackCat();
  drawCatSnackPanel();
}

function drawCatSnackPlate() {
  const mission = state.catSnackMission;
  const elapsed = state.time - mission.startTime;
  const removed = mission.eaten + (mission.phase === "cat" || mission.phase === "question" || mission.answered ? mission.catStolen : 0);
  const plate = images.get(ASSETS.catSnack.plate);

  ctx.save();
  if (plate) {
    ctx.drawImage(plate, CAT_SNACK_PLATE.x, CAT_SNACK_PLATE.y + 32, CAT_SNACK_PLATE.w, CAT_SNACK_PLATE.h);
  } else {
    ctx.fillStyle = "#a97855";
    ctx.beginPath();
    ctx.ellipse(CAT_SNACK_PLATE.x + 122, CAT_SNACK_PLATE.y + 94, 106, 42, 0, 0, Math.PI * 2);
      ctx.fill();
  }

  const pulse = mission.phase === "cat" ? Math.sin(elapsed / 75) * 3 : 0;
  catSnackPieceSlots(mission).forEach((slot) => {
    const piece = slot.piece;
    if (piece.stolen && mission.phase !== "cat") return;
    const image = images.get(ASSETS.catSnack.watermelonBites[piece.stage]) || images.get(ASSETS.watermelonSlice);
    ctx.save();
    ctx.globalAlpha = piece.stolen ? 0.3 : 1;
    ctx.translate(slot.x, slot.y + (piece.stolen ? pulse : 0));
    ctx.rotate(slot.angle);
    if (image) {
      const width = slot.width;
      const height = image.height * (width / image.width);
      ctx.drawImage(image, -width / 2, -height / 2, width, height);
    } else {
      ctx.fillStyle = "#d95b52";
      ctx.beginPath();
      ctx.ellipse(0, 0, slot.width / 2, 28, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (!piece.eaten && !piece.stolen && mission.phase === "eating") {
      ctx.strokeStyle = "rgba(255,255,255,.62)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(-slot.width / 2 - 4, -46, slot.width + 8, 94, 16);
      ctx.stroke();
    }
    ctx.restore();
  });

  ctx.fillStyle = "rgba(255,255,255,.78)";
  ctx.strokeStyle = "rgba(102,78,48,.22)";
  ctx.lineWidth = 2;
  for (let index = 0; index < mission.total; index++) {
    const cx = CAT_SNACK_PLATE.x + CAT_SNACK_PLATE.w / 2 - ((mission.total - 1) * 34) / 2 + index * 34;
    const cy = CAT_SNACK_PLATE.y + CAT_SNACK_PLATE.h - 24;
    ctx.beginPath();
    ctx.arc(cx, cy, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (index < removed) {
      ctx.fillStyle = "#d96656";
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.78)";
    }
  }
  ctx.restore();
}

function drawCatSnackCat() {
  const mission = state.catSnackMission;
  if (!mission.catStolen || !["cat", "question"].includes(mission.phase)) return;
  const elapsed = state.time - (mission.catAt || state.time);

  const image = images.get(ASSETS.catSnack.cat);
  const progress = clamp(elapsed / 1300, 0, 1);
  const x = 1125 - progress * 340;
  const y = 405 + Math.sin(progress * Math.PI) * -24;

  ctx.save();
  ctx.globalAlpha = mission.answered ? 0.45 : 1;
  ctx.translate(x, y);
  if (image) {
    const width = 210;
    const height = image.height * (width / image.width);
    // The source sprite faces right, while the cat approaches the plate to the left.
    ctx.scale(-1, 1);
    ctx.drawImage(image, -width / 2, -height / 2, width, height);
  } else {
    ctx.fillStyle = "#d8aa75";
    ctx.beginPath();
    ctx.ellipse(0, 0, 72, 34, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCatSnackPanel() {
  const mission = state.catSnackMission;
  const x = 34;
  const y = sideMissionPanelY();
  const w = 360;
  const h = 122;
  const removed = mission.eaten + (mission.phase === "cat" || mission.phase === "question" || mission.answered ? mission.catStolen : 0);
  const phaseText = mission.phase === "eating"
    ? `${mission.grade}단계 · ${mission.eaten}/${mission.eatenTarget}조각 먹었어요`
    : mission.phase === "cat"
    ? `고양이가 ${mission.catStolen}조각을 가져갔어요`
    : "남은 조각 수를 골라보세요";

  ctx.save();
  ctx.fillStyle = "rgba(255, 250, 231, 0.94)";
  ctx.strokeStyle = "rgba(126, 86, 45, 0.28)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#4f3a2b";
  ctx.font = "800 20px Malgun Gothic, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`수박 먹기 · ${mission.grade}단계`, x + 18, y + 34);

  ctx.font = "700 15px Malgun Gothic, sans-serif";
  ctx.fillStyle = "#5f4a34";
  ctx.fillText(phaseText, x + 18, y + 64);

  ctx.fillStyle = "rgba(255, 247, 216, .82)";
  ctx.strokeStyle = "rgba(97, 65, 34, .18)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x + 18, y + 76, 158, 32, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#4b3421";
  ctx.font = "900 13px Malgun Gothic, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("수박 조각을 눌러요", x + 97, y + 98);

  ctx.fillStyle = "rgba(132, 94, 56, 0.16)";
  ctx.beginPath();
  ctx.roundRect(x + 208, y + 84, w - 226, 16, 8);
  ctx.fill();
  ctx.fillStyle = mission.answered ? "#8fbc5a" : "#d98b62";
  ctx.beginPath();
  ctx.roundRect(x + 208, y + 84, (w - 226) * (removed / mission.total), 16, 8);
  ctx.fill();

  ctx.fillStyle = "#4d3a29";
  ctx.font = "800 13px Malgun Gothic, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(
    mission.catStolen
      ? `${mission.total} - ${mission.eatenTarget} - ${mission.catStolen} = ?`
      : `${mission.total} - ${mission.eatenTarget} = ?`,
    x + w - 18,
    y + 98
  );
  ctx.restore();
}

function drawSheetSprite(src, crop, x, y, w, h, radius = 16) {
  const image = images.get(src);
  ctx.save();
  ctx.fillStyle = "rgba(255, 253, 242, 0.92)";
  ctx.strokeStyle = "rgba(112, 80, 47, 0.22)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fill();
  ctx.stroke();
  if (image && crop) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x + 4, y + 4, w - 8, h - 8, Math.max(8, radius - 4));
    ctx.clip();
    ctx.drawImage(image, crop[0], crop[1], crop[2], crop[3], x + 6, y + 6, w - 12, h - 12);
    ctx.restore();
  }
  ctx.restore();
}

function drawSheetSpriteContain(src, crop, x, y, w, h, radius = 16) {
  const image = images.get(src);
  ctx.save();
  ctx.fillStyle = "rgba(255, 253, 242, 0.92)";
  ctx.strokeStyle = "rgba(112, 80, 47, 0.22)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fill();
  ctx.stroke();
  if (image && crop) {
    const [sx, sy, sw, sh] = crop;
    const padding = 8;
    const areaW = w - padding * 2;
    const areaH = h - padding * 2;
    const scale = Math.min(areaW / sw, areaH / sh);
    const drawW = sw * scale;
    const drawH = sh * scale;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x + 4, y + 4, w - 8, h - 8, Math.max(8, radius - 4));
    ctx.clip();
    ctx.drawImage(
      image,
      sx,
      sy,
      sw,
      sh,
      x + (w - drawW) / 2,
      y + (h - drawH) / 2,
      drawW,
      drawH
    );
    ctx.restore();
  }
  ctx.restore();
}

function drawStoreShoppingMission() {
  const mission = state.storeMission;
  if (state.scene !== "store" || !state.storeMissionActive || !mission) return;

  mission.snackZones = [];
  mission.moneyZones = [];

  ctx.save();
  ctx.fillStyle = "rgba(255, 249, 226, 0.9)";
  ctx.strokeStyle = "rgba(105, 72, 38, 0.28)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(58, 128, 1164, 518, 24);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#4b3424";
  ctx.font = "900 28px Malgun Gothic, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("슈퍼 심부름", 92, 176);
  drawStoreErrandNote(mission);

  drawStoreSnackShelf(mission);
  drawStoreMoneyCounter(mission);
  drawStoreDraggedMoney();
  ctx.restore();
}

function drawStoreErrandNote(mission) {
  ctx.save();
  ctx.fillStyle = "rgba(255, 253, 235, 0.96)";
  ctx.strokeStyle = "rgba(126, 90, 49, 0.3)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(300, 146, 560, 64, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#7a4f2e";
  ctx.font = "900 15px Malgun Gothic, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("할머니 부탁", 320, 170);
  ctx.fillStyle = "#3f2d20";
  ctx.font = "900 22px Malgun Gothic, sans-serif";
  ctx.fillText(`${mission.target.label} 1개`, 426, 172);
  ctx.fillStyle = "#6a5139";
  ctx.font = "800 17px Malgun Gothic, sans-serif";
  ctx.fillText(`${mission.target.price}원`, 426, 196);
  ctx.fillStyle = mission.noticeTone === "wrong" ? "#b92525" : "#3f5f30";
  ctx.font = "900 15px Malgun Gothic, sans-serif";
  ctx.fillText(mission.notice || "부탁받은 과자를 먼저 골라요.", 540, 196);
  ctx.restore();
}

function drawStoreSnackShelf(mission) {
  const startX = 96;
  const startY = 246;
  const cellW = 176;
  const cellH = 112;
  const gapX = 22;
  const gapY = 82;

  ctx.save();
  ctx.fillStyle = "rgba(137, 91, 50, 0.12)";
  ctx.beginPath();
  ctx.roundRect(82, 224, 804, 370, 18);
  ctx.fill();
  ctx.fillStyle = "#5d412b";
  ctx.font = "900 19px Malgun Gothic, sans-serif";
  ctx.fillText(mission.phase === "choose" ? "진열대에서 부탁받은 과자를 골라요" : "고른 과자", 104, 254);

  mission.options.forEach((snack, index) => {
    const x = startX + (index % 4) * (cellW + gapX);
    const y = startY + 22 + Math.floor(index / 4) * (cellH + gapY);
    const selected = mission.selectedSnackId === snack.id;

    drawSheetSpriteContain(ASSETS.storeShopping.snacks, snack.crop, x, y, cellW, cellH, 18);
    if (selected) {
      ctx.strokeStyle = "#73a95d";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.roundRect(x + 2, y + 2, cellW - 4, cellH - 4, 18);
      ctx.stroke();
    }

    ctx.fillStyle = selected ? "#2f6e30" : "#4b3424";
    ctx.font = "900 16px Malgun Gothic, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(snack.label, x + cellW / 2, y + cellH + 22);
    ctx.font = "800 15px Malgun Gothic, sans-serif";
    ctx.fillStyle = "#7a4f2e";
    ctx.fillText(`${snack.price}원`, x + cellW / 2, y + cellH + 42);

    mission.snackZones.push({ snack, rect: { x, y, w: cellW, h: cellH + 54 } });
  });
  ctx.restore();
}

function drawStoreMoneyCounter(mission) {
  const x = 904;
  const y = 174;
  const w = 278;
  const h = 418;

  ctx.save();
  ctx.fillStyle = "rgba(242, 226, 193, 0.78)";
  ctx.strokeStyle = "rgba(100, 70, 42, 0.25)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 18);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#4d3726";
  ctx.font = "900 19px Malgun Gothic, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("계산대", x + 18, y + 32);

  ctx.font = "800 16px Malgun Gothic, sans-serif";
  ctx.fillStyle = "#6b513a";
  const paidText = mission.phase === "choose"
    ? "과자를 먼저 골라요"
    : `낸 돈 ${mission.paid}원 / ${mission.target.price}원`;
  ctx.fillText(paidText, x + 18, y + 62);
  if (mission.phase === "pay") {
    ctx.font = "800 13px Malgun Gothic, sans-serif";
    ctx.fillStyle = "#8a6545";
    ctx.fillText("돈을 아래 ‘낸 돈’ 칸에 끌어 놓아요", x + 18, y + 82);
  }

  mission.moneyOptions.forEach((money, index) => {
    const row = Math.floor(index / 2);
    const col = index % 2;
    const bx = x + 18 + col * 124;
    const by = y + 94 + row * 122;
    const bw = money.shape === "bill" ? 228 : 104;
    const bh = money.shape === "bill" ? 90 : 96;
    const drawX = money.shape === "bill" ? x + 24 : bx;
    const drawY = money.shape === "bill" ? by : by;

    drawSheetSprite(ASSETS.storeShopping.money, money.crop, drawX, drawY, bw, bh, money.shape === "bill" ? 12 : 50);
    ctx.fillStyle = "#4b3424";
    ctx.font = "900 15px Malgun Gothic, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(money.label, drawX + bw / 2, drawY + bh + 22);
    mission.moneyZones.push({ money, rect: { x: drawX, y: drawY, w: bw, h: bh + 26 } });
  });

  drawStorePaidStack(mission, x + 28, y + 290, 220, 82);
  drawStoreButton(964, 610, 130, 54, "확인", "#8fbc5a");
  drawStoreButton(1106, 610, 130, 54, "하나 빼기", "#f1b681");
  ctx.restore();
}

function drawStorePaidStack(mission, x, y, w, h) {
  ctx.save();
  const drag = state.draggingStoreMoney;
  const dropCenter = drag ? { x: drag.x + drag.w / 2, y: drag.y + drag.h / 2 } : null;
  const hovering = Boolean(dropCenter && pointInRect(dropCenter, STORE_PAY_DROP_ZONE));
  ctx.fillStyle = hovering ? "rgba(232, 250, 209, 0.88)" : "rgba(255, 252, 238, 0.72)";
  ctx.strokeStyle = hovering ? "rgba(80, 130, 53, 0.58)" : "rgba(95, 68, 38, 0.18)";
  ctx.lineWidth = hovering ? 4 : 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 14);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#6d5038";
  ctx.font = "800 14px Malgun Gothic, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("낸 돈", x + 12, y + 24);
  ctx.font = "900 26px Malgun Gothic, sans-serif";
  ctx.fillStyle = mission.paid === mission.target.price ? "#3e7a33" : mission.paid > mission.target.price ? "#b92525" : "#4a3627";
  ctx.textAlign = "right";
  ctx.fillText(`${mission.paid}원`, x + w - 14, y + 58);
  ctx.restore();
}

function drawStoreDraggedMoney() {
  const drag = state.draggingStoreMoney;
  if (!drag?.money) return;
  ctx.save();
  ctx.globalAlpha = 0.96;
  ctx.shadowColor = "rgba(50, 32, 20, 0.28)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;
  drawSheetSprite(ASSETS.storeShopping.money, drag.money.crop, drag.x, drag.y, drag.w, drag.h, drag.money.shape === "bill" ? 12 : 50);
  ctx.restore();
}

function drawStoreButton(x, y, w, h, label, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = "rgba(93, 62, 32, .28)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 15);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#3b2a1d";
  ctx.font = "900 18px Malgun Gothic, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + w / 2, y + h / 2);
  ctx.restore();
}

function gachaAnswerZones(mission) {
  return mission.options.map((value, index) => ({
    value,
    rect: { x: 850 + (index % 2) * 150, y: 438 + Math.floor(index / 2) * 78, w: 128, h: 56 },
  }));
}

function drawStoreGachaMission() {
  const mission = state.storeGachaMission;
  if (state.scene !== "store" || !state.storeGachaActive || !mission) return;

  ctx.save();
  ctx.fillStyle = "rgba(255, 249, 226, 0.9)";
  ctx.strokeStyle = "rgba(105, 72, 38, 0.28)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(72, 112, 1136, 532, 24);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#4b3424";
  ctx.font = "900 30px Malgun Gothic, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("슈퍼 뽑기", 108, 158);
  ctx.fillStyle = mission.noticeTone === "wrong" ? "#b92525" : "#3f5f30";
  ctx.font = "900 18px Malgun Gothic, sans-serif";
  ctx.fillText(mission.notice, 108, 190);

  drawStoreGachaMachine(mission);
  drawStoreGachaControl(mission);
  drawStoreGachaResult(mission);
  ctx.restore();
}

function drawStoreGachaMachine(mission) {
  const bounce = mission.phase === "question" ? Math.sin(state.time / 90) * 4 : 0;
  const machineImage = images.get(ASSETS.storeGacha.machine);
  if (machineImage) {
    ctx.save();
    ctx.shadowColor = "rgba(83, 55, 25, .22)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 8;
    ctx.drawImage(machineImage, 454, 166 + bounce, 282, 430);
    ctx.restore();
  } else {
    drawSheetSpriteContain(ASSETS.storeGacha.sheet, GACHA_CROPS.machine, 444, 178 + bounce, 300, 380, 18);
  }

  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,.72)";
  ctx.strokeStyle = "rgba(93, 66, 38, .22)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(430, 586, 330, 34, 16);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#5b402b";
  ctx.font = "900 15px Malgun Gothic, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`넣은 동전 ${mission.inserted}/${mission.pulls}개`, 595, 608);
  ctx.restore();
}

function drawStoreGachaControl(mission) {
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,.72)";
  ctx.strokeStyle = "rgba(100, 70, 42, 0.24)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(104, 218, 270, 392, 20);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#4d3726";
  ctx.font = "900 19px Malgun Gothic, sans-serif";
  ctx.textAlign = "left";
  const moneyText = mission.questionMode === "change"
    ? "할머니가 준 500원 · 오늘 1회"
    : "100원 동전 5개 · 오늘 1회";
  ctx.fillText(moneyText, 126, 250);

  drawSheetSpriteContain(ASSETS.storeGacha.sheet, GACHA_CROPS.capsuleClosed, 132, 274, 206, 132, 20);

  ctx.fillStyle = mission.phase === "insert" ? "rgba(255, 237, 148, .58)" : "rgba(218, 211, 190, .58)";
  ctx.strokeStyle = mission.phase === "insert" ? "rgba(191, 130, 30, .74)" : "rgba(120, 100, 78, .35)";
  ctx.setLineDash(mission.phase === "insert" ? [8, 6] : []);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(GACHA_COIN_SLOT.x, GACHA_COIN_SLOT.y, GACHA_COIN_SLOT.w, GACHA_COIN_SLOT.h, 16);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#5b402b";
  ctx.font = "900 14px Malgun Gothic, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("투입구", GACHA_COIN_SLOT.x + GACHA_COIN_SLOT.w / 2, GACHA_COIN_SLOT.y - 10);

  if (mission.phase === "insert") {
    ctx.strokeStyle = "rgba(105, 81, 48, .28)";
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.moveTo(mission.coin.x + 46, mission.coin.y - 2);
    ctx.lineTo(GACHA_COIN_SLOT.x + GACHA_COIN_SLOT.w / 2 - 10, GACHA_COIN_SLOT.y + GACHA_COIN_SLOT.h / 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.fillStyle = "#6a5139";
  ctx.font = "800 16px Malgun Gothic, sans-serif";
  ctx.fillText("100원 동전을 끌어 넣어요", 239, 444);

  if (mission.phase === "turn") {
    drawStoreButton(GACHA_HANDLE_BUTTON.x, GACHA_HANDLE_BUTTON.y, GACHA_HANDLE_BUTTON.w, GACHA_HANDLE_BUTTON.h, "손잡이 돌리기", "#8fbc5a");
  } else {
    drawStoreButton(GACHA_HANDLE_BUTTON.x, GACHA_HANDLE_BUTTON.y, GACHA_HANDLE_BUTTON.w, GACHA_HANDLE_BUTTON.h, "손잡이", "#d7c7a6");
  }

  const coin = mission.coin || GACHA_COIN_HOME;
  ctx.shadowColor = "rgba(83, 55, 25, .24)";
  ctx.shadowBlur = state.draggingGachaCoin ? 16 : 6;
  ctx.shadowOffsetY = state.draggingGachaCoin ? 8 : 3;
  drawSheetSpriteContain(ASSETS.storeShopping.money, STORE_MONEY[0].crop, coin.x - 44, coin.y - 44, 88, 88, 44);
  ctx.shadowColor = "transparent";
  ctx.fillStyle = "#4d3726";
  ctx.font = "900 13px Malgun Gothic, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`${mission.pulls - mission.inserted}개 남음`, coin.x, coin.y + 62);
  ctx.restore();
}

function drawStoreGachaResult(mission) {
  ctx.save();
  ctx.fillStyle = "rgba(242, 226, 193, 0.78)";
  ctx.strokeStyle = "rgba(100, 70, 42, 0.25)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(812, 202, 346, 390, 18);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#4d3726";
  ctx.font = "900 20px Malgun Gothic, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("결과 확인", 840, 236);

  if (mission.phase === "question") {
    drawSheetSpriteContain(ASSETS.storeGacha.sheet, GACHA_CROPS.capsuleOut, 838, 258, 150, 104, 18);
    drawFigureCard(mission.rewardFigure, 996, 246, 132, 132, true);
  } else {
    ctx.fillStyle = "rgba(255,255,255,.74)";
    ctx.beginPath();
    ctx.roundRect(838, 258, 292, 100, 16);
    ctx.fill();
    ctx.fillStyle = "#6a5139";
    ctx.font = "800 16px Malgun Gothic, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("동전을 넣고 손잡이를 돌리면", 984, 300);
    ctx.fillText("캡슐이 나와요.", 984, 326);
  }

  if (mission.phase === "question") {
    ctx.fillStyle = "#4b3424";
    ctx.font = "900 17px Malgun Gothic, sans-serif";
    ctx.textAlign = "center";
    const question = mission.questionMode === "change"
      ? `남은 돈은 얼마일까요?`
      : mission.questionMode === "total_value"
      ? `100원 5개는 모두 얼마일까요?`
      : `100원 동전은 몇 개일까요?`;
    ctx.fillText(question, 985, 398);
    gachaAnswerZones(mission).forEach((zone) => {
      drawStoreButton(
        zone.rect.x,
        zone.rect.y,
        zone.rect.w,
        zone.rect.h,
        `${zone.value}${mission.questionMode === "coin_count" ? "개" : "원"}`,
        "#fff1b8"
      );
    });
  } else {
    ctx.fillStyle = "#6b513a";
    ctx.font = "800 16px Malgun Gothic, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("아직 문제가 나오지 않았어요.", 985, 430);
  }
  ctx.restore();
}

function drawFigureCard(figure, x, y, w, h, acquired = true) {
  const image = images.get(figure?.sheet === "sheet2" ? ASSETS.storeFigures.sheet2 : ASSETS.storeFigures.sheet);
  const compact = h < 90;
  const imageBottomPad = compact ? 24 : 42;
  const imageTop = compact ? 6 : 8;
  ctx.save();
  const isNew = figure?.rarity === "new";
  ctx.fillStyle = acquired
    ? (isNew ? "rgba(255, 246, 215, 0.98)" : "rgba(255, 252, 236, 0.96)")
    : "rgba(224, 217, 197, 0.72)";
  ctx.strokeStyle = acquired
    ? (isNew ? "rgba(210, 86, 48, 0.78)" : "rgba(105, 73, 40, 0.42)")
    : "rgba(116, 103, 82, 0.3)";
  ctx.lineWidth = acquired ? (isNew ? 4 : 3) : 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 14);
  ctx.fill();
  ctx.stroke();
  if (isNew && acquired) {
    ctx.fillStyle = "#c94d2f";
    ctx.beginPath();
    ctx.roundRect(x + 8, y + 8, 42, 20, 10);
    ctx.fill();
    ctx.fillStyle = "#fff6df";
    ctx.font = "900 10px Malgun Gothic, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("NEW", x + 29, y + 22);
  }
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x + 8, y + imageTop, w - 16, h - imageBottomPad, 10);
  ctx.clip();
  if (image && figure?.crop) {
    if (!acquired) ctx.filter = "grayscale(1) opacity(0.16)";
    ctx.drawImage(image, figure.crop[0], figure.crop[1], figure.crop[2], figure.crop[3], x + 8, y + imageTop, w - 16, h - imageBottomPad);
  }
  ctx.restore();
  if (!acquired) {
    ctx.fillStyle = "rgba(88, 78, 63, 0.72)";
    ctx.font = `900 ${compact ? 22 : 28}px Malgun Gothic, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("?", x + w / 2, y + (compact ? 42 : 62));
  }
  ctx.fillStyle = acquired ? "#413225" : "#776b5b";
  const labelText = acquired ? figure.label : "미수집";
  const labelSize = compact
    ? (labelText.length >= 7 ? 8.5 : 10)
    : (labelText.length >= 7 ? 10 : 12);
  ctx.font = `900 ${labelSize}px Malgun Gothic, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(labelText, x + w / 2, y + h - (compact ? 8 : 16));
  ctx.restore();
}

function drawDiaryScene() {
  if (state.scene !== "diary") return;

  ctx.save();
  const diaryBook = images.get(ASSETS.diaryBook);
  if (diaryBook) {
    // The source keeps transparent padding. Crop around the painted notebook so
    // the paper fills the diary scene without stretching its square proportions.
    ctx.drawImage(diaryBook, 400, 20, 920, 880, 150, 45, 780, 600);
  } else {
    ctx.fillStyle = "rgba(255, 248, 226, 0.92)";
    ctx.beginPath();
    ctx.roundRect(210, 70, 660, 530, 18);
    ctx.fill();
  }

  ctx.strokeStyle = "rgba(105, 74, 43, 0.24)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(540, 142);
  ctx.lineTo(540, 548);
  ctx.stroke();

  ctx.fillStyle = "#4d3927";
  ctx.font = "800 34px Malgun Gothic, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(state.diaryView === "guide" ? "여름방학 곤충 도감" : "동우의 그림일기", 540, 126);

  if (state.diaryView === "guide") {
    drawInsectFieldGuide();
    if ((state.guidePage || 0) === 1) drawFigureFieldGuide();
  } else {
    drawDiaryIllustration(246, 166, 262, 350);
    drawDiaryLog(566, 168, 250);
  }

  ctx.fillStyle = "#6b5a43";
  ctx.font = "700 16px Malgun Gothic, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(
    state.diaryView === "guide" ? "뒷뜰에서 만난 곤충 카드가 한 장씩 채워져요." : "오늘 한 활동 중 한 장면이 그림일기로 남아요.",
    540,
    566
  );
  ctx.restore();
}

function drawDiaryIllustration(x, y, width, height) {
  const entry = currentDiaryHighlight();
  ctx.save();
  ctx.fillStyle = "#4d3927";
  ctx.font = "800 20px Malgun Gothic, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("오늘의 그림 한 장", x, y);
  ctx.fillStyle = "#8b765b";
  ctx.font = "800 12px Malgun Gothic, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(koreanDiaryDate(), x + width, y);

  if (!entry) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.42)";
    ctx.strokeStyle = "rgba(102, 75, 45, 0.22)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y + 18, width, 230, 13);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#806f5a";
    ctx.font = "800 16px Malgun Gothic, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("활동을 마치면", x + width / 2, y + 120);
    ctx.fillText("여기에 오늘 그림이 생겨요.", x + width / 2, y + 146);
    ctx.restore();
    return;
  }

  const image = images.get(entry.image);
  const imageY = y + 26;
  ctx.fillStyle = "rgba(255, 255, 255, 0.68)";
  ctx.strokeStyle = "rgba(102, 75, 45, 0.34)";
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.roundRect(x, imageY, width, 190, 13);
  ctx.fill();
  ctx.stroke();
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x + 7, imageY + 7, width - 14, 176, 9);
  ctx.clip();
  if (image) drawImageCover(image, x + 7, imageY + 7, width - 14, 176);
  ctx.restore();

  ctx.fillStyle = "#433326";
  ctx.font = "800 16px Malgun Gothic, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(entry.title, x, imageY + 224);

  ctx.fillStyle = "#74624d";
  ctx.font = "700 13px Malgun Gothic, sans-serif";
  const words = entry.caption.split(" ");
  let line = "";
  let lineY = imageY + 248;
  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > width && line) {
      ctx.fillText(line, x, lineY);
      line = word;
      lineY += 18;
    } else {
      line = next;
    }
  });
  if (line) ctx.fillText(line, x, lineY);

  ctx.fillStyle = "#574534";
  ctx.font = "700 14px Malgun Gothic, sans-serif";
  const diaryWords = (entry.diaryText || entry.caption).split(" ");
  line = "";
  lineY += 28;
  diaryWords.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > width && line) {
      ctx.fillText(line, x, lineY);
      line = word;
      lineY += 19;
    } else {
      line = next;
    }
  });
  if (line) ctx.fillText(line, x, lineY);

  const sticker = state.latestPraiseSticker ? images.get(ASSETS.praiseStickers[state.latestPraiseSticker]) : null;
  if (sticker) {
    drawImageContain(sticker, x + width - 62, y + height - 64, 58, 58);
  }

  const count = Object.keys(state.diaryIllustrations || {}).length;
  ctx.fillStyle = "#899c5b";
  ctx.font = "800 12px Malgun Gothic, sans-serif";
  ctx.fillText(`오늘 그림 ${count}장 · 오늘기록을 누르면 다른 그림도 볼 수 있어요`, x, y + height - 8);
  ctx.restore();
}

function drawInsectFieldGuide() {
  const page = clamp(state.guidePage || 0, 0, 1);
  const pageCards = page === 0 ? FIELD_GUIDE_CARDS.slice(0, 10) : FIELD_GUIDE_CARDS.slice(10);
  const positions = page === 0
    ? pageCards.map((_, index) => [176 + (index % 5) * 145, 166 + Math.floor(index / 5) * 184])
    : pageCards.map((_, index) => [205, 172 + index * 126]);
  const acquiredCount = FIELD_GUIDE_CARDS.filter((card) => state.collected[card.type]).length;

  ctx.fillStyle = "#6a7e49";
  ctx.font = "800 16px Malgun Gothic, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`습득한 생물 ${acquiredCount} / ${FIELD_GUIDE_CARDS.length} · ${page + 1} / 2쪽`, 540, 153);

  pageCards.forEach((card, index) => {
    const [x, y] = positions[index];
    const isUnique = card.rarity === "unique";
    const w = page === 0 ? 130 : 170;
    const h = page === 0 ? 168 : 112;
    const imageHeight = page === 0 ? 98 : 60;
    const acquired = Boolean(state.collected[card.type]);
    const image = images.get(card.image);
    const imageY = y + (isUnique ? (page === 0 ? 39 : 34) : 8);
    const questionY = page === 0 ? 69 : 65;
    const labelY = page === 0 ? 130 : 88;
    const statusY = page === 0 ? 153 : 104;

    ctx.save();
    ctx.fillStyle = isUnique
      ? (acquired ? "rgba(255, 248, 202, 0.98)" : "rgba(231, 220, 181, 0.82)")
      : (acquired ? "rgba(255, 252, 236, 0.96)" : "rgba(224, 217, 197, 0.72)");
    ctx.strokeStyle = isUnique ? "rgba(207, 145, 24, 0.9)" : (acquired ? "rgba(102, 78, 45, 0.48)" : "rgba(116, 103, 82, 0.3)");
    ctx.lineWidth = isUnique ? 5 : (acquired ? 3 : 2);
    if (isUnique) {
      ctx.shadowColor = "rgba(255, 190, 35, 0.5)";
      ctx.shadowBlur = acquired ? 18 : 8;
    }
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 13);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    if (isUnique) {
      ctx.fillStyle = acquired ? "#c58a12" : "#9b8656";
      ctx.beginPath();
      ctx.roundRect(x + 12, y + 10, 84, 24, 12);
      ctx.fill();
      ctx.fillStyle = "#fff8d5";
      ctx.font = "900 12px Malgun Gothic, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("★ 유니크", x + 54, y + 27);
    }

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x + 8, imageY, w - 16, imageHeight, 9);
    ctx.clip();
    if (image) {
      if (!acquired) {
        ctx.filter = "grayscale(1) opacity(0.14)";
      }
      drawImageContain(image, x + 8, imageY, w - 16, imageHeight);
    }
    ctx.restore();

    if (!acquired) {
      ctx.fillStyle = "rgba(88, 78, 63, 0.72)";
      ctx.font = "900 36px Malgun Gothic, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("?", x + w / 2, y + questionY);
    }

    ctx.fillStyle = acquired ? "#413225" : "#776b5b";
    ctx.font = "900 15px Malgun Gothic, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(acquired ? card.label : (isUnique ? "아주 희귀한 생물" : "아직 못 만남"), x + w / 2, y + labelY);

    ctx.fillStyle = acquired ? "#76934f" : "#a39a89";
    ctx.font = "800 12px Malgun Gothic, sans-serif";
    ctx.fillText(acquired ? (isUnique ? "유니크 발견" : "발견 완료") : "미발견", x + w / 2, y + statusY);
    ctx.restore();
  });
}

function drawFigureFieldGuide() {
  const acquiredCount = GACHA_FIGURES.filter((figure) => state.figureCollection[figure.id]).length;
  const x = 558;
  const y = 166;

  ctx.save();
  ctx.fillStyle = "rgba(255, 248, 226, 0.66)";
  ctx.strokeStyle = "rgba(108, 78, 45, 0.18)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - 18, y - 34, 354, 382, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#4d3927";
  ctx.font = "900 18px Malgun Gothic, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("뽑기 피규어", x, y - 10);
  ctx.fillStyle = "#6a7e49";
  ctx.font = "800 13px Malgun Gothic, sans-serif";
  ctx.fillText(`${acquiredCount} / ${GACHA_FIGURES.length} 수집`, x + 202, y - 10);

  GACHA_FIGURES.forEach((figure, index) => {
    const cardX = x + (index % 3) * 112;
    const cardY = y + 14 + Math.floor(index / 3) * 82;
    drawFigureCard(figure, cardX, cardY, 102, 74, Boolean(state.figureCollection[figure.id]));
  });
  ctx.restore();
}

function drawDiaryStamps(x, y) {
  const stamps = [
    { key: "subitize", label: "묶음 보기", color: "#e28d74" },
    { key: "interleaving", label: "돌발 뺄셈", color: "#7fb1d4" },
    { key: "embodied", label: "손으로 옮기기", color: "#d5a14c" },
    { key: "mission", label: "비밀 미션", color: "#8fbd66" },
  ];

  ctx.textAlign = "left";
  ctx.fillStyle = "#4d3927";
  ctx.font = "800 22px Malgun Gothic, sans-serif";
  ctx.fillText("오늘의 도장", x, y);

  stamps.forEach((stamp, index) => {
    const rowY = y + 42 + index * 72;
    const count = state.diaryStamps[stamp.key] || 0;

    ctx.fillStyle = count > 0 ? stamp.color : "rgba(158, 133, 102, 0.22)";
    ctx.strokeStyle = count > 0 ? "rgba(91, 59, 36, 0.55)" : "rgba(91, 59, 36, 0.24)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(x + 38, rowY, 34, 26, -0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = count > 0 ? "#fff7dc" : "#7b6a55";
    ctx.font = "800 13px Malgun Gothic, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(count > 0 ? "참잘했어요" : "대기", x + 38, rowY + 5);

    ctx.textAlign = "left";
    ctx.fillStyle = "#4d3927";
    ctx.font = "800 17px Malgun Gothic, sans-serif";
    ctx.fillText(stamp.label, x + 88, rowY - 5);
    ctx.fillStyle = "#6c5a43";
    ctx.font = "700 14px Malgun Gothic, sans-serif";
    ctx.fillText(`${count}번`, x + 88, rowY + 19);
  });
}

function drawDiaryLog(x, y, width = 318) {
  ctx.textAlign = "left";
  ctx.fillStyle = "#4d3927";
  ctx.font = "800 22px Malgun Gothic, sans-serif";
  ctx.fillText("오늘 한 일", x, y);

  const logs = state.activityLog.length
    ? state.activityLog.slice(0, 5)
    : [{ title: "아직 기록이 없어요", detail: "놀이를 시작하면 여기에 남아요", result: "-" }];

  logs.forEach((entry, index) => {
    const rowY = y + 38 + index * 66;
    ctx.fillStyle = "rgba(255, 255, 255, 0.42)";
    ctx.strokeStyle = "rgba(102, 75, 45, 0.16)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x, rowY - 20, width, 54, 9);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = entry.result === "X" ? "#a34d45" : "#4e7448";
    ctx.font = "800 16px Malgun Gothic, sans-serif";
    ctx.fillText(entry.result === "X" ? "연습" : "성공", x + 14, rowY);

    ctx.fillStyle = "#3f3021";
    ctx.font = "800 15px Malgun Gothic, sans-serif";
    ctx.fillText(entry.title, x + 66, rowY);

    ctx.fillStyle = "#6c5a43";
    ctx.font = "700 13px Malgun Gothic, sans-serif";
    ctx.fillText(entry.detail, x + 66, rowY + 21);
  });
}

function drawFireflySubitizePrompt(visual) {
  const x = 392;
  const y = 112;
  const width = 496;
  const height = 278;
  const glowPulse = 0.5 + Math.sin(state.time / 360) * 0.18;

  ctx.save();
  const night = ctx.createLinearGradient(x, y, x, y + height);
  night.addColorStop(0, "rgba(41, 64, 91, 0.96)");
  night.addColorStop(1, "rgba(28, 54, 43, 0.95)");
  ctx.fillStyle = night;
  ctx.strokeStyle = "rgba(255, 241, 175, 0.38)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 18);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "rgba(255, 248, 204, 0.95)";
  ctx.font = "800 24px Malgun Gothic, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("반딧불이 불빛을 한눈에 보기", x + width / 2, y + 42);

  ctx.fillStyle = "rgba(106, 139, 84, 0.36)";
  ctx.beginPath();
  ctx.ellipse(x + width / 2, y + 178, 176, 74, 0, 0, Math.PI * 2);
  ctx.fill();

  for (let index = 0; index < visual.positions.length; index++) {
    const [px, py] = visual.positions[index];
    const drawX = x + px * width;
    const drawY = y + 68 + py * (height - 112);
    drawFireflyLight(drawX, drawY, index, glowPulse);
  }

  ctx.fillStyle = "rgba(255, 247, 197, 0.9)";
  ctx.font = "700 15px Malgun Gothic, sans-serif";
  ctx.fillText(
    visual.layout === "scattered" ? "흩어진 빛도 묶음으로 봐요" : "반짝이는 묶음을 바로 알아봐요",
    x + width / 2,
    y + height - 24
  );
  ctx.restore();
}

function drawFireflyNightSubitizePrompt(visual) {
  const x = 392;
  const y = 112;
  const width = 496;
  const height = 278;
  const glowPulse = 0.5 + Math.sin(state.time / 360) * 0.18;
  const title = "반딧불이 불빛을 한눈에 보기";
  const hint = visual.layout === "scattered"
    ? "흩어진 빛도 묶음으로 봐요"
    : "반짝이는 묶음을 바로 알아봐요";

  ctx.save();
  ctx.fillStyle = "rgba(13, 24, 46, 0.42)";
  ctx.strokeStyle = "rgba(255, 241, 175, 0.42)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 18);
  ctx.fill();
  ctx.stroke();

  ctx.font = "800 24px Malgun Gothic, sans-serif";
  ctx.textAlign = "center";
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(18, 27, 45, 0.42)";
  ctx.fillStyle = "rgba(255, 248, 204, 0.97)";
  ctx.strokeText(title, x + width / 2, y + 42);
  ctx.fillText(title, x + width / 2, y + 42);

  for (let index = 0; index < visual.positions.length; index++) {
    const [px, py] = visual.positions[index];
    const drawX = x + px * width;
    const drawY = y + 74 + py * (height - 124);
    drawFireflyLight(drawX, drawY, index, glowPulse);
  }

  ctx.font = "700 15px Malgun Gothic, sans-serif";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(18, 27, 45, 0.38)";
  ctx.fillStyle = "rgba(255, 247, 197, 0.92)";
  ctx.strokeText(hint, x + width / 2, y + height - 24);
  ctx.fillText(hint, x + width / 2, y + height - 24);
  ctx.restore();
}

function drawFireflyLight(x, y, index, pulse) {
  const sprite = images.get(ASSETS.firefly[(index % 4) + 1]);
  const glow = ctx.createRadialGradient(x, y, 2, x, y, 34 + pulse * 12);

  glow.addColorStop(0, `rgba(255, 244, 120, ${0.9 + pulse * 0.08})`);
  glow.addColorStop(0.42, "rgba(250, 226, 87, 0.42)");
  glow.addColorStop(1, "rgba(250, 226, 87, 0)");

  ctx.save();
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, 42 + pulse * 10, 0, Math.PI * 2);
  ctx.fill();

  if (sprite) {
    const width = 42;
    const height = sprite.height * (width / sprite.width);
    ctx.translate(x, y);
    ctx.rotate(Math.sin(state.time / 500 + index) * 0.08);
    ctx.drawImage(sprite, -width / 2, -height / 2, width, height);
  } else {
    ctx.fillStyle = "#fff176";
    ctx.beginPath();
    ctx.ellipse(x, y, 9, 13, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawSubitizeObject(object, x, y, index) {
  const sheet = images.get(ASSETS.subitizeObjects);
  const wobble = Math.sin(index * 1.7) * 0.12;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(wobble);

  if (sheet) {
    const cellWidth = sheet.width / 4;
    const cellHeight = sheet.height / 4;
    const column = index % 4;
    const sourceX = column * cellWidth;
    const sourceY = object.row * cellHeight;

    ctx.drawImage(
      sheet,
      sourceX,
      sourceY,
      cellWidth,
      cellHeight,
      -object.width / 2,
      -object.height / 2,
      object.width,
      object.height
    );
  } else {
    ctx.fillStyle = "#8f7b54";
    ctx.strokeStyle = "rgba(81, 59, 38, 0.45)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, object.width * 0.28, object.height * 0.28, 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

function drawProgressToast() {
  if (
    state.scene !== "insects"
    || state.quests < QUEST_TARGET
    || state.time >= state.collectionCompleteToastUntil
    || hasBlockingOverlay()
  ) return;

  ctx.save();
  ctx.fillStyle = "rgba(255, 250, 238, 0.92)";
  ctx.strokeStyle = "rgba(69, 49, 27, 0.28)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(410, 112, 460, 92, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#3d321f";
  ctx.font = "800 28px Malgun Gothic, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("곤충 관찰 완료!", 640, 152);
  ctx.font = "700 17px Malgun Gothic, sans-serif";
  ctx.fillText("별을 모아 다음 놀이를 이어봐요.", 640, 180);
  ctx.restore();
}

function drawTodayMissionPanel() {
  if (
    !state.todayMission
    || state.scene === "diary"
    || hasBlockingOverlay()
    || state.storeMissionActive
    || state.storeGachaActive
    || state.streamCrayfishActive
  ) return;
  const rounds = state.todayMission.rounds;
  const done = rounds.filter((round) => round.completed).length;
  const x = 72;
  const y = 174;
  const w = 292;
  const h = 44 + rounds.length * 28;

  ctx.save();
  ctx.fillStyle = "rgba(255, 250, 231, 0.92)";
  ctx.strokeStyle = "rgba(98, 72, 43, 0.28)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#4e3827";
  ctx.font = "900 18px Malgun Gothic, sans-serif";
  ctx.textAlign = "left";
  const minutes = Number(state.todayMission.estimatedMinutes) || 0;
  ctx.fillText(`오늘미션 ${done}/${rounds.length}${minutes ? ` · 약 ${minutes}분` : ""}`, x + 16, y + 28);

  rounds.forEach((round, index) => {
    const rowY = y + 58 + index * 28;
    const current = !round.completed && rounds.findIndex((item) => !item.completed) === index;
    ctx.fillStyle = round.completed ? "#5b7e3d" : current ? "#8b5e34" : "#6c6255";
    ctx.font = `${current ? "900" : "800"} 14px Malgun Gothic, sans-serif`;
    ctx.fillText(`${round.completed ? "●" : current ? "○" : "○"} ${round.label}`, x + 18, rowY);
  });
  ctx.restore();
}

function hasBlockingOverlay() {
  return !ui.storyPanel?.classList.contains("is-hidden")
    || !ui.activityOverlay?.classList.contains("is-hidden");
}

function sideMissionPanelY() {
  if (!state.todayMission || state.scene === "diary" || hasBlockingOverlay()) return 196;
  const todayPanelHeight = 44 + state.todayMission.rounds.length * 28;
  return 174 + todayPanelHeight + 12;
}

function drawSecretMission() {
  if (state.scene !== "insects" || !state.secretMission || hasBlockingOverlay()) return;

  const mission = state.secretMission;
  const x = 24;
  const y = sideMissionPanelY();
  const width = 318;
  const height = 116;
  const isFresh = state.time < state.missionToastUntil;

  ctx.save();
  ctx.globalAlpha = isFresh ? 1 : 0.94;
  ctx.fillStyle = mission.completed ? "rgba(226, 243, 186, 0.94)" : "rgba(255, 248, 222, 0.94)";
  ctx.strokeStyle = mission.completed ? "rgba(86, 122, 58, 0.45)" : "rgba(98, 72, 43, 0.34)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = mission.completed ? "#426c37" : "#6b4d2d";
  ctx.font = "800 18px Malgun Gothic, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(mission.completed ? "비밀 미션 완료" : mission.title, x + 18, y + 31);

  ctx.fillStyle = "#433526";
  ctx.font = "700 15px Malgun Gothic, sans-serif";
  ctx.fillText(mission.description, x + 18, y + 60);

  const barX = x + 18;
  const barY = y + 76;
  const barW = width - 36;
  const barH = 16;
  const ratio = mission.progress / mission.target;

  ctx.fillStyle = "rgba(119, 91, 56, 0.14)";
  ctx.beginPath();
  ctx.roundRect(barX, barY, barW, barH, 8);
  ctx.fill();

  ctx.fillStyle = mission.completed ? "#98c55b" : "#f0bd5c";
  ctx.beginPath();
  ctx.roundRect(barX, barY, Math.max(12, barW * ratio), barH, 8);
  ctx.fill();

  ctx.fillStyle = "#4b3a29";
  ctx.font = "800 13px Malgun Gothic, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(`${mission.progress}/${mission.target}`, x + width - 18, y + 91);

  if (isFresh) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
    ctx.beginPath();
    ctx.ellipse(x + 274, y + 28, 20, 8, -0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const clientX = event.clientX ?? event.touches?.[0]?.clientX;
  const clientY = event.clientY ?? event.touches?.[0]?.clientY;
  return {
    x: ((clientX - rect.left) / rect.width) * canvas.width,
    y: ((clientY - rect.top) / rect.height) * canvas.height,
  };
}

function pointInRect(point, rect) {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.w &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.h
  );
}

function findEggAt(point) {
  if (!state.chickenCoopMission) return null;
  const eggs = [...state.chickenCoopMission.eggs].reverse();
  return eggs.find((egg) => {
    if (egg.placed) return false;
    return Math.abs(point.x - egg.x) < 42 && Math.abs(point.y - egg.y) < 46;
  }) || null;
}

function findWoodAt(point) {
  if (!state.woodMission) return null;
  const pieces = [...state.woodMission.pieces].reverse();
  return pieces.find((piece) => {
    if (piece.placed) return false;
    return Math.abs(point.x - piece.x) < 72 * (piece.lengthScale || 1)
      && Math.abs(point.y - piece.y) < (piece.bundle ? 54 : 42);
  }) || null;
}

function findPlumAt(point) {
  if (!state.plumMission) return null;
  const plums = [...state.plumMission.plums].reverse();
  return plums.find((plum) => {
    if (plum.placed) return false;
    const scale = plum.scale || 1;
    return Math.abs(point.x - plum.x) < 46 * scale && Math.abs(point.y - plum.y) < 48 * scale;
  }) || null;
}

function findSobanItemAt(point) {
  if (!state.sobanMission) return null;
  const items = [...state.sobanMission.items].reverse();
  return items.find((item) => {
    if (item.placed) return false;
    const hitW = item.kind === "bowl" ? 48 : 70;
    const hitH = item.kind === "bowl" ? 42 : 34;
    return Math.abs(point.x - item.x) < hitW && Math.abs(point.y - item.y) < hitH;
  }) || null;
}

function pointInFurnace(point) {
  return (
    point.x >= FURNACE_ZONE.x &&
    point.x <= FURNACE_ZONE.x + FURNACE_ZONE.w &&
    point.y >= FURNACE_ZONE.y &&
    point.y <= FURNACE_ZONE.y + FURNACE_ZONE.h
  );
}

function pointInBasin(point) {
  return (
    point.x >= BASIN_ZONE.x &&
    point.x <= BASIN_ZONE.x + BASIN_ZONE.w &&
    point.y >= BASIN_ZONE.y &&
    point.y <= BASIN_ZONE.y + BASIN_ZONE.h
  );
}

function pointInSoban(point) {
  return (
    point.x >= SOBAN_ZONE.x &&
    point.x <= SOBAN_ZONE.x + SOBAN_ZONE.w &&
    point.y >= SOBAN_ZONE.y &&
    point.y <= SOBAN_ZONE.y + SOBAN_ZONE.h
  );
}

function startSobanDrag(event) {
  if (state.scene !== "wood" || !state.sobanMissionActive || !state.sobanMission) return false;
  const point = canvasPoint(event);
  const item = findSobanItemAt(point);
  if (!item) return false;

  state.draggingSobanId = item.id;
  item.offsetX = item.x - point.x;
  item.offsetY = item.y - point.y;
  canvas.setPointerCapture?.(event.pointerId);
  event.preventDefault();
  return true;
}

function moveSobanDrag(event) {
  if (state.scene !== "wood" || !state.sobanMissionActive || state.draggingSobanId === null || !state.sobanMission) return false;
  const point = canvasPoint(event);
  const item = state.sobanMission.items.find((entry) => entry.id === state.draggingSobanId);
  if (!item || item.placed) return false;

  item.targetX = point.x + item.offsetX;
  item.targetY = point.y + item.offsetY;
  event.preventDefault();
  return true;
}

function endSobanDrag(event) {
  if (state.scene !== "wood" || !state.sobanMissionActive || state.draggingSobanId === null || !state.sobanMission) return false;
  const item = state.sobanMission.items.find((entry) => entry.id === state.draggingSobanId);
  const point = canvasPoint(event);
  state.draggingSobanId = null;

  if (!item || item.placed) return false;

  const currentKindCount = item.kind === "bowl"
    ? state.sobanMission.bowlsPlaced
    : state.sobanMission.spoonsPlaced;
  const targetKindCount = item.kind === "bowl"
    ? state.sobanMission.targetBowls
    : state.sobanMission.targetSpoons;

  if (pointInSoban(point) && currentKindCount < targetKindCount) {
    const nextSlot = state.sobanMission.targetSlots[item.kind][currentKindCount];
    item.placed = true;
    item.targetX = nextSlot[0];
    item.targetY = nextSlot[1];
    item.x = item.targetX;
    item.y = item.targetY;
    item.angle = item.kind === "bowl" ? randomBetween(-0.08, 0.08) : randomBetween(-0.35, 0.35);
    if (item.kind === "bowl") {
      state.sobanMission.bowlsPlaced += 1;
    } else {
      state.sobanMission.spoonsPlaced += 1;
    }
    state.sobanMission.taps.push({ x: item.x, y: item.y, start: state.time });
    ui.feedback.textContent = item.kind === "bowl"
      ? `그릇을 ${state.sobanMission.bowlsPlaced}개 놓았어요.`
      : `숟가락을 ${state.sobanMission.spoonsPlaced}개 놓았어요.`;
    state.feedbackUntil = state.time + 1400;
    playSobanClack();

    if (
      state.sobanMission.bowlsPlaced >= state.sobanMission.targetBowls &&
      state.sobanMission.spoonsPlaced >= state.sobanMission.targetSpoons
    ) {
      state.sobanMission.completed = true;
      showAnswerReveal(state.sobanMission.familyCount);
      state.stars += 2;
      recordActivityInteraction(state.sobanMission, "soban_setting", true);
      recordActivityOutcome(state.sobanMission, "soban_setting");
      recordActivity({
        stamp: "embodied",
        title: "소반 차리기 완료",
        detail: `${state.sobanMission.grade}단계에서 밥그릇 ${state.sobanMission.targetBowls}개와 숟가락 ${state.sobanMission.targetSpoons}개를 맞춤`,
        result: "O",
      });
      completeTodayMission("soban");
      ui.question.textContent = `가족 ${state.sobanMission.familyCount}명 식기가 모두 준비됐어요!`;
      ui.feedback.textContent = "소반 차리기 완료! 별 2개를 받았어요.";
      syncHud();
      finishActivity(
        "soban",
        `밥그릇 ${state.sobanMission.targetBowls}개와 숟가락 ${state.sobanMission.targetSpoons}개를 빠짐없이 놓았어요.`
      );
    }
  } else {
    item.targetX = item.homeX;
    item.targetY = item.homeY;
    state.sobanMission.errorCount += 1;
    const errorType = pointInSoban(point) ? "excess_item" : "outside_target";
    recordActivityInteraction(state.sobanMission, "soban_setting", false, errorType);
    if (errorType === "excess_item") {
      ui.feedback.textContent = "필요한 수는 이미 놓였어요. 남는 식기는 그대로 두세요.";
      state.feedbackUntil = state.time + 1800;
    }
  }

  event.preventDefault();
  return true;
}

function startPlumDrag(event) {
  if (state.scene !== "wood" || !state.plumMissionActive || !state.plumMission || state.plumMission.phase !== "collect") return false;
  const point = canvasPoint(event);
  const plum = findPlumAt(point);
  if (!plum) return false;

  state.draggingPlumId = plum.id;
  plum.offsetX = plum.x - point.x;
  plum.offsetY = plum.y - point.y;
  canvas.setPointerCapture?.(event.pointerId);
  event.preventDefault();
  return true;
}

function movePlumDrag(event) {
  if (state.scene !== "wood" || !state.plumMissionActive || state.draggingPlumId === null || !state.plumMission) return false;
  const point = canvasPoint(event);
  const plum = state.plumMission.plums.find((item) => item.id === state.draggingPlumId);
  if (!plum || plum.placed) return false;

  plum.targetX = point.x + plum.offsetX;
  plum.targetY = point.y + plum.offsetY;
  event.preventDefault();
  return true;
}

function endPlumDrag(event) {
  if (state.scene !== "wood" || !state.plumMissionActive || state.draggingPlumId === null || !state.plumMission) return false;
  const plum = state.plumMission.plums.find((item) => item.id === state.draggingPlumId);
  const point = canvasPoint(event);
  state.draggingPlumId = null;

  if (!plum || plum.placed) return false;

  if (pointInBasin(point)) {
    const wouldExceedTarget = state.plumMission.placed + plum.value > state.plumMission.target;
    if (!plum.accepted || wouldExceedTarget) {
      plum.targetX = plum.homeX;
      plum.targetY = plum.homeY;
      state.plumMission.errorCount += 1;
      recordActivityInteraction(
        state.plumMission,
        "plum_wash",
        false,
        !plum.accepted ? "condition_mismatch" : "target_exceeded"
      );
      ui.feedback.textContent = !plum.accepted
        ? state.plumMission.mode === "size_select"
          ? "이번에는 작은 자두만 씻어요. 크기를 다시 비교해보세요."
          : "이번에는 큰 자두만 씻어요. 크기를 다시 비교해보세요."
        : `그 자두를 넣으면 ${state.plumMission.target}보다 커져요. 다른 조합을 찾아보세요.`;
      state.feedbackUntil = state.time + 1600;
      event.preventDefault();
      return true;
    }

    plum.placed = true;
    plum.targetX = plum.basinX;
    plum.targetY = plum.basinY;
    plum.x = plum.targetX;
    plum.y = plum.targetY;
    plum.angle = randomBetween(-0.18, 0.18);
    state.plumMission.acceptedCount += 1;
    state.plumMission.placed += plum.value;
    state.plumMission.ripples.push({ x: point.x, y: point.y + 14, start: state.time });
    ui.feedback.textContent = `퐁당! 자두를 ${state.plumMission.placed}/${state.plumMission.target}개 씻었어요.`;
    state.feedbackUntil = state.time + 1400;
    playPlumSplash();

    if (state.plumMission.placed >= state.plumMission.target) {
      state.plumMission.phase = "cat_steal";
      state.plumMission.catAt = state.time;
      ui.question.textContent = `자두 ${state.plumMission.target}개를 모두 씻었어요. 그런데...`;
      ui.feedback.textContent = `앗! 고양이가 자두 ${state.plumMission.stolen}개를 가져가요!`;
      playCatMeow();
    }
  } else {
    plum.targetX = plum.homeX;
    plum.targetY = plum.homeY;
    state.plumMission.errorCount += 1;
    recordActivityInteraction(state.plumMission, "plum_wash", false, "outside_target");
  }

  event.preventDefault();
  return true;
}

function startChickenCoopDrag(event) {
  if (state.scene !== "coop" || !state.chickenCoopActive || !state.chickenCoopMission) return false;
  const point = canvasPoint(event);
  const egg = findEggAt(point);
  if (!egg) return false;

  if (state.chickenCoopMission.interactionMode === "tap_select") {
    const mission = state.chickenCoopMission;
    const rule = mission.rules.yellow;
    if (rule.color === egg.color && mission.placed.yellow < rule.target_count) {
      placeChickenEgg(mission, egg, "yellow");
    } else {
      mission.errorCount += 1;
      mission.errors.push({ x: egg.x, y: egg.y, start: state.time });
      recordActivityInteraction(mission, "chicken_coop", false, "color_mismatch");
      ui.feedback.textContent = mission.mode === "observe_blue"
        ? "파란 달걀인지 색을 다시 살펴봐요."
        : "노란 달걀인지 색을 다시 살펴봐요.";
      state.feedbackUntil = state.time + 1400;
    }
    event.preventDefault();
    return true;
  }

  state.draggingEggId = egg.id;
  egg.offsetX = egg.x - point.x;
  egg.offsetY = egg.y - point.y;
  canvas.setPointerCapture?.(event.pointerId);
  event.preventDefault();
  return true;
}

function moveChickenCoopDrag(event) {
  if (state.scene !== "coop" || !state.chickenCoopActive || state.draggingEggId === null || !state.chickenCoopMission) return false;
  const point = canvasPoint(event);
  const egg = state.chickenCoopMission.eggs.find((item) => item.id === state.draggingEggId);
  if (!egg || egg.placed) return false;

  egg.targetX = point.x + egg.offsetX;
  egg.targetY = point.y + egg.offsetY;
  event.preventDefault();
  return true;
}

function chickenPlacedTotal(mission) {
  return mission.placed.yellow + mission.placed.cream;
}

function isChickenMissionComplete(mission) {
  if (mission.mode === "split") {
    return chickenPlacedTotal(mission) >= mission.targetTotal
      && mission.placed.yellow > 0
      && mission.placed.cream > 0;
  }
  if (mission.mode === "classify") {
    return Object.entries(mission.rules)
      .filter(([, rule]) => !rule.disabled)
      .every(([color, rule]) => mission.placed[color] >= rule.target_count);
  }
  return mission.placed.yellow >= mission.targetTotal;
}

function chickenMissionResultText(mission) {
  if (mission.mode === "split") {
    return `달걀 ${mission.targetTotal}개를 ${mission.placed.yellow}개와 ${mission.placed.cream}개로 나누었어요.`;
  }
  if (mission.mode === "observe_yellow") {
    return `여러 색 가운데 노란 달걀 ${mission.targetTotal}개를 찾아냈어요.`;
  }
  if (mission.mode === "observe_blue") {
    return `여러 색 가운데 파란 달걀 ${mission.targetTotal}개를 찾아냈어요.`;
  }
  if (mission.mode === "classify") {
    return `노란 달걀 ${mission.rules.yellow.target_count}개와 크림색 달걀 ${mission.rules.cream.target_count}개를 분류했어요.`;
  }
  return `달걀 ${mission.targetTotal}개를 정확히 담았어요.`;
}

function finishChickenMissionIfReady(mission) {
  if (!isChickenMissionComplete(mission)) return false;
  mission.completed = true;
  showAnswerReveal(mission.targetTotal);
  state.chickenCoopActive = false;
  state.stars += 2;
  recordActivityOutcome(mission, "chicken_coop");
  const resultText = chickenMissionResultText(mission);
  const title = mission.mode === "split" ? "여러 가지 수 가르기 성공"
    : mission.mode === "classify" ? "색깔 분류 성공"
    : "달걀 색 찾기 성공";
  recordActivity({
    stamp: mission.mode === "classify" ? "subitize" : "embodied",
    title,
    detail: resultText,
    result: "O",
  });
  completeTodayMission("chickenCoop");
  finishActivity("chickenCoop", resultText);
  ui.question.textContent = "달걀 활동을 모두 완료했어요!";
  ui.feedback.textContent = mission.mode === "split"
    ? `정답은 여러 가지! ${mission.placed.yellow}와 ${mission.placed.cream}으로 나누었어요.`
    : "닭장 활동 성공! 별 2개를 받았어요.";
  syncHud();
  return true;
}

function placeChickenEgg(mission, egg, basketColor) {
  const rule = mission.rules[basketColor];
  const slot = mission.placed[basketColor];
  const zone = CHICKEN_COOP_ZONES[basketColor];
  egg.placed = true;
  egg.targetX = zone.x + 54 + (slot % 3) * 42;
  egg.targetY = zone.y + 84 - Math.floor(slot / 3) * 22;
  egg.x = egg.targetX;
  egg.y = egg.targetY;
  egg.angle = randomBetween(-0.18, 0.18);
  mission.placed[basketColor] += 1;
  ui.feedback.textContent = mission.interactionMode === "tap_select"
    ? `찾았어요! ${mission.placed[basketColor]}/${mission.targetTotal}개예요.`
    : `${rule.label}에 ${mission.placed[basketColor]}개 담았어요.`;
  state.feedbackUntil = state.time + 1300;
  finishChickenMissionIfReady(mission);
}

function endChickenCoopDrag(event) {
  if (state.scene !== "coop" || !state.chickenCoopActive || state.draggingEggId === null || !state.chickenCoopMission) return false;
  const mission = state.chickenCoopMission;
  const egg = mission.eggs.find((item) => item.id === state.draggingEggId);
  const point = canvasPoint(event);
  state.draggingEggId = null;

  if (!egg || egg.placed) return false;

  const basketColor = Object.entries(CHICKEN_COOP_ZONES)
    .find(([, zone]) => pointInRect(point, zone))?.[0];

  if (!basketColor) {
    egg.targetX = egg.homeX;
    egg.targetY = egg.homeY;
    mission.errorCount += 1;
    recordActivityInteraction(mission, "chicken_coop", false, "outside_target");
    event.preventDefault();
    return true;
  }

  const rule = mission.rules[basketColor];
  const isCorrectColor = Boolean(rule && !rule.disabled && (rule.acceptAny || rule.color === egg.color));
  const otherBasket = basketColor === "yellow" ? "cream" : "yellow";
  const splitNeedsOtherBasket = mission.mode === "split"
    && chickenPlacedTotal(mission) === mission.targetTotal - 1
    && mission.placed[otherBasket] === 0;
  const hasRoom = mission.mode === "split"
    ? chickenPlacedTotal(mission) < mission.targetTotal && !splitNeedsOtherBasket
    : Boolean(rule && mission.placed[basketColor] < rule.target_count);

  if (isCorrectColor && hasRoom) {
    placeChickenEgg(mission, egg, basketColor);
  } else {
    mission.errors.push({ x: point.x, y: point.y, start: state.time });
    egg.targetX = egg.homeX;
    egg.targetY = egg.homeY;
    mission.errorCount += 1;
    const errorType = splitNeedsOtherBasket ? "split_constraint"
      : !rule || rule.disabled ? "wrong_basket"
      : isCorrectColor ? "target_full"
      : "color_mismatch";
    recordActivityInteraction(mission, "chicken_coop", false, errorType);
    ui.feedback.textContent = splitNeedsOtherBasket
      ? "마지막 달걀은 비어 있는 다른 바구니에 담아주세요."
      : !rule || rule.disabled
      ? "이번 활동에서는 다른 바구니를 사용해요."
      : isCorrectColor
      ? "필요한 수를 이미 모두 채웠어요."
      : "달걀의 색과 바구니 조건을 다시 살펴봐요.";
    state.feedbackUntil = state.time + 1500;
  }

  event.preventDefault();
  return true;
}

function playFlyTapSound() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const audio = playFlyTapSound.audio || new AudioContext();
  playFlyTapSound.audio = audio;
  audio.resume?.().catch?.(() => {});
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(720, audio.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(260, audio.currentTime + 0.1);
  gain.gain.setValueAtTime(0.001, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.08, audio.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.13);
  oscillator.connect(gain);
  gain.connect(audio.destination);
  oscillator.start();
  oscillator.stop(audio.currentTime + 0.14);
}

function handleFlyTap(event) {
  const mission = state.flyMission;
  const fly = mission?.fly;
  if (state.scene !== "coop" || !mission || mission.completed || !fly) return false;
  const point = canvasPoint(event);
  const hit = fly.mode !== "caught"
    && Math.abs(point.x - fly.x) <= 62
    && Math.abs(point.y - fly.y) <= 52;

  if (hit) {
    fly.mode = "caught";
    fly.caughtAt = state.time;
    mission.caught += 1;
    recordActivityInteraction(mission, "fly_catching", true);
    ui.feedback.textContent = `${mission.caught}! 파리를 잡았어요. 다음 파리를 찾아봐요.`;
    state.feedbackUntil = state.time + 1300;
    playFlyTapSound();
  } else if (fly.mode !== "caught") {
    mission.errorCount += 1;
    recordActivityInteraction(mission, "fly_catching", false, "tap_miss");
    ui.feedback.textContent = "괜찮아요. 파리가 잠깐 앉을 때 다시 눌러보세요.";
    state.feedbackUntil = state.time + 1000;
  }
  event.preventDefault();
  return true;
}

function startConcreteDrag(event) {
  const question = state.activeQuestion;
  const model = question?.concreteModel;
  if (question?.inputStage !== "concrete" || !model) return false;

  const point = canvasPoint(event);
  const item = [...model.items].reverse().find((entry) => {
    if (entry.collected) return false;
    const radiusX = entry.value === 10 ? 34 : 28;
    const radiusY = entry.value === 10 ? 25 : 24;
    return Math.abs(point.x - entry.x) <= radiusX && Math.abs(point.y - entry.y) <= radiusY;
  });
  if (!item) return false;

  model.draggingId = item.id;
  item.offsetX = item.x - point.x;
  item.offsetY = item.y - point.y;
  canvas.setPointerCapture?.(event.pointerId);
  event.preventDefault();
  return true;
}

function moveConcreteDrag(event) {
  const question = state.activeQuestion;
  const model = question?.concreteModel;
  if (question?.inputStage !== "concrete" || !model || model.draggingId === null) return false;
  const item = model.items.find((entry) => entry.id === model.draggingId);
  if (!item || item.collected) return false;

  const point = canvasPoint(event);
  item.x = point.x + item.offsetX;
  item.y = point.y + item.offsetY;
  event.preventDefault();
  return true;
}

function endConcreteDrag(event) {
  const question = state.activeQuestion;
  const model = question?.concreteModel;
  if (question?.inputStage !== "concrete" || !model || model.draggingId === null) return false;

  const item = model.items.find((entry) => entry.id === model.draggingId);
  const point = canvasPoint(event);
  model.draggingId = null;
  if (!item || item.collected) return false;

  const target = model.target;
  const inside = point.x >= target.x && point.x <= target.x + target.w
    && point.y >= target.y && point.y <= target.y + target.h;

  if (inside) {
    item.collected = true;
    model.collectedValue += item.value;
    const collectedIndex = model.items.filter((entry) => entry.collected).length - 1;
    if (model.mode === "combine") {
      item.x = target.x + 34 + (collectedIndex % 4) * 46;
      item.y = target.y + 58 + Math.floor(collectedIndex / 4) * 27;
    } else if (model.mode === "take_away") {
      item.x = target.x + 30 + (collectedIndex % 5) * 32;
      item.y = target.y + 58 + Math.floor(collectedIndex / 5) * 25;
    } else if (model.mode === "fill_missing") {
      const slotIndex = model.known + collectedIndex;
      item.x = target.x + 34 + (slotIndex % 6) * 38;
      item.y = target.y + 62 + Math.floor(slotIndex / 6) * 34;
    } else {
      item.x = target.x + 42 + (collectedIndex % 2) * 78;
      item.y = target.y + 60 + Math.floor(collectedIndex / 2) * 27;
    }
    question.interactionMode = model.mode || "drag_drop";
    const removedCount = model.items.filter((entry) => entry.collected).length;
    ui.feedback.textContent = model.mode === "combine"
      ? `하나 더해서 ${model.collectedValue}! 계속 합쳐보세요.`
      : model.mode === "take_away"
      ? `${removedCount}개를 뺐어요. ${model.total - removedCount}개가 남았어요.`
      : model.mode === "fill_missing"
      ? `하나 채워서 지금 ${model.collectedValue}개예요.`
      : `바구니에 ${model.collectedValue}만큼 모았어요.`;

    const isComplete = model.mode === "take_away"
      ? removedCount >= model.takeAway
      : model.items.every((entry) => entry.collected);
    if (isComplete) {
      answerQuestion(question.answer);
    }
  } else {
    item.x = item.homeX;
    item.y = item.homeY;
  }

  event.preventDefault();
  return true;
}

function startWoodDrag(event) {
  if (handleInsectTap(event)) return;
  if (handleFlyTap(event)) return;
  if (handleCatSnackTap(event)) return;
  if (handleStreamSkippingTap(event)) return;
  if (handleStreamCrayfishTap(event)) return;
  if (startStoreMoneyDrag(event)) return;
  if (handleStoreShoppingTap(event)) return;
  if (startGachaCoinDrag(event)) return;
  if (handleStoreGachaTap(event)) return;
  if (startConcreteDrag(event)) return;
  if (startChickenCoopDrag(event)) return;
  if (startSobanDrag(event)) return;
  if (startPlumDrag(event)) return;
  if (state.scene !== "wood" || !state.woodMissionActive || !state.woodMission) return;
  const point = canvasPoint(event);
  const zones = woodPanelButtonZones();
  if (pointInRect(point, zones.confirm)) {
    checkWoodAnswer();
    event.preventDefault();
    return;
  }
  if (pointInRect(point, zones.remove)) {
    removeLastWoodPiece();
    event.preventDefault();
    return;
  }
  const piece = findWoodAt(point);
  if (!piece) return;

  state.draggingWoodId = piece.id;
  piece.offsetX = piece.x - point.x;
  piece.offsetY = piece.y - point.y;
  canvas.setPointerCapture?.(event.pointerId);
  event.preventDefault();
}

function moveWoodDrag(event) {
  if (moveStoreMoneyDrag(event)) return;
  if (moveGachaCoinDrag(event)) return;
  if (moveConcreteDrag(event)) return;
  if (moveChickenCoopDrag(event)) return;
  if (moveSobanDrag(event)) return;
  if (movePlumDrag(event)) return;
  if (state.scene !== "wood" || !state.woodMissionActive || state.draggingWoodId === null || !state.woodMission) return;
  const point = canvasPoint(event);
  const piece = state.woodMission.pieces.find((item) => item.id === state.draggingWoodId);
  if (!piece || piece.placed) return;

  piece.targetX = point.x + piece.offsetX;
  piece.targetY = point.y + piece.offsetY;
  event.preventDefault();
}

function endWoodDrag(event) {
  if (endStoreMoneyDrag(event)) return;
  if (endGachaCoinDrag(event)) return;
  if (endConcreteDrag(event)) return;
  if (endChickenCoopDrag(event)) return;
  if (endSobanDrag(event)) return;
  if (endPlumDrag(event)) return;
  if (state.scene !== "wood" || !state.woodMissionActive || state.draggingWoodId === null || !state.woodMission) return;
  const piece = state.woodMission.pieces.find((item) => item.id === state.draggingWoodId);
  const point = canvasPoint(event);
  state.draggingWoodId = null;

  if (!piece || piece.placed) return;

  if (pointInFurnace(point)) {
    const slot = state.woodMission.acceptedCount;
    piece.placed = true;
    piece.targetX = FURNACE_ZONE.x + 42 + (slot % 4) * 34;
    piece.targetY = FURNACE_ZONE.y + FURNACE_ZONE.h - 18 - Math.floor(slot / 4) * 30;
    piece.x = piece.targetX;
    piece.y = piece.targetY;
    piece.angle = randomBetween(-0.2, 0.2);
    state.woodMission.acceptedCount += 1;
    state.woodMission.placed += piece.value;
    ui.feedback.textContent = `툭! 아궁이에 장작을 ${state.woodMission.placed}개 넣었어요.`;
    state.feedbackUntil = state.time + 1400;
    playWoodThunk();
  } else {
    piece.targetX = piece.homeX;
    piece.targetY = piece.homeY;
    state.woodMission.errorCount += 1;
    recordActivityInteraction(state.woodMission, "wood_mission", false, "outside_target");
  }

  event.preventDefault();
}

function playWoodThunk() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  const audio = playWoodThunk.audio || new AudioContext();
  playWoodThunk.audio = audio;

  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(110, audio.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(62, audio.currentTime + 0.11);
  gain.gain.setValueAtTime(0.001, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.18, audio.currentTime + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.16);
  oscillator.connect(gain);
  gain.connect(audio.destination);
  oscillator.start();
  oscillator.stop(audio.currentTime + 0.18);
}

function playPlumSplash() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  const audio = playPlumSplash.audio || new AudioContext();
  playPlumSplash.audio = audio;

  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(520, audio.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(210, audio.currentTime + 0.16);
  gain.gain.setValueAtTime(0.001, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.13, audio.currentTime + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.22);
  oscillator.connect(gain);
  gain.connect(audio.destination);
  oscillator.start();
  oscillator.stop(audio.currentTime + 0.24);
}

function playSobanClack() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  const audio = playSobanClack.audio || new AudioContext();
  playSobanClack.audio = audio;

  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(420, audio.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(185, audio.currentTime + 0.07);
  gain.gain.setValueAtTime(0.001, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.09, audio.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.12);
  oscillator.connect(gain);
  gain.connect(audio.destination);
  oscillator.start();
  oscillator.stop(audio.currentTime + 0.14);
}

function playCatMeow() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  try {
    const audio = playCatMeow.audio || new AudioContext();
    playCatMeow.audio = audio;
    audio.resume?.().catch?.(() => {});

    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(620, audio.currentTime);
    oscillator.frequency.linearRampToValueAtTime(430, audio.currentTime + 0.12);
    oscillator.frequency.linearRampToValueAtTime(690, audio.currentTime + 0.24);
    gain.gain.setValueAtTime(0.001, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, audio.currentTime + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.3);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + 0.32);
  } catch (error) {
    console.warn("Cat sound unavailable; continuing without the effect.", error);
  }
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  drawButterflies();
  drawChickenFamilyAmbience();
  drawChickenCoopMission();
  drawFlyGame();
  drawWoodMission();
  drawPlumMission();
  drawSobanMission();
  drawCatSnackMission();
  drawStreamCrayfishMission();
  drawStreamSkippingMission();
  drawStoreShoppingMission();
  drawStoreGachaMission();
  drawDiaryScene();
  drawTodayMissionPanel();
  drawSubitizePrompt();
  const hideDongwooForActivityBoard = state.storeMissionActive || state.storeGachaActive || state.streamCrayfishActive || state.streamSkippingActive;
  if (state.scene !== "diary" && ui.storyPanel?.classList.contains("is-hidden") && !hideDongwooForActivityBoard) {
    drawDongwoo();
  }
  drawSecretMission();
  drawProgressToast();
}

let lastTime = performance.now();

function loop(now) {
  const delta = Math.min(40, now - lastTime);
  lastTime = now;
  try {
    update(delta);
    render();
  } catch (error) {
    console.error("Game frame recovered after an error.", error);
  } finally {
    requestAnimationFrame(loop);
  }
}

document.querySelector(".controls").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const action = button.dataset.action;
  if (!isTodayMissionActionAllowed(action)) {
    if (action === "chickenCoop" && isTodayMissionSceneAllowed("coop")) {
      setScene("coop");
      return;
    }
    showTodayMissionLockedMessage();
    return;
  }
  if (action === "yard") {
    ui.activityOverlay?.classList.add("is-hidden");
    state.activityFlow = null;
    setScene("yard");
  }
  if (action === "todayMission") startTodayMission();
  if (action === "insects") {
    setScene("insects");
  }
  if (action === "chickenCoop") {
    if (!state.todayMission?.rounds?.some((round) => round.action === "chickenCoop" && !round.completed)
      && state.todayMission?.rounds?.some((round) => round.scene === "coop" && !round.completed)) {
      setScene("coop");
    } else {
      showActivityIntro("chickenCoop");
    }
  }
  if (action === "stream") setScene("stream");
  if (action === "streamCrayfish") showActivityIntro("streamCrayfish");
  if (action === "streamSkipping") showActivityIntro("streamSkipping");
  if (action === "store") setScene("store");
  if (action === "storeShopping") showActivityIntro("storeShopping");
  if (action === "storeGacha") {
    if (canUseTodayGacha()) {
      showActivityIntro("storeGacha");
    } else {
      ui.mode.textContent = "슈퍼 뽑기";
      ui.question.textContent = "아직 뽑기를 할 수 없어요.";
      ui.feedback.textContent = explainGachaUnavailable();
      showStoryMission(explainGachaUnavailable(), 3600);
    }
  }
  if (action === "flyGame") showActivityIntro("flyGame");
  if (action === "kitchen") setScene("wood");
  if (action === "woodMission") showActivityIntro("woodMission");
  if (action === "plum") showActivityIntro("plum");
  if (action === "soban") showActivityIntro("soban");
  if (action === "cat") showActivityIntro("cat");
  if (action === "diary") setScene("diary");
  if (action === "diaryGuide") state.diaryView = "guide";
  if (action === "guideNext") {
    state.diaryView = "guide";
    state.guidePage = ((state.guidePage || 0) + 1) % 2;
  }
  if (action === "diaryJournal") {
    state.diaryView = "journal";
    chooseDiaryHighlight();
  }
  if (action === "catch") startCatch();
  if (action === "reset") resetGame({ clearProgress: true });
});

ui.activityPrimary?.addEventListener("click", () => {
  if (state.activityFlow?.status === "intro") {
    launchActivity();
  } else if (state.activityFlow?.status === "found" && state.activityFlow.key === "streamCrayfish") {
    beginStreamCrayfishQuestion();
  } else if (state.activityFlow?.status === "complete") {
    closeActivityFlow();
  }
});

ui.activityExit?.addEventListener("click", cancelActivityIntro);
ui.musicToggle?.addEventListener("click", toggleMusic);
ui.parentEntry?.addEventListener("pointerdown", beginParentHold);
ui.parentEntry?.addEventListener("pointerup", finishParentHold);
ui.parentEntry?.addEventListener("pointercancel", handleParentHoldCancel);
ui.parentEntry?.addEventListener("click", (event) => event.preventDefault());
ui.parentEntry?.addEventListener("contextmenu", (event) => event.preventDefault());
ui.parentClose?.addEventListener("click", closeParentDashboard);
ui.parentAuthForm?.addEventListener("submit", verifyParentAuth);
ui.parentCopy?.addEventListener("click", copyParentAiPrompt);
ui.parentRefresh?.addEventListener("click", () => renderParentDashboard());
ui.parentExport?.addEventListener("click", exportParentLearningData);
ui.parentImport?.addEventListener("click", () => ui.parentImportFile?.click());
ui.parentImportFile?.addEventListener("change", importParentLearningData);
document.querySelectorAll("[data-parent-period]").forEach((button) => {
  button.addEventListener("click", () => renderParentDashboard(button.dataset.parentPeriod));
});
ui.nayeonTryNumber?.addEventListener("click", returnToNumberPadFromNayeon);
ui.nayeonTryDrag?.addEventListener("click", startConcreteFromNayeon);

document.addEventListener("pointerdown", () => {
  if (musicEnabled && ui.gameOst?.paused) startMusic();
});

document.addEventListener("click", () => {
  if (musicEnabled && ui.gameOst?.paused) startMusic();
});

document.addEventListener("touchstart", () => {
  if (musicEnabled && ui.gameOst?.paused) startMusic();
}, { passive: true });

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    ui.gameOst?.pause();
    saveGameProgress();
  } else {
    refreshDailyStateForCurrentDate();
    if (musicEnabled && musicStarted) startMusic();
  }
});

window.addEventListener("focus", refreshDailyStateForCurrentDate);
window.addEventListener("pageshow", refreshDailyStateForCurrentDate);
window.setInterval(refreshDailyStateForCurrentDate, 60 * 1000);
window.addEventListener("beforeunload", saveGameProgress);

function clearPressedButtons() {
  document.querySelectorAll("button.is-pressed").forEach((button) => {
    button.classList.remove("is-pressed");
  });
}

document.addEventListener("pointerdown", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  clearPressedButtons();
  button.classList.add("is-pressed");
});

document.addEventListener("pointerup", clearPressedButtons);
document.addEventListener("pointercancel", clearPressedButtons);
document.addEventListener("pointerleave", clearPressedButtons);
document.addEventListener("blur", clearPressedButtons, true);

window.addEventListener("keydown", (event) => {
  if (!ui.parentOverlay?.classList.contains("is-hidden")) {
    if (event.key === "Escape") closeParentDashboard();
    return;
  }
  if (state.activeQuestion && ui.answers.classList.contains("number-pad")) {
    if (/^\d$/.test(event.key)) {
      event.preventDefault();
      handleNumberPadKey(Number(event.key));
      return;
    }
    if (event.key === "Backspace") {
      event.preventDefault();
      handleNumberPadKey("back");
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      handleNumberPadKey("submit");
      return;
    }
  }
  if (event.key === "1") setScene("diary");
  if (event.key === "2") setScene("insects");
  if (event.key === "3") setScene("wood");
  if (event.key === "4" && state.scene === "insects") startChickenCoopMission();
  if (event.key === "5" && state.scene === "wood") startWoodMission();
  if (event.key === "6" && state.scene === "wood") startPlumMission();
  if (event.key === "7" && state.scene === "wood") startSobanMission();
  if (event.key === "8" && state.scene === "yard") startCatSnackMission();
  if (event.key === "Escape") setScene("yard");
  if (event.key === " " || event.key === "Enter") {
    event.preventDefault();
    startCatch();
  }
});

canvas.addEventListener("pointerdown", startWoodDrag);
canvas.addEventListener("pointermove", moveWoodDrag);
canvas.addEventListener("pointerup", endWoodDrag);
canvas.addEventListener("pointercancel", endWoodDrag);

fitGameToVisualViewport();
window.addEventListener("resize", fitGameToVisualViewport);
window.visualViewport?.addEventListener("resize", fitGameToVisualViewport);
window.visualViewport?.addEventListener("scroll", fitGameToVisualViewport);

Promise.all(allAssetPaths().map(loadImage)).then(() => {
  resetGame();
  restoreGameProgress();
  const params = new URLSearchParams(window.location.search);
  const startScene = params.get("scene");
  if (["yard", "insects", "wood", "diary", "coop", "stream", "store"].includes(startScene)) {
    setScene(startScene);
  }
  if (params.get("story") === "1") {
    startTodayMission();
    const todayStep = clamp(Number(params.get("todayStep")) || 0, 0, 5);
    for (let index = 0; index < todayStep; index++) {
      completeTodayMission(state.todayMission.rounds[index].action);
    }
  }
  const startMission = params.get("mission");
  if (startMission === "plum") {
    startPlumMission();
    if (params.get("complete") === "1" && state.plumMission) {
      state.plumMission.placed = state.plumMission.target;
      state.plumMission.completed = true;
    }
  }
  if (startMission === "cat") {
    startCatSnackMission();
    if (params.get("phase") === "question" && state.catSnackMission) {
      state.catSnackMission.phase = "question";
      state.catSnackMission.questionReady = true;
      state.catSnackMission.startTime = state.time - 2200;
      beginProblemSession(makeCatSnackQuestion(state.catSnackMission), {
        gameType: "cat_subtraction",
        affectsMastery: true,
        feedback: "남은 수박 조각 수를 숫자패드로 입력해보세요.",
      });
    }
  }
  if (startMission === "soban") {
    if (state.scene !== "wood") setScene("wood");
    startSobanMission();
    if (params.get("complete") === "1" && state.sobanMission) {
      state.sobanMission.bowlsPlaced = state.sobanMission.targetBowls;
      state.sobanMission.spoonsPlaced = state.sobanMission.targetSpoons;
      state.sobanMission.completed = true;
    }
  }
  if (startMission === "wood") {
    if (state.scene !== "wood") setScene("wood");
    startWoodMission();
    if (params.get("complete") === "1" && state.woodMission) {
      state.woodMission.placed = state.woodMission.target;
      state.woodMission.completed = true;
    }
  }
  const previewActivity = params.get("activity");
  if (ACTIVITY_DEFS[previewActivity]) {
    if (params.get("activityState") === "complete") {
      finishActivity(previewActivity, "목표를 모두 달성했어요. 닫기를 누른 뒤 원하는 활동을 계속 고를 수 있어요.");
    } else {
      showActivityIntro(previewActivity);
    }
  }
  if (params.get("randomAudit") === "1") {
    document.documentElement.dataset.randomAudit = JSON.stringify(createRandomProblemAudit(8));
  }
  requestAnimationFrame(loop);
});

