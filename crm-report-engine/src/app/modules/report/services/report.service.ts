import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  constructor(  private http: HttpClient,) { }

  getUserNameandImage(oids: string[]) {
  return this.http.post<any>(
    '/api/opportunitiesV2/getUserNameandImage',
    { oids }
  );
}

}
