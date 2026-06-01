(() => {
  let alignFrame = 0;
  const staticHomeKey = "dehlen-static-home";
  const getStaticHome = () => {
    try {
      return window.sessionStorage?.getItem(staticHomeKey) === "1";
    } catch {
      return false;
    }
  };
  const clearStaticHome = () => {
    try {
      window.sessionStorage?.removeItem(staticHomeKey);
    } catch {}
  };
  const setStaticHome = () => {
    try {
      window.sessionStorage?.setItem(staticHomeKey, "1");
    } catch {}
  };

  const measureAnchorWidth = (content) => {
    const anchorText = content.dataset.centerAnchor;
    if (!anchorText) {
      return 0;
    }

    const styles = window.getComputedStyle(content);
    const probe = document.createElement("span");
    probe.textContent = anchorText;
    Object.assign(probe.style, {
      position: "fixed",
      left: "0",
      top: "0",
      visibility: "hidden",
      whiteSpace: "nowrap",
      pointerEvents: "none",
      fontFamily: styles.fontFamily,
      fontSize: styles.fontSize,
      fontStyle: styles.fontStyle,
      fontWeight: styles.fontWeight,
      letterSpacing: styles.letterSpacing,
      lineHeight: styles.lineHeight,
    });

    document.body.append(probe);
    const width = probe.getBoundingClientRect().width;
    probe.remove();
    return width;
  };

  const alignMainContent = () => {
    contentBlocks.forEach((content) => {
      const anchorWidth = measureAnchorWidth(content);
      if (!anchorWidth) {
        content.style.setProperty("--anchor-shift", "0px");
        return;
      }

      const contentWidth = content.getBoundingClientRect().width;
      const shift = (contentWidth - anchorWidth) / 2;
      content.style.setProperty("--anchor-shift", `${shift}px`);
    });
  };

  const queueAlign = () => {
    window.cancelAnimationFrame(alignFrame);
    alignFrame = window.requestAnimationFrame(alignMainContent);
  };

  const contentBlocks = Array.from(document.querySelectorAll(".content"));
  const resizeObserver = "ResizeObserver" in window
    ? new ResizeObserver(queueAlign)
    : null;

  contentBlocks.forEach((content) => {
    resizeObserver?.observe(content);
  });

  queueAlign();
  window.addEventListener("resize", queueAlign);
  window.visualViewport?.addEventListener("resize", queueAlign);
  window.visualViewport?.addEventListener("scroll", queueAlign);
  document.fonts?.ready.then(queueAlign);

  const typeIntroTitle = () => {
    const title = document.querySelector(".typing-title[data-type-text]");
    if (!title) {
      return;
    }

    const text = title.dataset.typeText || title.textContent;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const shouldUseStaticHome = getStaticHome();
    title.setAttribute("aria-label", text);

    if (shouldUseStaticHome) {
      clearStaticHome();
    }

    if (prefersReducedMotion || shouldUseStaticHome) {
      title.textContent = text;
      document.dispatchEvent(new CustomEvent("intro-name-complete", { detail: { instant: true } }));
      return;
    }

    const measure = document.createElement("span");
    measure.className = "typing-measure";
    measure.textContent = text;
    title.append(measure);
    title.style.setProperty("--typing-width", `${measure.getBoundingClientRect().width}px`);
    measure.remove();

    const nextDelay = (letter) => {
      if (letter === "," || letter === ".") {
        return 250;
      }

      if (letter === " ") {
        return 80;
      }

      return 115;
    };

    const beforeName = document.createElement("span");
    const deh = document.createElement("span");
    const len = document.createElement("span");
    const period = document.createElement("span");
    const name = document.createElement("span");
    const typingText = document.createElement("span");
    const caret = document.createElement("span");
    typingText.className = "typing-text";
    caret.className = "typing-caret";
    caret.setAttribute("aria-hidden", "true");
    name.append(deh, len, period);
    typingText.append(beforeName, name, caret);
    title.replaceChildren(typingText);

    const createTypedLetter = (letter) => {
      const span = document.createElement("span");
      span.className = "typing-letter";
      span.textContent = letter;
      return span;
    };

    const typeInto = (target, value, done, speed = 1, asLetters = false) => {
      const letters = Array.from(value);
      let index = 0;

      const next = () => {
        if (index >= letters.length) {
          done?.();
          return;
        }

        const letter = letters[index];
        const delay = Math.round(nextDelay(letter) * speed);
        index += 1;
        window.setTimeout(() => {
          if (asLetters) {
            target.append(createTypedLetter(letter));
          } else {
            target.textContent += letter;
          }

          next();
        }, delay);
      };

      next();
    };

    const flashCaret = (done, count = 1, duration = 1500) => {
      const blinkCount = Math.min(count, 2);
      caret.classList.remove("is-flashing");
      caret.style.setProperty("--caret-blink-count", blinkCount);
      caret.style.setProperty("--caret-blink-duration", `${duration}ms`);
      void caret.offsetWidth;
      caret.classList.add("is-flashing");
      window.setTimeout(() => {
        caret.classList.remove("is-flashing");
        done?.();
      }, blinkCount * duration);
    };

    const pressArrow = (target, referenceNode, done, delay = 460) => {
      caret.style.transition = "none";
      caret.style.transform = "translate3d(0, 0, 0)";
      target.insertBefore(caret, referenceNode);
      window.setTimeout(done, delay);
    };

    const pressArrows = (steps, done, delay = 460) => {
      let index = 0;

      const next = () => {
        if (index >= steps.length) {
          done?.();
          return;
        }

        const step = steps[index];
        index += 1;
        pressArrow(step.target, step.referenceNode, next, step.delay ?? delay);
      };

      next();
    };

    const hesitate = (done, delay = 920) => {
      window.setTimeout(done, delay);
    };

    const finishTyping = () => {
      window.setTimeout(() => {
        caret.style.visibility = "hidden";
        document.dispatchEvent(new CustomEvent("intro-name-complete"));
      }, 700);
    };

    window.setTimeout(() => {
      typeInto(beforeName, "Hi, I’m ", () => {
        typeInto(len, "len", () => {
          flashCaret(() => {
            const lenLetters = Array.from(len.querySelectorAll(".typing-letter"));
            pressArrows([
              { target: len, referenceNode: lenLetters[2], delay: 520 },
              { target: len, referenceNode: lenLetters[1], delay: 500 },
              { target: len, referenceNode: lenLetters[0], delay: 0 },
            ], () => {
              flashCaret(() => {
                hesitate(() => {
                  typeInto(deh, "deh", () => {
                    flashCaret(() => {
                      pressArrows([
                        { target: len, referenceNode: lenLetters[1], delay: 720 },
                        { target: len, referenceNode: lenLetters[2], delay: 680 },
                        { target: typingText, referenceNode: null, delay: 0 },
                      ], () => {
                        typeInto(period, ".", () => {
                          flashCaret(finishTyping, 1);
                        }, 1);
                      });
                    }, 1);
                  }, 2.65, true);
                }, 360);
              }, 1);
            });
          });
        }, 1, true);
      });
    }, 420);
  };

  const setupBrandMorph = () => {
    const links = document.querySelectorAll(".brand-link");
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    links.forEach((link) => {
      let isBusy = false;
      let isLocked = false;
      let isIntroWaiting = link.dataset.startCollapsed === "true";
      const timers = [];

      const addTimer = (callback, delay) => {
        const timer = window.setTimeout(callback, delay);
        timers.push(timer);
      };

      const clearTimers = () => {
        timers.forEach((timer) => window.clearTimeout(timer));
        timers.length = 0;
      };

      const setCoreShift = () => {
        const left = link.querySelector(".brand-away-left");
        if (!left) {
          return;
        }

        const shift = left.getBoundingClientRect().width;
        link.style.setProperty("--brand-core-shift", `${-shift}px`);
      };

      setCoreShift();
      window.addEventListener("resize", setCoreShift);
      window.visualViewport?.addEventListener("resize", setCoreShift);
      document.fonts?.ready.then(setCoreShift);

      if (isIntroWaiting) {
        link.classList.add("is-brand-faded", "is-brand-shifted");
      }

      const finish = () => {
        isBusy = false;
        isLocked = true;
        addTimer(() => {
          isLocked = false;
          timers.length = 0;
        }, 5000);
      };

      const revealIntro = (event) => {
        if (!isIntroWaiting) {
          return;
        }

        isIntroWaiting = false;
        isBusy = true;
        clearTimers();
        setCoreShift();
        link.classList.add("is-brand-faded", "is-brand-shifted");

        if (prefersReducedMotion || event?.detail?.instant) {
          link.classList.remove("is-brand-shifted", "is-brand-faded");
          finish();
          return;
        }

        addTimer(() => {
          link.classList.remove("is-brand-shifted");
        }, 120);

        addTimer(() => {
          link.classList.remove("is-brand-faded");
        }, 2450);

        addTimer(finish, 4300);
      };

      const run = (event) => {
        if (event?.type === "click" && link.dataset.startCollapsed === "true") {
          event.preventDefault();
        }

        if (isIntroWaiting || isBusy || isLocked) {
          return;
        }

        isBusy = true;
        clearTimers();
        setCoreShift();

        if (prefersReducedMotion) {
          finish();
          return;
        }

        link.classList.add("is-brand-faded");

        addTimer(() => {
          link.classList.add("is-brand-shifted");
        }, 1650);

        addTimer(() => {
          link.classList.remove("is-brand-shifted");
        }, 13000);

        addTimer(() => {
          link.classList.remove("is-brand-faded");
        }, 15500);

        addTimer(finish, 17200);
      };

      document.addEventListener("intro-name-complete", revealIntro, { once: true });
      link.addEventListener("pointerenter", run);
      link.addEventListener("focus", run);
      link.addEventListener("click", run);
    });
  };

  const setupStaticHomeLinks = () => {
    document.querySelectorAll("[data-static-home]").forEach((link) => {
      link.addEventListener("click", () => {
        setStaticHome();
      });
    });
  };

  setupStaticHomeLinks();
  setupBrandMorph();
  typeIntroTitle();
})();
