/* Visual motion only. Reads numbers the page already shows. No data, no requests. */
(function (global) {
  function reduce() {
    return global.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  function onceFlag(key) {
    try {
      if (sessionStorage.getItem(key)) return false;
      sessionStorage.setItem(key, "1");
      return true;
    } catch (e) {
      return true;
    }
  }
  var lastHaptic = 0;
  function haptic() {
    var n = global.navigator;
    if (!n || typeof n.vibrate !== "function") return;
    var now = Date.now();
    if (now - lastHaptic < 500) return;
    lastHaptic = now;
    try { n.vibrate(10); } catch (e) {}
  }
  function countUp(el, from, to, ms, render) {
    if (!el) return;
    if (reduce() || from === to) {
      el.textContent = render(to);
      return;
    }
    var t0 = 0;
    function frame(now) {
      if (!t0) t0 = now;
      var p = Math.min(1, (now - t0) / ms);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = render(from + (to - from) * e);
      if (p < 1) global.requestAnimationFrame(frame);
    }
    global.requestAnimationFrame(frame);
  }
  global.PG = { reduce: reduce, onceFlag: onceFlag, haptic: haptic, countUp: countUp };
})(window);
