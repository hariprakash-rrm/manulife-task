import { Component, signal } from '@angular/core';
import { NgClass } from '@angular/common';

type NodeKind = 'client' | 'guard' | 'api' | 'service' | 'db' | 'cache' | 'infra';

interface FlowNode {
  id: string;
  label: string;
  sublabel?: string;
  kind: NodeKind;
  col: number;
  row: number;
}

interface FlowEdge {
  from: string;
  to: string;
  label?: string;
  dashed?: boolean;
}

interface Layer {
  id: string;
  label: string;
  description: string;
  color: string;
  cols: number[];
}

@Component({
  selector: 'app-flow-diagram',
  standalone: true,
  imports: [NgClass],
  templateUrl: './flow-diagram.component.html',
  styleUrl: './flow-diagram.component.css',
})
export class FlowDiagramComponent {
  activeNode = signal<FlowNode | null>(null);
  activeFlow = signal<string | null>(null);

  layers: Layer[] = [
    { id: 'browser', label: 'Browser', description: 'Angular 18 SPA served by Nginx', color: 'violet', cols: [0] },
    { id: 'angular', label: 'Angular App', description: 'Components, Guards, Services, HTTP Interceptors', color: 'indigo', cols: [1, 2] },
    { id: 'http', label: 'HTTP / REST', description: 'JSON over HTTPS · JWT Bearer auth', color: 'sky', cols: [3] },
    { id: 'nest', label: 'NestJS API', description: 'Controllers → Services → Repositories', color: 'emerald', cols: [4, 5, 6] },
    { id: 'data', label: 'Data Layer', description: 'MongoDB (persistent) · Redis (cache)', color: 'amber', cols: [7] },
  ];

  nodes: FlowNode[] = [
    // col 0 – Browser
    { id: 'browser', label: 'Browser', sublabel: 'User', kind: 'client', col: 0, row: 2 },

    // col 1 – Angular routing / guards
    { id: 'router', label: 'Angular Router', sublabel: 'RouterModule', kind: 'guard', col: 1, row: 1 },
    { id: 'auth-guard', label: 'AuthGuard', sublabel: 'canActivate', kind: 'guard', col: 1, row: 2 },
    { id: 'no-auth-guard', label: 'NoAuthGuard', sublabel: 'canActivate', kind: 'guard', col: 1, row: 3 },

    // col 2 – Angular pages
    { id: 'login-page', label: 'Login / Register', sublabel: 'auth pages', kind: 'client', col: 2, row: 0 },
    { id: 'dashboard', label: 'Dashboard', sublabel: 'shell layout', kind: 'client', col: 2, row: 1 },
    { id: 'portfolio-page', label: 'Portfolio Page', sublabel: 'home-portfolio', kind: 'client', col: 2, row: 2 },
    { id: 'assets-page', label: 'Assets Page', sublabel: 'CRUD + filters', kind: 'client', col: 2, row: 3 },
    { id: 'tx-page', label: 'Transactions', sublabel: 'history view', kind: 'client', col: 2, row: 4 },

    // col 3 – FE services / interceptors
    { id: 'auth-svc-fe', label: 'AuthService', sublabel: 'tokens · session', kind: 'service', col: 3, row: 0 },
    { id: 'portfolio-svc-fe', label: 'PortfolioService', sublabel: 'HTTP client', kind: 'service', col: 3, row: 2 },
    { id: 'jwt-interceptor', label: 'JWT Interceptor', sublabel: 'Bearer inject', kind: 'guard', col: 3, row: 4 },

    // col 4 – NestJS controllers
    { id: 'auth-ctrl', label: 'AuthController', sublabel: '/api/auth/*', kind: 'api', col: 4, row: 0 },
    { id: 'portfolio-ctrl', label: 'PortfoliosController', sublabel: '/api/portfolios/*', kind: 'api', col: 4, row: 2 },

    // col 5 – NestJS services
    { id: 'auth-svc-be', label: 'AuthService', sublabel: 'bcrypt · JWT', kind: 'service', col: 5, row: 0 },
    { id: 'users-svc', label: 'UsersService', sublabel: 'user CRUD', kind: 'service', col: 5, row: 1 },
    { id: 'portfolio-svc-be', label: 'PortfoliosService', sublabel: 'assets · tx · chart', kind: 'service', col: 5, row: 2 },

    // col 6 – Guards / Strategy
    { id: 'jwt-guard', label: 'JwtAuthGuard', sublabel: 'NestJS guard', kind: 'guard', col: 6, row: 0 },
    { id: 'jwt-strategy', label: 'JwtStrategy', sublabel: 'Passport', kind: 'guard', col: 6, row: 1 },
    { id: 'redis-svc', label: 'RedisService', sublabel: 'cache layer', kind: 'cache', col: 6, row: 2 },

    // col 7 – Data stores
    { id: 'mongodb', label: 'MongoDB', sublabel: 'Mongoose ODM', kind: 'db', col: 7, row: 1 },
    { id: 'redis', label: 'Redis', sublabel: 'chart cache', kind: 'cache', col: 7, row: 3 },
  ];

