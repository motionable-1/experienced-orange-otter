import "@hyperframes/player";
import "./styles/global.css";

const PLAYER_READY_TYPE = "motionabl:player-ready";
const PLAYER_STATE_TYPE = "motionabl:player-state";
const PLAYER_COMMAND_TYPE = "motionabl:player-command";
const DEFAULT_FPS = 30;

type SceneMarker = {
  label: string;
  from: number;
  durationInFrames: number;
};

type PlayerCommandMessage = {
  type: typeof PLAYER_COMMAND_TYPE;
  command:
    | "play"
    | "pause"
    | "toggle-play"
    | "seek"
    | "mute"
    | "unmute"
    | "toggle-mute"
    | "request-fullscreen"
    | "request-state";
  frame?: number;
};

type HyperframesPlayerElement = HTMLElement & {
  play: () => void | Promise<void>;
  pause: () => void;
  seek?: (time: number) => void;
  currentTime: number;
  duration?: number;
  paused?: boolean;
  muted?: boolean;
  ready?: boolean;
  iframeElement?: HTMLIFrameElement | null;
};

const root = document.getElementById("root");

if (!root) {
  throw new Error("Missing #root element");
}

const getFrameFromHash = (): number | null => {
  const hash = window.location.hash;
  if (!hash) return null;

  const params = new URLSearchParams(hash.slice(1));
  const frameParam = params.get("frame");
  if (!frameParam) return null;

  const frame = Number.parseInt(frameParam, 10);
  return Number.isFinite(frame) && frame >= 0 ? frame : null;
};

const readCompositionMetadata = (player: HyperframesPlayerElement) => {
  const doc = player.iframeElement?.contentDocument;
  const composition = doc?.querySelector<HTMLElement>("[data-composition-id]");
  const width = Number(composition?.dataset.width ?? 1920);
  const height = Number(composition?.dataset.height ?? 1080);
  const fps = Number(composition?.dataset.motionablFps ?? DEFAULT_FPS);
  const compositionId = composition?.dataset.compositionId ?? "Main";
  const scenesJson = composition?.dataset.motionablScenes;

  let scenes: SceneMarker[] = [];
  if (scenesJson) {
    try {
      const parsed = JSON.parse(scenesJson) as SceneMarker[];
      if (Array.isArray(parsed)) {
        scenes = parsed.filter(
          (scene) =>
            typeof scene.label === "string" &&
            typeof scene.from === "number" &&
            typeof scene.durationInFrames === "number",
        );
      }
    } catch {
      scenes = [];
    }
  }

  return {
    compositionId,
    width: Number.isFinite(width) ? width : 1920,
    height: Number.isFinite(height) ? height : 1080,
    fps: Number.isFinite(fps) && fps > 0 ? fps : DEFAULT_FPS,
    scenes,
  };
};

const createPlayerState = (player: HyperframesPlayerElement) => {
  const metadata = readCompositionMetadata(player);
  const durationSeconds =
    typeof player.duration === "number" && Number.isFinite(player.duration)
      ? player.duration
      : 0;
  const sceneDurationInFrames = metadata.scenes.reduce(
    (duration, scene) => Math.max(duration, scene.from + scene.durationInFrames),
    0,
  );
  const durationInFrames = Math.max(
    1,
    sceneDurationInFrames,
    Math.ceil(durationSeconds * metadata.fps),
  );
  const currentFrame = Math.min(
    Math.max(Math.round((player.currentTime || 0) * metadata.fps), 0),
    durationInFrames - 1,
  );

  return {
    compositionId: metadata.compositionId,
    durationInFrames,
    fps: metadata.fps,
    width: metadata.width,
    height: metadata.height,
    currentFrame,
    isPlaying: player.paused === false,
    isMuted: player.muted !== false,
    scenes: metadata.scenes,
  };
};

const postPlayerState = (
  player: HyperframesPlayerElement,
  type: typeof PLAYER_READY_TYPE | typeof PLAYER_STATE_TYPE,
) => {
  window.parent?.postMessage({ type, state: createPlayerState(player) }, "*");
};

const initialFrame = getFrameFromHash();
const captureMode = new URLSearchParams(window.location.search).has("capture");

root.innerHTML = `
  <main
    class="app-shell"
    data-motionabl-composition-width="1920"
    data-motionabl-composition-height="1080"
  >
    <div class="app-backdrop"></div>
    <section class="app-stage">
      <div class="app-player-shell" data-motionabl-frame="true">
        <div class="app-player-gloss"></div>
        <hyperframes-player
          src="/composition/index.html"
          width="1920"
          height="1080"
          muted
        ></hyperframes-player>
      </div>
    </section>
  </main>
`;

const player =
  root.querySelector<HyperframesPlayerElement>("hyperframes-player");

if (!player) {
  throw new Error("Missing Hyperframes player");
}

const calculatePlayerSize = () => {
  const aspectRatio = 1920 / 1080;
  const maxWidth = window.innerWidth * 0.96;
  const maxHeight = Math.max(220, window.innerHeight * 0.96);

  let playerWidth = maxWidth;
  let playerHeight = playerWidth / aspectRatio;

  if (playerHeight > maxHeight) {
    playerHeight = maxHeight;
    playerWidth = playerHeight * aspectRatio;
  }

  player.style.width = `${playerWidth}px`;
  player.style.height = `${playerHeight}px`;
  player.style.maxWidth = "100%";
  player.style.maxHeight = "100%";
};

const seekToFrame = (frame: number) => {
  const { fps } = readCompositionMetadata(player);
  const time = Math.max(0, frame / fps);
  if (typeof player.seek === "function") {
    player.seek(time);
  } else {
    player.currentTime = time;
  }
};

const bindPlayerEvents = () => {
  const postState = () => postPlayerState(player, PLAYER_STATE_TYPE);

  player.addEventListener("ready", () => {
    if (initialFrame !== null) {
      seekToFrame(initialFrame);
      player.pause();
    } else if (!captureMode) {
      void player.play();
    }

    postPlayerState(player, PLAYER_READY_TYPE);
    postState();
  });

  player.addEventListener("timeupdate", postState);
  player.addEventListener("play", postState);
  player.addEventListener("pause", postState);
  player.addEventListener("ended", postState);
};

window.addEventListener("message", (event: MessageEvent) => {
  const message = event.data as Partial<PlayerCommandMessage>;
  if (!message || message.type !== PLAYER_COMMAND_TYPE) return;

  switch (message.command) {
    case "play":
      void player.play();
      break;
    case "pause":
      player.pause();
      break;
    case "toggle-play":
      if (player.paused === false) player.pause();
      else void player.play();
      break;
    case "seek":
      seekToFrame(message.frame ?? 0);
      break;
    case "mute":
      player.muted = true;
      break;
    case "unmute":
      player.muted = false;
      break;
    case "toggle-mute":
      player.muted = player.muted === false;
      break;
    case "request-fullscreen":
      void document.documentElement.requestFullscreen?.();
      break;
    case "request-state":
      break;
  }

  postPlayerState(player, PLAYER_STATE_TYPE);
});

window.addEventListener("resize", calculatePlayerSize);
calculatePlayerSize();
bindPlayerEvents();
