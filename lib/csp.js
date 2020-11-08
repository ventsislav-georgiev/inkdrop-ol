let disabled = false;

module.exports = {
  patch: () => {
    if (disabled) return;
    disabled = true;

    const fetchImage = (el) => {
      const [url, jsonpCallback] = el.src.split('&jsonp=');
      fetch(url).then(res => res.json().then(r => window[jsonpCallback](r)));
    };

    context = document.getElementsByTagName('head')[0];
    defaultAppendChild = context.appendChild;

    context.appendChild = (...args) => {
      if (!args || !args[0]) return defaultAppendChild.apply(context, args);
      const el = args[0];

      if (el.src && el.src.startsWith('https://dev.virtualearth.net/')) {
        fetchImage(el);
        el.src = "";
      }

      return defaultAppendChild.apply(context, args);
    }
  }
};
