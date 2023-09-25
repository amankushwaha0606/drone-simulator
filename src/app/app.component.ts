import { Component, OnInit } from '@angular/core';
import { MapService } from './services/map.service';
import { CommonService } from './services/common.service';
import { Subject, Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})

export class AppComponent implements OnInit {
  
  title = 'flytbaseDrone';
  markersData: any = [];
  droneMarker: any = [];
  mapBound: any = [];
  wantMarkers: boolean = false;
  textInput: string = "";
  textErrorMessage: string = '';

  currentStep: number[] = [];
  refreshTime: number[] = [];
  polylineArray: any = [];
  isStarted: boolean[] = [];
  isFinished: boolean[] = [];
  
  startTime: number[] = [];
  pauseTime: number[] = [];
  currentTimeOut: any = [];
  isPause: boolean[] = [];
  $resumeSubject: (Subject<any> | null)[] = [];
  resumeSubscription: (Subscription | null)[] = [];

  tempStep = [0, 0, 0];

  selectedColor: string = "#FF0000";
  routeColor: string[] = [];

  constructor(private mapService: MapService, private commonService: CommonService) {}

  ngOnInit() {
  }

  ngAfterViewInit() {
    if(this.mapService.isMapLoaded) {
      this.initializeMap();
    } else {
      this.mapService.isMapLoadedSubject.subscribe((res) => {
        if(res) {
          this.initializeMap();
        }
      })
    }
  }

  initializeMap() {
    const mapElement = this.mapService.getMapElement();
    document.getElementById('map-box-container')?.appendChild(mapElement);
  }

  addTextInput() {
    let jsonInput: any = this.commonService.convertInputToJSON(this.textInput);
    if(jsonInput && jsonInput.length) {
      console.log(jsonInput);
      this.markersData.push(jsonInput);
      this.drawLines(this.markersData.length - 1);
      this.textInput = ""
      this.textErrorMessage = '';
    } else {
      this.textErrorMessage = "Please input data in right format!"
    }
  }