  edges: FlowEdge[] = [
    // Browser → Router
    { from: 'browser', to: 'router' },
    // Router → Guards
    { from: 'router', to: 'auth-guard' },
    { from: 'router', to: 'no-auth-guard' },
    // Guards → Pages
    { from: 'auth-guard', to: 'dashboard' },
    { from: 'auth-guard', to: 'portfolio-page' },
    { from: 'auth-guard', to: 'assets-page' },
    { from: 'auth-guard', to: 'tx-page' },
    { from: 'no-auth-guard', to: 'login-page' },
    // Pages → FE services
    { from: 'login-page', to: 'auth-svc-fe' },
    { from: 'dashboard', to: 'auth-svc-fe', dashed: true },
    { from: 'portfolio-page', to: 'portfolio-svc-fe' },
    { from: 'assets-page', to: 'portfolio-svc-fe' },
    { from: 'tx-page', to: 'portfolio-svc-fe' },
    // FE services → Interceptor → BE controllers
    { from: 'auth-svc-fe', to: 'auth-ctrl', label: 'POST /auth' },
    { from: 'portfolio-svc-fe', to: 'jwt-interceptor' },
    { from: 'jwt-interceptor', to: 'portfolio-ctrl', label: 'Bearer' },
    // BE controllers → BE services
    { from: 'auth-ctrl', to: 'auth-svc-be' },
    { from: 'portfolio-ctrl', to: 'portfolio-svc-be' },
    { from: 'portfolio-ctrl', to: 'jwt-guard' },
    // BE services → guards/strategy
    { from: 'auth-svc-be', to: 'users-svc' },
    { from: 'jwt-guard', to: 'jwt-strategy' },
    // BE services → data
    { from: 'users-svc', to: 'mongodb' },
    { from: 'portfolio-svc-be', to: 'mongodb' },
    { from: 'portfolio-svc-be', to: 'redis-svc' },
    { from: 'redis-svc', to: 'redis' },
  ];

  flows = [
    {
      id: 'login',
      label: 'Login Flow',
      color: 'indigo',
      description: 'User submits credentials → FE AuthService POSTs to /api/auth/login → AuthService validates password with bcrypt → issues JWT access + refresh tokens → stored in TokenService → redirect to dashboard.',
      nodes: ['browser', 'router', 'no-auth-guard', 'login-page', 'auth-svc-fe', 'auth-ctrl', 'auth-svc-be', 'users-svc', 'mongodb'],
    },
    {
      id: 'portfolio',
      label: 'Portfolio Fetch',
      color: 'emerald',
      description: 'Dashboard loads → PortfolioService sends GET /api/portfolios with JWT → JwtAuthGuard validates token → PortfoliosService queries MongoDB for assets and computes summary → Redis cache serves chart data if available.',
      nodes: ['browser', 'router', 'auth-guard', 'portfolio-page', 'portfolio-svc-fe', 'jwt-interceptor', 'portfolio-ctrl', 'jwt-guard', 'portfolio-svc-be', 'redis-svc', 'mongodb', 'redis'],
    },
    {
      id: 'asset',
      label: 'Add Asset',
      color: 'violet',
      description: 'User fills Add Asset form → AssetsComponent calls PortfolioService.addAsset() → POST /api/portfolios/assets with Bearer token → PortfoliosService creates asset document and records a BUY transaction in MongoDB → invalidates Redis cache.',
      nodes: ['browser', 'assets-page', 'portfolio-svc-fe', 'jwt-interceptor', 'portfolio-ctrl', 'jwt-guard', 'portfolio-svc-be', 'redis-svc', 'mongodb', 'redis'],
    },
  ];

  selectFlow(id: string) {
    this.activeFlow.update(cur => cur === id ? null : id);
    this.activeNode.set(null);
  }

  selectNode(node: FlowNode) {
    this.activeNode.update(cur => cur?.id === node.id ? null : node);
  }

  isNodeHighlighted(node: FlowNode): boolean {
    const flow = this.activeFlow();
    if (!flow) return false;
    const f = this.flows.find(f => f.id === flow);
    return f?.nodes.includes(node.id) ?? false;
  }

  getNodeClass(node: FlowNode): string {
    const highlighted = this.isNodeHighlighted(node);
    const active = this.activeNode()?.id === node.id;
    const hasFlow = !!this.activeFlow();

    const base = 'node ';
    const dim = hasFlow && !highlighted ? ' node-dim' : '';
    const sel = active ? ' node-selected' : '';
    return base + `node-${node.kind}` + dim + sel;
  }

  getKindLabel(kind: NodeKind): string {
    const map: Record<NodeKind, string> = {
      client: 'UI Component',
      guard: 'Guard / Strategy',
      api: 'REST Controller',
      service: 'Service',
      db: 'Database',
      cache: 'Cache Store',
      infra: 'Infrastructure',
    };
    return map[kind];
  }
}
