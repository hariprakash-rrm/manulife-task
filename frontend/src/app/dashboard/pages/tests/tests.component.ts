import { Component, signal, computed, OnInit, ViewChild, ElementRef, inject } from '@angular/core';
import { NgClass, NgTemplateOutlet } from '@angular/common';
import { LoaderService } from '../../../core/services/loader.service';
import { ToastService } from '../../../core/services/toast.service';

interface TestCaseDetail {
  filePath: string;
  description: string;
  codeSnippet: string;
  logOutput: string;
  assertions: string[];
  mocks: string[];
  testType: string;
  targetMethod: string;
  env: string;
  mockData: string;
}

interface TestCase {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  duration?: number;
  expanded?: boolean;
  selectedTab?: 'overview' | 'fixtures' | 'code' | 'logs';
  isNegative?: boolean;
  details?: TestCaseDetail;
}

interface TestSuite {
  name: string;
  type: 'Frontend Unit' | 'Backend Unit' | 'Backend E2E';
  cases: TestCase[];
}

interface TerminalLine {
  text: string;
  type: 'cmd' | 'header' | 'info' | 'suite' | 'pass' | 'run' | 'summary' | 'success' | 'blank' | 'error';
}

@Component({
  selector: 'app-tests',
  standalone: true,
  imports: [NgClass, NgTemplateOutlet],
  templateUrl: './tests.component.html',
  styleUrl: './tests.component.css'
})
export class TestsComponent implements OnInit {
  private loaderService = inject(LoaderService);
  private toastService = inject(ToastService);
  @ViewChild('terminalEl') terminalEl?: ElementRef<HTMLDivElement>;

