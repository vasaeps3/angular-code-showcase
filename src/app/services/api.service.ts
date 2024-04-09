import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, EMPTY, of } from 'rxjs';
import { Injectable } from '@angular/core';

interface HttpObjOptions {
  headers?: Record<string, string>;
  params?: Record<string, string>;
}

@Injectable()
export class ApiService {
  public readonly url: string = 'environment.baseUrl';

  constructor(private http: HttpClient) {}

  public getURLWithoutHeader<T>(
    path: string,
    options?: HttpObjOptions
  ): Observable<T> {
    const key: string = JSON.stringify({ path: path, options });
    const httpGet = this.http.get<T>(
      path,
      this.buildOptions({ params: options && options.params, headers: {} })
    );
    return httpGet;
  }

  public get<T>(path: string, options?: HttpObjOptions): Observable<T> {
    const httpGet = this.http.get<T>(
      this.buildPath(path),
      this.buildOptions(options)
    );

    return httpGet;
  }

  public post<T>(
    path: string,
    body?: Object,
    options?: HttpObjOptions
  ): Observable<T> {
    return this.http.post<T>(
      this.buildPath(path),
      body,
      this.buildOptions(options)
    );
  }

  public put<T>(
    path: string,
    body?: Object,
    options?: HttpObjOptions
  ): Observable<T> {
    return this.http.put<T>(
      this.buildPath(path),
      body,
      this.buildOptions(options)
    );
  }

  public patch<T>(
    path: string,
    body?: Object,
    options?: HttpObjOptions
  ): Observable<T> {
    return this.http.patch<T>(
      this.buildPath(path),
      body,
      this.buildOptions(options)
    );
  }

  public delete<T>(path: string, options?: HttpObjOptions): Observable<T> {
    return this.http.delete<T>(
      this.buildPath(path),
      this.buildOptions(options)
    );
  }

  private buildOptions(options?: HttpObjOptions) {
    const headers = (options && options.headers) || {
      'Content-Type': 'application/json',
    };
    const params = (options && options.params) || {};

    return {
      headers: this.toHttpHeaders(headers),
      params: this.toHttpParams(params),
    };
  }

  private toHttpHeaders(headers: Record<string, string>): HttpHeaders {
    return Object.getOwnPropertyNames(headers).reduce(
      (p, key) => p.set(key, headers[key]),
      new HttpHeaders()
    );
  }

  private toHttpParams(params: Record<string, string>): HttpParams {
    return Object.getOwnPropertyNames(params).reduce(
      (p, key) => p.set(key, params[key]),
      new HttpParams()
    );
  }

  private buildPath(path: string) {
    return `${this.url}${path}`;
  }

  public handleError(
    error: any,
    hideLoader = true,
    returnValue: Observable<any> = of(null)
  ): Observable<any> {
    if (hideLoader) {
      // this.uiService.hideLoader();
    }
    if (error.error && error.error.Codes) {
      // error.error.Codes.forEach((e) =>
      //   this.uiService.error(RESPONSE_API_ERROR_CODE[e])
      // );
    } else {
      if (error.message || error.code) {
        // this.uiService.error(error.message || error.code);
      } else {
        // this.uiService.error('error_server');
      }
    }
    return returnValue ? returnValue : EMPTY;
  }
}
