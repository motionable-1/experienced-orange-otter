export type HyperframesSeekDetail = {
  time?: number;
};

declare global {
  interface Window {
    __hfThreeTime?: number;
    __motionablR3FReady?: boolean;
  }
}

export function readHyperframesTime(fallback: number) {
  const time = window.__hfThreeTime;
  return typeof time === "number" && Number.isFinite(time)
    ? Math.max(0, time)
    : fallback;
}

export function subscribeHyperframesSeek(onSeek: (time: number) => void) {
  const handleSeek = (event: Event) => {
    const detail = (event as CustomEvent<HyperframesSeekDetail>).detail;
    const time =
      typeof detail?.time === "number" && Number.isFinite(detail.time)
        ? detail.time
        : readHyperframesTime(0);

    onSeek(Math.max(0, time));
  };

  window.addEventListener("hf-seek", handleSeek);
  return () => window.removeEventListener("hf-seek", handleSeek);
}