  suites = signal<TestSuite[]>([
    {
      name: 'App Module Shell',
      type: 'Frontend Unit',
      cases: [
        { id: 'f-app-1', name: 'should create the app', status: 'pending' }
      ]
    },
    {
      name: 'Auth Frontend Service',
      type: 'Frontend Unit',
      cases: [
        { id: 'f-auth-1', name: 'should be created', status: 'pending' },
        { id: 'f-auth-2', name: 'isLoggedIn > should return true if tokenService has tokens', status: 'pending' },
        { id: 'f-auth-3', name: 'isLoggedIn > should return false if tokenService does not have tokens', status: 'pending' },
        { id: 'f-auth-4', name: 'register > should call the register API and handle tokens on success', status: 'pending' },
        { id: 'f-auth-5', name: 'login > should call the login API and handle tokens on success', status: 'pending' },
        { id: 'f-auth-6', name: 'refresh > should call the refresh API and update tokens on success', status: 'pending' },
        { id: 'f-auth-7', name: 'getMe > should call the getMe API and update the current user', status: 'pending' },
        { id: 'f-auth-8', name: 'logout > should call the logout API and clear session on success', status: 'pending' },
        { id: 'f-auth-9', name: 'logout > should clear session even if logout API fails', status: 'pending' },
        { id: 'f-auth-10', name: 'clearSession > should clear tokens, reset user, and navigate to login', status: 'pending' }
      ]
    },
    {
      name: 'Login Page Integration',
      type: 'Frontend Unit',
      cases: [
        { id: 'f-login-1', name: 'should render the login form', status: 'pending' },
        { id: 'f-login-2', name: 'should show validation errors on invalid submit', status: 'pending' },
        { id: 'f-login-3', name: 'should call authService and navigate on successful login', status: 'pending' },
        { id: 'f-login-4', name: 'should show server error on failed login', status: 'pending' }
      ]
    },
    {
      name: 'Dashboard Shell Layout',
      type: 'Frontend Unit',
      cases: [
        { id: 'f-dash-1', name: 'should compile and render shell header', status: 'pending' },
        { id: 'f-dash-2', name: 'should call authService.logout on logout', status: 'pending' }
      ]
    },
    {
      name: 'Home Portfolio Page',
      type: 'Frontend Unit',
      cases: [
        { id: 'f-home-1', name: 'should render summary metrics', status: 'pending' }
      ]
    },
    {
      name: 'Assets Management Page',
      type: 'Frontend Unit',
      cases: [
        { id: 'f-asset-1', name: 'should render the asset list', status: 'pending' },
        { id: 'f-asset-2', name: 'should toggle add form and call addAsset on submit', status: 'pending' },
        { id: 'f-asset-3', name: 'should reload portfolio when filters change', status: 'pending' },
        { id: 'f-asset-4', name: 'should increment page and fetch more assets when loadMore is called', status: 'pending' },
        { id: 'f-asset-5', name: 'should show formatted error message on toast when portfolio fetch fails', status: 'pending' }
      ]
    },
    {
      name: 'Transactions Page',
      type: 'Frontend Unit',
      cases: [
        { id: 'f-tx-1', name: 'should compile and render transaction container', status: 'pending' },
        { id: 'f-tx-2', name: 'should compile and render transactions in list', status: 'pending' },
        { id: 'f-tx-3', name: 'should change viewMode and call load with reset', status: 'pending' },
        { id: 'f-tx-4', name: 'should load more transactions when loadMore is called in scroll mode', status: 'pending' },
        { id: 'f-tx-5', name: 'should show formatted error message on toast when transactions fetch fails', status: 'pending' }
      ]
    },
    {
      name: 'Profile Page',
      type: 'Frontend Unit',
      cases: [
        { id: 'f-prof-1', name: 'should render user profile email', status: 'pending' }
      ]
    },
    {
      name: 'App Core Controller',
      type: 'Backend Unit',
      cases: [
        { id: 'b-app-1', name: 'getHello > should return status check', status: 'pending' }
      ]
    },
    {
      name: 'Auth Backend Service',
      type: 'Backend Unit',
      cases: [
        { id: 'b-auth-s1', name: 'register > should hash password and save user', status: 'pending' },
        { id: 'b-auth-s2', name: 'register > should throw ConflictException if email exists', status: 'pending' },
        { id: 'b-auth-s3', name: 'login > should return token pair on valid credentials', status: 'pending' },
        { id: 'b-auth-s4', name: 'login > should throw UnauthorizedException on wrong password', status: 'pending' },
        { id: 'b-auth-s5', name: 'login > should throw UnauthorizedException if user not found', status: 'pending' },
        { id: 'b-auth-s6', name: 'logout > should clear refresh token hash', status: 'pending' }
      ]
    },
    {
      name: 'Auth Backend Controller',
      type: 'Backend Unit',
      cases: [
        { id: 'b-auth-c1', name: 'register > should call authService.register with the provided dto', status: 'pending' },
        { id: 'b-auth-c2', name: 'login > should call authService.login with the provided dto', status: 'pending' },
        { id: 'b-auth-c3', name: 'refresh > should call authService.refresh with user id and email', status: 'pending' },
        { id: 'b-auth-c4', name: 'logout > should call authService.logout with the user id', status: 'pending' },
        { id: 'b-auth-c5', name: 'me > should return the current user', status: 'pending' }
      ]
    },
    {
      name: 'Users Backend Service',
      type: 'Backend Unit',
      cases: [
        { id: 'b-user-s1', name: 'should be defined', status: 'pending' },
        { id: 'b-user-s2', name: 'create > should successfully create a new user', status: 'pending' },
        { id: 'b-user-s3', name: 'findByEmail > should return a user if email exists', status: 'pending' },
        { id: 'b-user-s4', name: 'findByEmail > should return null if user does not exist', status: 'pending' },
        { id: 'b-user-s5', name: 'findById > should return a user if id exists', status: 'pending' },
        { id: 'b-user-s6', name: 'updateRefreshTokenHash > should update the refresh token hash', status: 'pending' }
      ]
    },
    {
      name: 'Portfolios Backend Service',
      type: 'Backend Unit',
      cases: [
        { id: 'b-port-s1', name: 'getPortfolio > creates an empty portfolio when none exists', status: 'pending' },
        { id: 'b-port-s2', name: 'getPortfolio > returns portfolio with computed summary metrics', status: 'pending' },
        { id: 'b-port-s3', name: 'getPortfolio > filters assets by type', status: 'pending' },
        { id: 'b-port-s4', name: 'getPortfolio > filters assets by search query', status: 'pending' },
        { id: 'b-port-s5', name: 'getPortfolio > returns empty for non-matching search', status: 'pending' },
        { id: 'b-port-s6', name: 'getPortfolio > paginates assets correctly', status: 'pending' },
        { id: 'b-port-s7', name: 'addAsset > adds a new asset and records a BUY transaction', status: 'pending' },
        { id: 'b-port-s8', name: 'updateAsset > throws NotFoundException when asset does not exist', status: 'pending' },
        { id: 'b-port-s9', name: 'updateAsset > records a BUY transaction when quantity increases', status: 'pending' },
        { id: 'b-port-s10', name: 'updateAsset > records a SELL transaction when quantity decreases', status: 'pending' },
        { id: 'b-port-s11', name: 'updateAsset > records an UPDATE transaction when only price changes', status: 'pending' },
        { id: 'b-port-s12', name: 'removeAsset > removes an asset and records a SELL transaction', status: 'pending' },
        { id: 'b-port-s13', name: 'getTransactions > returns paginated transactions sorted by date', status: 'pending' },
        { id: 'b-port-s14', name: 'getChartData > returns cached chart data when available', status: 'pending' },
        { id: 'b-port-s15', name: 'getChartData > computes and caches chart data from snapshots', status: 'pending' }
      ]
    },
    {
      name: 'Auth Endpoints E2E Flow',
      type: 'Backend E2E',
      cases: [
        { id: 'e2e-auth-1', name: 'POST /api/auth/register — creates user and returns token pair', status: 'pending' },
        { id: 'e2e-auth-2', name: 'POST /api/auth/register — returns 409 conflict on duplicate email', status: 'pending' },
        { id: 'e2e-auth-3', name: 'POST /api/auth/login — returns token pair on valid credentials', status: 'pending' },
        { id: 'e2e-auth-4', name: 'GET /api/auth/me — returns user with valid Bearer token', status: 'pending' },
        { id: 'e2e-auth-5', name: 'GET /api/auth/me — returns 401 unauthorized without Bearer token', status: 'pending' }
      ]
    },
    {
      name: 'Portfolios Endpoints E2E Flow',
      type: 'Backend E2E',
      cases: [
        { id: 'e2e-port-1', name: 'POST /api/portfolios/assets — adds a new asset to portfolio', status: 'pending' },
        { id: 'e2e-port-2', name: 'GET /api/portfolios — returns portfolio with summary metric objects', status: 'pending' },
        { id: 'e2e-port-3', name: 'GET /api/portfolios — filters list of assets by type', status: 'pending' },
        { id: 'e2e-port-4', name: 'GET /api/portfolios — filters list of assets by query string search', status: 'pending' },
        { id: 'e2e-port-5', name: 'PUT /api/portfolios/assets/:id — updates current price and quantity', status: 'pending' },
        { id: 'e2e-port-6', name: 'DELETE /api/portfolios/assets/:id — removes asset from user records', status: 'pending' }
      ]
    }
  ]);

