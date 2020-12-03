import { Component, ViewChild, ElementRef } from '@angular/core';

import { GoogleMapsOverlay } from '@deck.gl/google-maps';
import { TileLayer } from '@deck.gl/geo-layers';
import { VectorTile } from '@mapbox/vector-tile';
import Protobuf from 'pbf';

import { environment } from './../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  map: google.maps.Map;
  @ViewChild('mapWrapper', { static: false }) mapElement: ElementRef;

  zoom = 12
  center: google.maps.LatLngLiteral
  options: google.maps.MapOptions = {
    mapTypeId: 'hybrid',
    zoomControl: false,
    scrollwheel: false,
    disableDoubleClickZoom: true,
    maxZoom: 15,
    minZoom: 8,
  }

  ngAfterViewInit() {
    this.initializeMap();
  }

  initializeMap() {
    const lngLat = new google.maps.LatLng(-21.6756, -51.063);
    const mapOptions: google.maps.MapOptions = {
      center: lngLat,
      zoom: 15,
      fullscreenControl: false,
      mapTypeControl: false,
      streetViewControl: false
    };
    this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions,);

    // https://deck.gl/docs/api-reference/geo-layers/tile-layer
    // https://deck.gl/docs/api-reference/layers/geojson-layer
    const layer = new TileLayer({
      id: 'rota',

      stroked: false,

      getLineColor: (feature: any) => {
        // TODO alterar cor conforme os atributos.
        // let color;
        // let pit = feature.properties.pit
        // if (pit <= 0.13) {
        //   color = [0, 255, 0]
        // } else if (pit <= 0.28) {
        //   color = [255, 255, 0]
        // } else if (pit > 0.28) {
        //   color = [255, 0, 0]
        // } else {
        //   color = [0, 0, 0]
        // }
        return [66, 133, 244];
      },

      getLineWidth: (feature: any) => {
        return 5;
      },

      lineWidthMinPixels: 1,

      getTileData: ({ x, y, z }: {x: number, y: number, z: number}) => {
        const mapSource = `${environment.tileserverUrl}/${z}/${x}/${y}.pbf`;
        return fetch(mapSource)
          .then(response => response.arrayBuffer())
          .then(buffer => {
            const tile = new VectorTile(new Protobuf(buffer));
            const features = [];
            for (const layerName in tile.layers) {
              const vectorTileLayer = tile.layers[layerName];
              for (let i = 0; i < vectorTileLayer.length; i++) {
                const vectorTileFeature = vectorTileLayer.feature(i);
                const feature = vectorTileFeature.toGeoJSON(x, y, z);

                // TODO descobrir por que function_source nao funciona, alternativa abaixo:
                if (feature && feature.properties) {
                  const props = feature.properties;

                  if (props.cd_diretoria === 20901 && props.cd_municipio === 8853) {
                    features.push(feature);
                  }
                }
              }
            }
            return features;
          });
      },

      // Eventos direto no layer, precisa habilitar o pickable
      pickable: true,

      // onHover: (info, event) => {
      //   console.log('Hovered:', info, event);
      // },

      onClick: (info, event) => {
        console.log('Clicked:', info, event);
        console.log('Object:', info.object);
      }
    });

    const overlay = new GoogleMapsOverlay({
      layers: [layer],
    });

    // Eventos click mapa (implementacao de baixo nivel on onClick)
    // https://ubilabs.net/en/news/how-to-visualize-data-with-deck-gl-and-google-maps
    // https://deck.gl/docs/developer-guide/interactivity
    // this.map.addListener('click', (event: any) => {
    //   // TODO buscar ponto de intersects com rota where props.cd_diretoria === 20901 && props.cd_municipio === 8853
    //   const picked = overlay._deck.pickObject({
    //     x: event.pixel.x,
    //     y: event.pixel.y,
    //     radius: 4,
    //     layerIds: ['rota']
    //   });

    //   if (picked) {
    //     console.log('>>> selecionado', picked.object);
    //   }
    // });

    overlay.setMap(this.map);
  }


}

