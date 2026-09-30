window.dataLayer = window.dataLayer || [];
window.gtag = window.gtag || function gtag() {
  window.dataLayer.push(arguments);
};

window.gtag('js', new Date());
window.gtag('config', 'G-2E5GE8PD7D');

// Load the GA library after the page has loaded so it doesn't compete with
// page content on mobile connections. Calls made before then are queued in
// dataLayer and sent once the library arrives.
(function () {
  function loadGtag() {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=G-2E5GE8PD7D';
    document.head.appendChild(s);
  }
  function schedule() {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(loadGtag, { timeout: 3000 });
    } else {
      setTimeout(loadGtag, 1500);
    }
  }
  if (document.readyState === 'complete') {
    schedule();
  } else {
    window.addEventListener('load', schedule);
  }
})();