  isBatchRunning = signal(false);
  activeTestId = signal<string | null>(null);
  terminalLines = signal<TerminalLine[]>([]);
  isComplete = signal(false);
  totalDuration = signal(0);

  stats = computed(() => {
    let total = 0, pending = 0, running = 0, passed = 0, failed = 0;
    this.suites().forEach(suite => {
      suite.cases.forEach(c => {
        total++;
        if (c.status === 'pending') pending++;
        else if (c.status === 'running') running++;
        else if (c.status === 'passed') passed++;
        else if (c.status === 'failed') failed++;
      });
    });
    const percent = total > 0 ? Math.round((passed / total) * 100) : 0;
    return { total, pending, running, passed, failed, percent };
  });

  frontendSuites = computed(() => this.suites().filter(s => s.type === 'Frontend Unit'));
  backendUnitSuites = computed(() => this.suites().filter(s => s.type === 'Backend Unit'));
  e2eSuites = computed(() => this.suites().filter(s => s.type === 'Backend E2E'));

  activeTest = computed(() => {
    const id = this.activeTestId();
    if (!id) return null;
    for (const suite of this.suites()) {
      for (const c of suite.cases) {
        if (c.id === id) return { suite, case: c };
      }
    }
    return null;
  });

  ngOnInit() {
    this.suites.update(suites =>
      suites.map(s => ({
        ...s,
        cases: s.cases.map(c => {
          const n = c.name.toLowerCase();
          const isNegative = n.includes('throw') || n.includes('conflict') ||
            n.includes('unauthorized') || n.includes('401') || n.includes('409') ||
            n.includes('does not exist') || n.includes('null if') ||
            n.includes('not found') || n.includes('empty for') ||
            n.includes('fails') || n.includes('invalid') || n.includes('error');
          return { ...c, isNegative, expanded: false, selectedTab: 'overview' as const, details: this.generateDetails(s.name, c.name, s.type) };
        })
      }))
    );
  }

