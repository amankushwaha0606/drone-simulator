import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CommonService {
  constructor() {}

  loadScript(url: string, id: string) {
    return new Promise((resolve, reject) => {
      if (document.getElementById(id)) {
        resolve(true);
      }
      const script = document.createElement('script');
      script.async = true;
      script.defer = true;
      script.src = url;
      script.id = id;
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        reject(true);
      };
      document.head.appendChild(script);
    });
  }

  convertInputToJSON(inputText: string) {
    const inputLines = inputText.trim().split('\n');
    const data = [];

    for (const line of inputLines) {
      const [latStr, lngStr, timeStr] = line
        .split(',')
        .map((item) => item.trim());
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      const time = parseInt(timeStr, 10);

      if (!isNaN(lat) && !isNaN(lng) && !isNaN(time)) {
        data.push({ lat, lng, time });
      } else {
        return {
          data: [],
          message: 'error',
        };
      }
    }
    return data;
  }
}
