import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { TokenService } from '../../core/services/token.service';
import { Router } from '@angular/router';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let mockTokenService: any;
  let mockRouter: any;

  beforeEach(() => {
    mockTokenService = {
      hasTokens: vi.fn(),
      getRefreshToken: vi.fn(),
      setTokens: vi.fn(),
      clearTokens: vi.fn(),
    };

    mockRouter = {
      navigate: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TokenService, useValue: mockTokenService },
        { provide: Router, useValue: mockRouter },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isLoggedIn', () => {
    it('should return true if tokenService has tokens', () => {
      mockTokenService.hasTokens.mockReturnValue(true);
      expect(service.isLoggedIn).toBe(true);
    });

    it('should return false if tokenService does not have tokens', () => {
      mockTokenService.hasTokens.mockReturnValue(false);
      expect(service.isLoggedIn).toBe(false);
    });
  });

  describe('register', () => {
    it('should call the register API and handle tokens on success', () => {
      const mockResponse = { accessToken: 'acc', refreshToken: 'ref', user: { id: '1', email: 'test@example.com' } };

      service.register('test@example.com', 'password').subscribe((res) => {
        expect(res).toEqual(mockResponse);
      });

      const req = httpMock.expectOne('/api/auth/register');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'test@example.com', password: 'password' });
      req.flush(mockResponse);

      expect(mockTokenService.setTokens).toHaveBeenCalledWith('acc', 'ref');
      service.user$.subscribe((user) => {
        expect(user).toEqual(mockResponse.user);
      });
    });
  });

  describe('login', () => {
    it('should call the login API and handle tokens on success', () => {
      const mockResponse = { accessToken: 'acc', refreshToken: 'ref', user: { id: '1', email: 'test@example.com' } };

      service.login('test@example.com', 'password').subscribe((res) => {
        expect(res).toEqual(mockResponse);
      });

      const req = httpMock.expectOne('/api/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'test@example.com', password: 'password' });
      req.flush(mockResponse);

      expect(mockTokenService.setTokens).toHaveBeenCalledWith('acc', 'ref');
    });
  });

  describe('refresh', () => {
    it('should call the refresh API and update tokens on success', () => {
      mockTokenService.getRefreshToken.mockReturnValue('old-ref');
      const mockResponse = { accessToken: 'new-acc', refreshToken: 'new-ref' };

      service.refresh().subscribe((res) => {
        expect(res).toEqual(mockResponse);
      });

      const req = httpMock.expectOne('/api/auth/refresh');
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Authorization')).toBe('Bearer old-ref');
      req.flush(mockResponse);

      expect(mockTokenService.setTokens).toHaveBeenCalledWith('new-acc', 'new-ref');
    });
  });

  describe('getMe', () => {
    it('should call the getMe API and update the current user', () => {
      const mockUser = { id: '1', email: 'test@example.com' };

      service.getMe().subscribe((user) => {
        expect(user).toEqual(mockUser);
      });

      const req = httpMock.expectOne('/api/auth/me');
      expect(req.request.method).toBe('GET');
      req.flush(mockUser);

      service.user$.subscribe((user) => {
        expect(user).toEqual(mockUser);
      });
    });
  });

  describe('logout', () => {
    it('should call the logout API and clear session on success', () => {
      service.logout();

      const req = httpMock.expectOne('/api/auth/logout');
      expect(req.request.method).toBe('POST');
      req.flush({});

      expect(mockTokenService.clearTokens).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should clear session even if logout API fails', () => {
      service.logout();

      const req = httpMock.expectOne('/api/auth/logout');
      expect(req.request.method).toBe('POST');
      req.flush('Error', { status: 500, statusText: 'Internal Server Error' });

      expect(mockTokenService.clearTokens).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('clearSession', () => {
    it('should clear tokens, reset user, and navigate to login', () => {
      service.clearSession();
      
      expect(mockTokenService.clearTokens).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
      
      service.user$.subscribe((user) => {
        expect(user).toBeNull();
      });
    });
  });
});
