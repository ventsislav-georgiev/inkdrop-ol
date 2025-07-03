'use babel';

import * as React from 'react';
import CodeMirror from 'codemirror'
import { markdownRenderer } from 'inkdrop';
import { remote } from 'electron'

import _ from 'lodash';
import * as jsyaml from 'js-yaml';

import csp from './csp';
import ol from './ol';
import olgm from './olgm';

const fs = remote.require('fs');
const path = remote.require('path');
const defautlsYaml = fs.readFileSync(path.join(__dirname, 'defaults.yml'));

csp.patch(remote);

const yamlModeInfo = {
  name: 'ol',
  mime: 'text/x-yaml',
};

module.exports = {
  activate() {
    markdownRenderer.remarkCodeComponents.ol = OpenLayers;
    if (CodeMirror) {
      CodeMirror.modeInfo.push(yamlModeInfo)
    }
  },
  deactivate() {
    markdownRenderer.remarkCodeComponents.ol = null;
    if (CodeMirror) {
      const { modeInfo } = CodeMirror
      const i = modeInfo.indexOf(yamlModeInfo)
      if (i >= 0) modeInfo.splice(i, 1)
    }
  }
};

const defaults = jsyaml.safeLoad(defautlsYaml);

class OpenLayers extends React.Component {
  constructor() {
    super()
    this.updateMap = _.debounce(this.updateMap.bind(this), 1200, { leading: false });
  }

  render() {
    const onError = (e) => {
      return (
        <div class="inkdrop-ol">
          <div class="inkdrop-ol-err">
            <div>OL config parse error:</div>
            <span>{e.message}</span>
          </div>
        </div>
      );
    };

    try {
      this.parseConfig();
      return React.createElement("div", {
        class: "inkdrop-ol",
        ref: el => {
          if (!el) return;
          this.el = el;
          if (!this.map) this.createMap();
          else this.updateMap();
        }
      });
    } catch (e) {
      return onError(e);
    }
  }

  parseConfig() {
    const userConfig = this.props.children && jsyaml.load(this.props.children[0]) || {}
    this.config = _.merge({}, defaults, userConfig, {
      bing: _.merge({}, defaults.bing, userConfig.bing),
      gmaps: _.merge({}, defaults.gmaps, userConfig.gmaps),
      size: _.merge({}, defaults.size, userConfig.size),
      centerMarker: _.merge({}, defaults.centerMarker, userConfig.centerMarker),
      view: _.merge({}, defaults.view, userConfig.view),
      control: _.merge({}, defaults.control, userConfig.control),
      interaction: _.merge({}, defaults.interaction, userConfig.interaction),
      extra: _.merge({}, defaults.extra, userConfig.extra),
    });

    if (this.config.view.center && this.config.view.center.length) {
      this.config.view.center = ol.proj.fromLonLat(this.config.view.center.reverse());
    }

    if (this.config.view.extent && this.config.view.extent.length == 2 && this.config.view.extent.every(arr => arr.length)) {
      this.config.view.extent = this.config.view.extent.flatMap(arr => ol.proj.fromLonLat(arr.reverse()))
    }

    this.isgmaps = this.config.source === 'gmaps';
    if (this.isgmaps && !this.config.gmaps.key) {
      throw new Error('Missing API KEY for Google Maps.\n\nInstructions here: https://developers.google.com/maps/documentation/javascript/get-api-key');
    }
  }

  updateSize() {
    if (!this.el) return;
    this.el.style = `height: ${this.config.size.fullscreen ? 'calc(85vh)' : this.config.size.height}`;
    if (!this.map) return;
    this.map.updateSize();
  }

  createMap() {
    this.updateSize();

    this.map = new ol.Map({
      target: this.el,
      controls: ol.control.defaults(this.config.control),
      interactions: (this.isgmaps ? olgm.getInteraction() : ol.interaction).defaults(this.config.interaction),
      layers: this.getLayers(),
      view: new ol.View(this.config.view),
    });
  }

  updateMap() {
    if (this.isgmaps && (!window.google || !window.google.maps || !window.google.maps.OverlayView)) {
      setTimeout(() => this.updateMap(), 500);
      return;
    }

    this.updateSize();

    if (!this.map) {
      return;
    }

    this.map.getView().applyOptions_(this.config.view);

    this.map.getLayers().forEach(i => this.map.removeLayer(i));
    this.getLayers().forEach(i => this.map.addLayer(i));

    this.map.getInteractions().forEach(i => this.map.removeInteraction(i));
    (this.isgmaps ? olgm.getInteraction() : ol.interaction).defaults(this.config.interaction).forEach(i => this.map.addInteraction(i));

    this.map.getControls().forEach(i => this.map.removeControl(i));
    ol.control.defaults(this.config.control).forEach(i => this.map.addControl(i));

    if (!this.olgm && this.isgmaps) {
      const OLGoogleMaps = olgm.getOLGoogleMaps();
      this.olgm = new OLGoogleMaps({ map: this.map });
      this.gmap = this.olgm.getGoogleMapsMap();
    }
    if (this.olgm && this.isgmaps) this.olgm.activate();
    if (this.olgm && !this.isgmaps) this.olgm.deactivate();

    if (this.isgmaps) {
      setTimeout(() => this.gmap.setMapTypeId(this.config.gmaps.mapType));
      if (this.config.gmaps.traffic && this.trafficLayer) this.trafficLayer.setMap(this.gmap);
    }
  }

  getLayers() {
    const layers = [];
    const layerSources = [];
    const source = (this.config.source || 'osm').toLowerCase();

    switch (source) {
      case "bing":
        layerSources.push(new ol.source.BingMaps(this.config.bing));
        break;
      case "gmaps":
        const result = olgm.loadGMaps(remote, this.config.gmaps.key);
        if (result) {
          result.then(() => this.updateMap());
          return [];
        }

        const GoogleLayer = olgm.getGoogleLayer();
        layers.push(new GoogleLayer());

        if (this.config.gmaps.traffic && !this.trafficLayer) {
          this.trafficLayer = new google.maps.TrafficLayer();
        } else if (!this.config.gmaps.traffic && this.trafficLayer) {
          this.trafficLayer.setMap(null);
        }
        break;
      default:
        layerSources.push(new ol.source.OSM());
    }

    if (this.config.centerMarker.enabled) {
      const iconFeature = new ol.Feature({ geometry: new ol.geom.Point(this.config.view.center) });
      const iconStyle = new ol.style.Style({ image: new ol.style.Icon(this.config.centerMarker) });
      iconFeature.setStyle(iconStyle);
      const vectorSource = new ol.source.Vector({ features: [iconFeature] });
      layers.push(new ol.layer.Vector({ source: vectorSource }));
    }

    if (this.config.extra.canvasTiles) {
      layerSources.push(new ol.source.TileDebug());
    }

    if (this.config.extra.cartoDb) {
      const cartoDbLayer = {
        type: 'cartodb',
        options: {
          cartocss_version: '2.1.1',
          cartocss: `#layer { ${this.config.extra.cartoDbCss} }`,
          sql: this.config.extra.cartoDbSql,
        }
      };

      if (this.config.extra.cartoDbSubSql) {
        cartoDbLayer.sublayers = [{
          sql: this.config.extra.cartoDbSubSql,
          cartocss_version: '2.1.1',
          cartocss: this.config.extra.cartoDbSubCss
        }];
      }

      layerSources.push(new ol.source.CartoDB({
        account: this.config.extra.cartoDbAccount,
        config: {
          layers: [cartoDbLayer],
        },
      }));
    }

    return layerSources.map(source => new ol.layer.Tile({ source })).concat(layers);
  }
}
