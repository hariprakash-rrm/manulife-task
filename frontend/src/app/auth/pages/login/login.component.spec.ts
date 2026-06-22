import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { By } from '@angular/platform-browser';

describe('LoginComponent Integration', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockAuthService: any;
  let router: Router;

  beforeEach(async () => {
    mockAuthService = {
      login: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
  });

  it('should render the login form', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('form')).toBeTruthy();
    expect(compiled.querySelector('input[type="email"]')).toBeTruthy();
    expect(compiled.querySelector('input[type="password"]')).toBeTruthy();
  });

  it('should show validation errors on invalid submit', () => {
    const submitButton = fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement;
    submitButton.click();
    fixture.detectChanges();

    // Since the form is empty, it should have field errors
    expect(component.fieldErrors()['email']).toBeDefined();
    expect(component.fieldErrors()['password']).toBeDefined();
    expect(mockAuthService.login).not.toHaveBeenCalled();
  });

  it('should call authService and navigate on successful login', () => {
    mockAuthService.login.mockReturnValue(of({ accessToken: 'token' }));

    // Set valid form values
    component.form.controls.email.setValue('test@example.com');
    component.form.controls.password.setValue('password123');

    // Trigger submit
    const form = fixture.debugElement.query(By.css('form'));
    form.triggerEventHandler('ngSubmit', null);
    fixture.detectChanges();

    expect(mockAuthService.login).toHaveBeenCalledWith('test@example.com', 'password123');
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should show server error on failed login', () => {
    mockAuthService.login.mockReturnValue(throwError(() => ({ error: { message: 'Invalid credentials' } })));

    component.form.controls.email.setValue('test@example.com');
    component.form.controls.password.setValue('wrongpassword');

    const form = fixture.debugElement.query(By.css('form'));
    form.triggerEventHandler('ngSubmit', null);
    fixture.detectChanges();

    expect(mockAuthService.login).toHaveBeenCalledWith('test@example.com', 'wrongpassword');
    expect(component.serverError()).toBe('Invalid credentials');
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
