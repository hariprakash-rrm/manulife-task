import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { loadingInterceptor } from './loading.interceptor';
import { ToastService } from '../services/toast.service';
import { LoaderService } from '../services/loader.service';

describe('loadingInterceptor', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let toastService: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([loadingInterceptor])),
        provideHttpClientTesting(),
        {
          provide: LoaderService,
          useValue: {
            showMutate: vi.fn(),
            hideMutate: vi.fn(),
            showQuery: vi.fn(),
            hideQuery: vi.fn()
          }
        }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
    toastService = TestBed.inject(ToastService);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should intercept 429 error, trigger toast, and return modified error', async () => {
    const toastSpy = vi.spyOn(toastService, 'showError');

    const promise = new Promise<void>((resolve, reject) => {
      httpClient.get('/api/test-rate-limit').subscribe({
        next: () => {
          reject(new Error('Should have failed with 429'));
        },
        error: (error: HttpErrorResponse) => {
          try {
            expect(error.status).toBe(429);
            expect(error.error.message).toBe('Too many requests! Please wait until the next minute.');
            expect(toastSpy).toHaveBeenCalledWith('Too many requests! Please wait until the next minute.');
            resolve();
          } catch (err) {
            reject(err);
          }
        }
      });
    });

    const req = httpTestingController.expectOne('/api/test-rate-limit');
    req.flush('Too many requests', { status: 429, statusText: 'Too Many Requests' });

    await promise;
  });

  it('should pass other errors through', async () => {
    const toastSpy = vi.spyOn(toastService, 'showError');

    const promise = new Promise<void>((resolve, reject) => {
      httpClient.get('/api/test-other-error').subscribe({
        next: () => {
          reject(new Error('Should have failed'));
        },
        error: (error: HttpErrorResponse) => {
          try {
            expect(error.status).toBe(400);
            expect(toastSpy).not.toHaveBeenCalled();
            resolve();
          } catch (err) {
            reject(err);
          }
        }
      });
    });

    const req = httpTestingController.expectOne('/api/test-other-error');
    req.flush({ message: 'Bad request' }, { status: 400, statusText: 'Bad Request' });

    await promise;
  });
});
