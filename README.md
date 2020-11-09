# OpenLayers map integration for Inkdrop

Supports OpenStreetMaps, Bing Maps and Google Maps.

## Install
```
ipm install ol
```

## Example

### Bing Maps
    ```ol
    source: bing

    view:
      # The center coordinates can be taken from Google Maps
      center: [34.652500, 135.506302]
      zoom: 9
    ```

<img width="500px" src="https://user-images.githubusercontent.com/5616486/98526560-9375dd00-2282-11eb-9eca-b92f8ead32db.png" />


### Center Marker
    ```ol
    centerMarker:
      enabled: true
      scale: 1
    ```

<img width="500px" src="https://user-images.githubusercontent.com/5616486/98551938-9256a700-22a6-11eb-92d6-d0184210a2d6.png" />

### Custom Marker
    ```ol
    centerMarker:
      enabled: true
      scale: 1
      anchor: [0.5, 1]
      src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAA...'
    ```

<img width="500px" src="https://user-images.githubusercontent.com/5616486/98552375-0d1fc200-22a7-11eb-9034-ac9e83d7186a.png" />


<br/>

## Usage

### See all available options here: [defaults.yml](https://github.com/ventsislav-georgiev/inkdrop-ol/blob/main/lib/defaults.yml)

<br/>

### Default options
![image](https://user-images.githubusercontent.com/5616486/98472048-fa4eb400-21f8-11eb-97e8-90dc60d5cf1a.png)

### Advanced options
![image](https://user-images.githubusercontent.com/5616486/98472034-e1460300-21f8-11eb-8dd0-25d277c92589.png)

### Google Maps
> Does not work without API Key

![image](https://user-images.githubusercontent.com/5616486/98488878-2fc4c300-2234-11eb-8822-2a7c2d5e3c21.png)

<br/>

## Version history
See the [CHANGELOG.md](https://github.com/ventsislav-georgiev/inkdrop-ol/blob/main/CHANGELOG.md) for an overview of what changed in each update.

<br/>

## Attributions

Marker icon `pin` by [ONN Digital](https://www.iconfinder.com/ONNDigital)
