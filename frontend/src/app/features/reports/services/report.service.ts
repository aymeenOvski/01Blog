import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReportRequest, ReportResponse } from '../models/report.model';

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  private readonly apiUrl = '/api/reports';

  constructor(private http: HttpClient) { }

  submitReport(request: ReportRequest): Observable<ReportResponse> {
    return this.http.post<ReportResponse>(
      this.apiUrl,
      request
    );
  }
}
