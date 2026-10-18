const words = ["현진", "Hyunjin", "QA Engineer"];
const pauses = [1500, 1000, 1000];

// One owned timer at a time. The caller must run the returned cleanup on
// unmount; no DOM nodes or asynchronous loops survive that cleanup.
export function startTypewriter(onText: (text: string) => void): () => void {
  let active = true;
  let wordIndex = 0;
  let length = 0;
  let deleting = false;
  let timer: ReturnType<typeof setTimeout>;

  function schedule(delay: number) {
    if (active) timer = setTimeout(tick, delay);
  }

  function tick() {
    if (!active) return;
    const word = words[wordIndex];
    length += deleting ? -1 : 1;
    onText(word.slice(0, length));
    if (!deleting && length === word.length) {
      deleting = true;
      schedule(pauses[wordIndex]);
    } else {
      if (deleting && length === 0) {
        deleting = false;
        wordIndex = (wordIndex + 1) % words.length;
      }
      schedule(50);
    }
  }

  schedule(50);
  return () => {
    active = false;
    clearTimeout(timer);
  };
}
