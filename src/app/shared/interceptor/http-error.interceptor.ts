import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { catchError, throwError, Observable, retry, timeout, TimeoutError } from "rxjs";

@Injectable({ providedIn: 'root' })
export class HttpErrorInterceptor implements HttpInterceptor {


    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(req).pipe(
            timeout(120_000),
            retry({count: 1, delay: 1000}),
            catchError((error: any) => {

                console.error('HTTP Error: ', error);
                const message = this.handleError(error);

                return throwError(() => new HttpErrorResponse({
                    error: { message },
                    status: error.status,
                    url: error.url || req.url
                }));
            })
        );
    }

    private handleError(error: any): string {
        let message = 'Unexpected error occurred. Please try again.';

        if (error instanceof TimeoutError) {
            message = 'Request timed out. Please check your internet connection and try again.';
            return message;
        }

        if (error instanceof HttpErrorResponse) {
            if (error.status === 400) {
                message = error.error?.message || 'Invalid request. Please check your input and try again.';
            } else if (error.status === 403 && error.url?.includes('s3.amazonaws.com')) {
                message = 'Presigned URL expired. Please restart the upload.';
            } else if (error.status === 404) {
                message = 'Resource not found. Please verify the details and try again.';
            } else if (error.status === 500) {
                message = 'Server error occurred. Please try again later.';
            } else if (error.error?.message) {
                message = error.error.message;
            }
        }

        return message;
    }
}