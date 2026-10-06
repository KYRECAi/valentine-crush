const URLS = [
  "/sprites/stan/idle.png",
  "/sprites/stan/throw.png",
  "/sprites/stan/follow.png",
  "/sprites/nova/idle.png",
  "/sprites/nova/point.png",
  "/sprites/nova/cheer.png",
  "/sprites/items/heart.png",
  "/sprites/items/star.png",
  "/sprites/items/gem.png",
  "/sprites/items/note.png",
  "/sprites/items/coin.png",
  "/sprites/items/rainbow.png",
  "/sprites/items/lantern.png",
  "/sprites/items/gift.png",
  "/sprites/items/bag.png",
  "/sprites/items/magnet.png",
  "/sprites/items/pulse.png",
  "/sprites/fx/petal.png",
  "/sprites/family/annie.png",
  "/sprites/family/michael.png",
  "/sprites/family/grandma.png",
  "/sprites/family/kelly.png",
  "/sprites/bg/level-1.jpg",
  "/sprites/bg/level-2.jpg",
  "/sprites/bg/level-3.jpg",
  "/sprites/bg/level-4.jpg",
  "/sprites/bg/level-5.jpg",
  "/sprites/bg/level-6.jpg",
];

const cache = new Map<string, HTMLImageElement>();

export function getSprite(src: string): HTMLImageElement | undefined {
  return cache.get(src);
}

export function preloadSprites(onProgress?: (done: number, total: number) => void): Promise<void> {
  let done = 0;
  return Promise.all(
    URLS.map(
      (src) =>
        new Promise<void>((resolve) => {
          const existing = cache.get(src);
          if (existing?.complete && existing.naturalWidth > 0) {
            done += 1;
            onProgress?.(done, URLS.length);
            resolve();
            return;
          }
          const img = new Image();
          img.decoding = "async";
          img.onload = () => {
            cache.set(src, img);
            done += 1;
            onProgress?.(done, URLS.length);
            resolve();
          };
          img.onerror = () => {
            done += 1;
            onProgress?.(done, URLS.length);
            resolve();
          };
          img.src = src;
        }),
    ),
  ).then(() => undefined);
}

if (typeof window !== "undefined") {
  void preloadSprites();
}
