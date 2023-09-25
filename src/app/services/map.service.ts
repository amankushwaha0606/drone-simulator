import { Injectable } from '@angular/core';
import { CommonService } from './common.service';
import { Subject } from 'rxjs';

declare var google: any;

@Injectable({
  providedIn: 'root',
})
export class MapService {
  isMapLoaded: boolean = false;
  map: any;
  markers = [];
  geocoder: any;
  isMapLoadedSubject = new Subject<boolean>();
  private mapElement: HTMLElement;

  constructor(private commonService: CommonService) {
    this.mapElement = document.createElement('div');
    this.mapElement.id = 'map';
    this.commonService
      .loadScript(
        'https://maps.googleapis.com/maps/api/js?key=AIzaSyBjRCsMcqBllErre8un4hFus0W4CYSxQPk',
        'map'
      )
      .then((res) => {
        this.initializeMap();
        this.isMapLoaded = true;
        this.isMapLoadedSubject.next(true);
      });
  }

  getMarker(position: any, label: any) {
    return new google.maps.Marker({
      position: position,
      map: this.map,
      draggable: false,
      label: String(label),
    });
  }


  latLngPoint(latlng: any) {
    return new google.maps.LatLng(latlng);
  }

  getLatLngBound() {
    return new google.maps.LatLngBounds();
  }

  getMapElement() {
    return this.mapElement;
  }

  // removeAllMarkers() {
  //   this.markers.map((marker) => {
  //     marker.setMap(null);
  //   });
  // }

  setMarker(marker: any) {
    // this.markers.push(marker);
  }

  initializeMap() {
    let mapProp = {
      center: this.latLngPoint({ lat: 26.4499, lng: 80.3319 }),
      zoom: 15,
      scrollwheel: true,
      noClear: true,
      panControl: false,
      zoomControl: true,
      mapTypeControl: true,
      minZoom: 1,
      maxZoom: 18,
      draggable: true,
      disableDefaultUI: false,
      backgroundColor: '#333333',
      pan: true,
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_TOP,
      },
      mapTypeControlOptions: {
        position: google.maps.ControlPosition.TOP_RIGHT,
      },
    };
    this.map = new google.maps.Map(this.mapElement, mapProp);
    this.geocoder = new google.maps.Geocoder();
  }

  drawLine(pointA: any, pointB: any, color: string) {
    return new google.maps.Polyline({
      path: [pointA, pointB],
      geodesic: true,
      strokeColor: color,
      strokeOpacity: 1.0,
      strokeWeight: 2,
    });
  }
}