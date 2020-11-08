'use babel';

let loaded = false;

module.exports = {
  getOLGoogleMaps: () => require('./olgm/OLGoogleMaps.js'),
  getGoogleLayer: () => require('./olgm/layer/Google.js'),
  getInteraction: () => require('./olgm/interaction.js'),

  loadGMaps: (remote, key) => {
    if (loaded) return null;
    loaded = true;
    return fetch(`https://maps.googleapis.com/maps/api/js?v=3&key=${key}`)
      .then(res => res.text().then(r => remote.getCurrentWebContents().executeJavaScript(r)));
  }
};