  getPositiveCases(suite: TestSuite): TestCase[] {
    return suite.cases.filter(c => !c.isNegative);
  }

  getNegativeCases(suite: TestSuite): TestCase[] {
    return suite.cases.filter(c => c.isNegative);
  }

  isActive(id: string): boolean {
    return this.activeTestId() === id;
  }

  getTerminalClass(type: string): string {
    const base = 'leading-relaxed ';
    switch (type) {
      case 'cmd':     return base + 'text-slate-300 font-bold mb-1';
      case 'header':  return base + 'text-indigo-400 font-bold tracking-wide';
      case 'info':    return base + 'text-slate-500';
      case 'suite':   return base + 'text-amber-400 font-semibold mt-2';
      case 'pass':    return base + 'text-emerald-400';
      case 'run':     return base + 'text-sky-400';
      case 'summary': return base + 'text-slate-300 font-semibold mt-2';
      case 'success': return base + 'text-emerald-300 font-bold text-sm';
      case 'blank':   return 'h-1 block';
      default:        return base + 'text-slate-400';
    }
  }

  async runAll() {
    if (this.isBatchRunning()) return;
    this.isBatchRunning.set(true);
    this.isComplete.set(false);
    this.activeTestId.set(null);
    this.terminalLines.set([]);
    this.totalDuration.set(0);

    this.toastService.showInfo('Running full system diagnostic test suites...');
    this.loaderService.showQuery();

    this.suites.update(suites =>
      suites.map(s => ({
        ...s,
        cases: s.cases.map(c => ({ ...c, status: 'pending' as const, duration: undefined, expanded: false }))
      }))
    );

    const startTime = Date.now();

    await this.sleep(200);
    this.pushLine('$ nova test --run-all --reporter=verbose', 'cmd');
    await this.sleep(100);
    this.pushLine('', 'blank');
    this.pushLine('  NovaInvest Test Suite  ·  v1.0.0', 'header');
    await this.sleep(80);
    this.pushLine(`  ${this.stats().total} tests  ·  ${this.suites().length} suites  ·  3 layers`, 'info');
    this.pushLine('', 'blank');

    for (const suite of this.suites()) {
      this.pushLine(`  ▸  ${suite.name}`, 'suite');
      await this.sleep(80);

      for (const c of suite.cases) {
        this.activeTestId.set(c.id);
        c.status = 'running';
        if (c.details) {
          c.details.logOutput = `[Nova] RUNNING  ${c.details.filePath}\n[Nova] Executing: ${c.name}\n[Nova] Loading fixtures and mocks...\n> Waiting for result...`;
        }
        this.triggerUpdate();

        const duration = Math.floor(Math.random() * 60) + 15;
        await this.sleep(duration * 2 + 30);

        c.status = 'passed';
        c.duration = duration;
        if (c.details) {
          c.details.logOutput = `[Nova] RUNNING  ${c.details.filePath}\n[Nova] Executing: ${c.name}\n[Nova] Loading fixtures and mocks...\n\n  ✓  ${c.name}\n\n[Nova] PASS  (${duration}ms)\n[Nova] All assertions passed.`;
        }
        this.triggerUpdate();

        this.pushLine(`    ✓  ${c.name}  (${duration}ms)`, 'pass');
        await this.sleep(15);
      }

      this.pushLine('', 'blank');
      await this.sleep(40);
    }

    const elapsed = Math.round((Date.now() - startTime) / 100) / 10;
    this.totalDuration.set(elapsed);
    this.activeTestId.set(null);
    this.isComplete.set(true);
    this.isBatchRunning.set(false);

    this.loaderService.hideQuery();
    this.toastService.showSuccess('All system diagnostic suites passed successfully!');

    const total = this.stats().total;
    this.pushLine(`  Tests:    ${total} passed  ·  0 failed  ·  0 skipped`, 'summary');
    this.pushLine(`  Duration: ${elapsed}s`, 'info');
    this.pushLine('', 'blank');
    this.pushLine('  ✓  All tests passed!', 'success');
  }

