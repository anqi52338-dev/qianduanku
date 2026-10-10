(() => {
  'use strict';
  const phone = document.querySelector('.phone');
  if (!phone) return;
  // Safari can ignore viewport scale limits. Block multi-finger page zoom only
  // inside the app, leaving single-finger scrolling, taps and text selection alone.
  const inApp = event => event.target instanceof Node && phone.contains(event.target);
  const stopPinch = event => {
    if (inApp(event) && event.touches?.length > 1 && event.cancelable) event.preventDefault();
  };
  for (const name of ['touchstart', 'touchmove']) document.addEventListener(name, stopPinch, { passive: false });
  for (const name of ['gesturestart', 'gesturechange']) document.addEventListener(name, event => {
    if (inApp(event) && event.cancelable) event.preventDefault();
  }, { passive: false });
})();
