'use babel';

import * as React from 'react';
import CodeMirror from 'codemirror'
import _ from 'lodash';
import * as jsyaml from 'js-yaml';
import { markdownRenderer } from 'inkdrop';
import { remote } from 'electron'

import csp from './csp';
import ol from './ol';

const fs = remote.require('fs');
const path = remote.require('path');
const defautlsYaml = fs.readFileSync(path.join(__dirname, 'defaults.yml'));

csp.patch();

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
  render() {
    try {
      this.parseConfig();
    } catch (e) {
      return (
        <div class="inkdrop-ol">
          <div class="inkdrop-ol-err">
            <div>OL config parse error:</div>
            <span>{e.message}</span>
          </div>
        </div>
      );
    }

    return React.createElement("div", {
      class: "inkdrop-ol",
      ref: el => {
        if (!el) return;
        this.el = el;
        if (!this.map) this.createMap();
        else this.updateMap();
      }
    });
  }

  parseConfig() {
    const userConfig = this.props.children && jsyaml.load(this.props.children[0]) || {}
    this.config = _.merge({}, defaults, userConfig, {
      bing: _.merge({}, defaults.bing, userConfig.bing),
      size: _.merge({}, defaults.size, userConfig.size),
      view: _.merge({}, defaults.view, userConfig.view),
      control: _.merge({}, defaults.control, userConfig.control),
      interaction: _.merge({}, defaults.interaction, userConfig.interaction),
      extra: _.merge({}, defaults.extra, userConfig.extra),
    });
  }

  updateSize() {
    if (!this.el) return;
    this.el.style = `height: ${this.config.size.fullscreen ? 'calc(100vh)' : this.config.size.height}`;
    if (!this.map) return;
    this.map.updateSize();
  }

  createMap() {
    this.updateSize();

    this.map = new ol.Map({
      target: this.el,
      controls: ol.control.defaults(this.config.control),
      interactions: ol.interaction.defaults(this.config.interaction),
      layers: this.getLayers(),
      view: new ol.View(this.config.view),
    });
  }

  updateMap() {
    this.updateSize();

    if (!this.map) {
      return;
    }

    this.map.getView().applyOptions_(this.config.view);

    this.map.getLayers().forEach(i => this.map.removeLayer(i));
    this.getLayers().forEach(i => this.map.addLayer(i));

    this.map.getInteractions().forEach(i => this.map.removeInteraction(i));
    ol.interaction.defaults(this.config.interaction).forEach(i => this.map.addInteraction(i));

    this.map.getControls().forEach(i => this.map.removeControl(i));
    ol.control.defaults(this.config.control).forEach(i => this.map.addControl(i));
  }

  getLayers() {
    const layerSources = [];
    const source = this.config.source.toLowerCase();

    switch (source) {
      case "bing":
        layerSources.push(new ol.source.BingMaps(this.config.bing));
        break;
      default:
        layerSources.push(new ol.source.OSM());
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

    return layerSources.map(source => new ol.layer.Tile({ source }));
  }
}
