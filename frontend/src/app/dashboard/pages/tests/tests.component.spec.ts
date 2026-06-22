import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TestsComponent } from './tests.component';

describe('TestsComponent', () => {
  let component: TestsComponent;
  let fixture: ComponentFixture<TestsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should compile and render summary cards', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('System Test Runner');
    expect(compiled.textContent).toContain('Overall Progress');
  });

  it('should trigger runAll and update execution state', () => {
    expect(component.isBatchRunning()).toBe(false);
    component.runAll();
    expect(component.isBatchRunning()).toBe(true);
  });
});
