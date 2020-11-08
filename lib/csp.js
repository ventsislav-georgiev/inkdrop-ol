let disabled = false;

module.exports = {
  patch: (remote) => {
    if (disabled) return;
    disabled = true;

    const webContents = remote.getCurrentWebContents();

    const fetchImage = (el) => {
      const [url, jsonpCallback] = el.src.split('&jsonp=');
      fetch(url).then(res => res.json().then(r => window[jsonpCallback](r)));
    };

    const fetchScript = (el) => {
      return fetch(el.src)
        .then(res => res.text().then(r => {
          webContents.executeJavaScript(r);
          return r;
        }));
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

      if (el.src && el.src.startsWith('https://maps.googleapis.com/')) {
        fetchScript(el).then(scriptText => {
          el.innerText = scriptText;
        });
        el.src = "./browser-commons.js";
      }

      return defaultAppendChild.apply(context, args);
    }
  }
};