  handleFile(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const jsonData = JSON.parse(e.target.result);
          this.markersData.push(jsonData.data);
          this.drawLines(this.markersData.length - 1);
        } catch (error) {
          console.error('Error parsing JSON:', error);
        }
      };
      reader.readAsText(file);
    }
  } 

  locateOnMap(droneIndex: number) {
    this.mapService.map.fitBounds(this.mapBound[droneIndex]);
  }

  initializeDrone() {
    this.currentStep.push(1)
    this.refreshTime.push(1000) 
    this.polylineArray.push([]);
    this.isStarted.push(false);
    this.isFinished.push(false);
    this.startTime.push(0)
    this.pauseTime.push(0)
    this.routeColor.push(this.selectedColor);
    this.currentTimeOut.push(null)
    this.isPause.push(false)
    this.$resumeSubject.push(new Subject<any>())
    this.resumeSubscription.push(null)
  }

  drawLines(droneIndex: number) {
    this.initializeDrone();
    this.mapBound[droneIndex] = this.mapService.getLatLngBound();
    for (let i = 0; i < this.markersData[droneIndex].length; i++) {
      let position = this.mapService.latLngPoint({lat: this.markersData[droneIndex][i].lat, lng: this.markersData[droneIndex][i].lng});
      if(i==0) {
        this.droneMarker.push(this.mapService.getMarker(position, droneIndex));
      }

      const line = this.mapService.drawLine(
        this.markersData[droneIndex][i],
        this.markersData[droneIndex][i + 1],
        this.selectedColor
      );
      line.setMap(this.mapService.map);
      this.polylineArray[droneIndex].push(line);

      this.mapBound[droneIndex].extend(position);
      if(this.wantMarkers) {
        let marker = this.mapService.getMarker(position, droneIndex);
      }
      // this.mapService.setMarker(marker);
    }
    this.mapService.map.fitBounds(this.mapBound[droneIndex]);
  }

  togglePause(droneIndex: number) {
    this.isPause[droneIndex] = !this.isPause[droneIndex];
    if(this.isPause[droneIndex]) {
      const now = new Date();
      this.pauseTime[droneIndex] = now.getTime(); 
      clearTimeout(this.currentTimeOut[droneIndex]);
      this.currentTimeOut[droneIndex] = null;
    } else {
      this.$resumeSubject[droneIndex]!.next({refreshTime: this.pauseTime[droneIndex] - this.startTime[droneIndex]});
    }
  }

  moveMarker(droneIndex: number) {
    if(!this.isStarted[droneIndex]) {
      this.isStarted[droneIndex] = true;
      this.routeColor[droneIndex] = this.selectedColor;
    }

    const moveInterval = Math.ceil((this.markersData[droneIndex][this.currentStep[droneIndex]].time - this.markersData[droneIndex][this.currentStep[droneIndex] - 1].time) / 1000);
    
    let latStep = (this.markersData[droneIndex][this.currentStep[droneIndex]].lat - this.markersData[droneIndex][this.currentStep[droneIndex] - 1].lat) / moveInterval;
    let lngStep = (this.markersData[droneIndex][this.currentStep[droneIndex]].lng - this.markersData[droneIndex][this.currentStep[droneIndex] - 1].lng) / moveInterval;
    this.tempStep[droneIndex] = 0;
    this.refreshTime[droneIndex] = (this.markersData[droneIndex][this.currentStep[droneIndex]].time - this.markersData[droneIndex][this.currentStep[droneIndex] - 1].time) / moveInterval;

    for (const line of this.polylineArray[droneIndex]) {
      line.setMap(null);
    }

    this.polylineArray[droneIndex].length = 0;
    for (let i = this.currentStep[droneIndex]; i < this.markersData[droneIndex].length - 1; i++) {
      const line = this.mapService.drawLine(
        this.markersData[droneIndex][i],
        this.markersData[droneIndex][i + 1],
        this.routeColor[droneIndex]
      );
      line.setMap(this.mapService.map);
      this.polylineArray[droneIndex].push(line);
    }

    let currentPathLine: any;
    this.resumeSubscription[droneIndex] = null;
    const move = (droneIndex: number) => {
      // for(let i=this.currentStep[droneIndex]; i<this.markersData[droneIndex].length; i++) {
      //   let position = this.mapService.latLngPoint({lat: this.markersData[droneIndex][i].lat, lng: this.markersData[droneIndex][i].lng});
      //   this.mapBound.extend(position);  
      // }
      this.tempStep[droneIndex] && this.droneMarker[droneIndex]!.setPosition({
        lat: this.droneMarker[droneIndex]!.getPosition()!.lat() + latStep,
        lng: this.droneMarker[droneIndex]!.getPosition()!.lng() + lngStep,
      });

      currentPathLine && currentPathLine.setMap(null);
      currentPathLine = this.mapService.drawLine(
        this.droneMarker[droneIndex]!.getPosition(),
        this.markersData[droneIndex][this.currentStep[droneIndex]],
        this.routeColor[droneIndex]
      );
      currentPathLine.setMap(this.mapService.map);

      // this.mapBound.extend(this.droneMarker[droneIndex]!.setPosition);
      // this.mapService.map.fitBounds(this.mapBound);
      this.tempStep[droneIndex]++;

      if (this.tempStep[droneIndex] <= moveInterval) {
        const now = new Date();
        this.startTime[droneIndex] = now.getTime();
        this.currentTimeOut[droneIndex] = setTimeout(()=>move(droneIndex), this.refreshTime[droneIndex]);
        if(!this.resumeSubscription[droneIndex]) {
          this.resumeSubscription[droneIndex] = this.$resumeSubject[droneIndex]!.subscribe((res) => {
            if(res) {
              clearTimeout(this.currentTimeOut[droneIndex]); // Clear the previous timeout
              this.currentTimeOut[droneIndex] = setTimeout(()=>move(droneIndex), res.refreshTime);
            }
          })
        }
      } else {
        this.currentStep[droneIndex]++;
        if(this.currentStep[droneIndex] < this.markersData[droneIndex].length){
          this.moveMarker(droneIndex);
        } else {
          this.isFinished[droneIndex] = true;
        }
      }
    }
    move(droneIndex);
  }
}