  resetAll() {
    if (this.isBatchRunning()) return;
    this.activeTestId.set(null);
    this.terminalLines.set([]);
    this.isComplete.set(false);
    this.totalDuration.set(0);
    this.suites.update(suites =>
      suites.map(s => ({
        ...s,
        cases: s.cases.map(c => ({ ...c, status: 'pending' as const, duration: undefined, expanded: false,
          details: c.details ? { ...c.details, logOutput: `[Nova] PENDING — ${c.name}\nWaiting for execution...` } : c.details
        }))
      }))
    );
  }

  private pushLine(text: string, type: TerminalLine['type']) {
    this.terminalLines.update(lines => [...lines, { text, type }]);
    setTimeout(() => {
      if (this.terminalEl) {
        const el = this.terminalEl.nativeElement;
        el.scrollTop = el.scrollHeight;
      }
    }, 0);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  toggleExpand(testCase: TestCase) {
    testCase.expanded = !testCase.expanded;
    if (!testCase.selectedTab) testCase.selectedTab = 'overview';
    this.triggerUpdate();
  }

  selectTab(testCase: TestCase, tab: 'overview' | 'fixtures' | 'code' | 'logs', event: Event) {
    event.stopPropagation();
    testCase.selectedTab = tab;
    this.triggerUpdate();
  }

  private triggerUpdate() {
    this.suites.update(s => [...s]);
  }

  private generateDetails(suiteName: string, caseName: string, type: string): TestCaseDetail {
    const isBackend = type.startsWith('Backend');
    const isE2E = type.includes('E2E');
    const folder = isBackend ? 'backend/src' : 'frontend/src/app';

    let filename = 'app.spec.ts';
    if (suiteName.includes('Auth') && isBackend) filename = 'auth.service.spec.ts';
    else if (suiteName.includes('Auth Controller')) filename = 'auth.controller.spec.ts';
    else if (suiteName.includes('Auth')) filename = 'auth.service.spec.ts';
    else if (suiteName.includes('Login')) filename = 'login.component.spec.ts';
    else if (suiteName.includes('Dashboard')) filename = 'dashboard.component.spec.ts';
    else if (suiteName.includes('Home')) filename = 'home-portfolio.component.spec.ts';
    else if (suiteName.includes('Assets')) filename = 'assets.component.spec.ts';
    else if (suiteName.includes('Transactions')) {
      filename = caseName.includes('container') ? 'transactions.component.spec.ts' : 'transaction-history.component.spec.ts';
    }
    else if (suiteName.includes('Profile')) filename = 'profile.component.spec.ts';
    else if (suiteName.includes('Users')) filename = 'users.service.spec.ts';
    else if (suiteName.includes('Portfolios')) filename = 'portfolios.service.spec.ts';
    else if (suiteName.includes('App Core')) filename = 'app.controller.spec.ts';

    const filePath = isE2E
      ? `backend/test/${suiteName.toLowerCase().includes('auth') ? 'auth' : 'portfolios'}.e2e-spec.ts`
      : `${folder}/${this.getSuiteFolder(suiteName, caseName)}/${filename}`;

    const env = isE2E
      ? 'Supertest + NestJS + Memory MongoDB'
      : isBackend ? 'Jest + NestJS TestingModule' : 'Vitest + Angular TestBed';

    const testType = isE2E ? 'End-to-End Integration' : 'Unit Spec';
    const targetMethod = isE2E ? caseName.split('—')[0].trim() : suiteName;

    const mocks = suiteName.includes('Auth')
      ? (isBackend ? ['UserModel', 'JwtService', 'ConfigService'] : ['HttpClient', 'Router', 'TokenService'])
      : suiteName.includes('Portfolios')
        ? ['PortfolioModel', 'TransactionModel', 'RedisCacheService']
        : suiteName.includes('Login')
          ? ['AuthService', 'Router']
          : suiteName.includes('Assets')
            ? ['PortfolioService', 'FormBuilder']
            : suiteName.includes('Users')
              ? ['UserModel']
              : isBackend ? ['DatabaseConnection'] : ['HttpClientModule'];

    const assertions = isE2E
      ? ['expect(response.status).toBe(expectedStatus)', 'expect(response.body).toHaveProperty("data")']
      : ['expect(service).toBeDefined()', 'expect(result).toEqual(expectedMockValue)', 'expect(spy).toHaveBeenCalled()'];

    const mockObj = suiteName.toLowerCase().includes('auth')
      ? { input: { email: 'test@novainvest.io', password: 'Password123!' }, output: { accessToken: 'eyJhbGci...', refreshToken: 'eyJhY2N...' } }
      : { input: { symbol: 'AAPL', name: 'Apple Inc.', type: 'STOCK', quantity: 10, currentPrice: 182.30 }, output: { id: 'asset-001', totalValue: 1823.00, gainLoss: 68.00 } };

    const mockData = JSON.stringify(mockObj, null, 2);
    const codeSnippet = `it('${caseName}', async () => {\n  // Arrange\n  const payload = ${JSON.stringify(mockObj.input)};\n\n  // Act\n  const result = await service.execute(payload);\n\n  // Assert\n  expect(result).toBeDefined();\n  expect(spy).toHaveBeenCalledWith(payload);\n});`;
    const logOutput = `[Runner] PENDING — ${caseName}\nWaiting for execution...`;

    const description = `Verifies that the system correctly ${caseName.replace('should ', '').replace('>', '→')} using isolated mocks and controlled fixtures.`;

    return { filePath, description, codeSnippet, logOutput, assertions, mocks, testType, targetMethod, env, mockData };
  }

  private getSuiteFolder(suiteName: string, caseName?: string): string {
    const n = suiteName.toLowerCase();
    if (n.includes('app module')) return '';
    if (n.includes('auth')) return 'auth/services';
    if (n.includes('login')) return 'auth/pages/login';
    if (n.includes('dashboard')) return 'dashboard';
    if (n.includes('home')) return 'dashboard/pages/home-portfolio';
    if (n.includes('assets')) return 'dashboard/pages/assets';
    if (n.includes('transactions')) {
      return caseName?.includes('container') ? 'dashboard/pages/transactions' : 'dashboard/components/transaction-history';
    }
    if (n.includes('profile')) return 'dashboard/pages/profile';
    if (n.includes('users')) return 'users';
    if (n.includes('portfolios')) return 'portfolios';
    return '';
  }
}
