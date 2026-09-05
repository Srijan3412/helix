import { FeatureCluster, Interchange, ExecutionTraceData, FeatureImportanceItem } from './types';

export const mockFeatureClusters: FeatureCluster[] = [
  {
    id: 'auth',
    name: 'Authentication',
    color: '#10B981',
    files: ['authRoutes.ts', 'authController.ts', 'authService.ts', 'jwt.ts', 'authMiddleware.ts'],
    routes: ['/api/auth/login', '/api/auth/logout', '/api/auth/register', '/api/auth/refresh'],
    databases: ['PostgreSQL', 'Redis'],
    health: 88,
    confidence: 94
  },
  {
    id: 'users',
    name: 'User Management',
    color: '#3B82F6',
    files: ['userRoutes.ts', 'userController.ts', 'userService.ts', 'userRepository.ts'],
    routes: ['/api/users', '/api/users/:id', '/api/users/profile'],
    databases: ['PostgreSQL'],
    health: 92,
    confidence: 90
  },
  {
    id: 'billing',
    name: 'Billing & Payments',
    color: '#F59E0B',
    files: ['billingRoutes.ts', 'billingController.ts', 'billingService.ts', 'paymentService.ts', 'subscriptionRepository.ts'],
    routes: ['/api/billing/subscribe', '/api/billing/cancel', '/api/billing/invoice'],
    databases: ['PostgreSQL', 'Stripe'],
    health: 76,
    confidence: 85
  },
  {
    id: 'admin',
    name: 'Admin Control',
    color: '#EF4444',
    files: ['adminRoutes.ts', 'adminController.ts', 'adminMiddleware.ts'],
    routes: ['/api/admin/users', '/api/admin/settings', '/api/admin/logs'],
    databases: ['PostgreSQL'],
    health: 84,
    confidence: 88
  }
];

export const mockInterchanges: Interchange[] = [
  { file: 'authService.ts', features: ['Authentication', 'Billing & Payments', 'Admin Control'] },
  { file: 'authMiddleware.ts', features: ['Authentication', 'User Management', 'Billing & Payments', 'Admin Control'] },
  { file: 'userRepository.ts', features: ['User Management', 'Authentication', 'Admin Control'] },
  { file: 'userService.ts', features: ['User Management', 'Admin Control'] },
  { file: 'PostgreSQL', features: ['Authentication', 'User Management', 'Billing & Payments', 'Admin Control'] }
];

export const mockExecutionTraces: ExecutionTraceData[] = [
  {
    route: '/api/auth/login',
    method: 'POST',
    chain: [
      { name: 'POST /api/auth/login', type: 'route', file: 'authRoutes.ts' },
      { name: 'authController.login', type: 'controller', file: 'authController.ts' },
      { name: 'authService.authenticate', type: 'service', file: 'authService.ts' },
      { name: 'jwt.signToken', type: 'service', file: 'jwt.ts' },
      { name: 'Redis', type: 'database' }
    ]
  },
  {
    route: '/api/users/profile',
    method: 'GET',
    chain: [
      { name: 'GET /api/users/profile', type: 'route', file: 'userRoutes.ts' },
      { name: 'userController.getProfile', type: 'controller', file: 'userController.ts' },
      { name: 'authMiddleware.verifyToken', type: 'middleware', file: 'authMiddleware.ts' },
      { name: 'userService.getUserById', type: 'service', file: 'userService.ts' },
      { name: 'userRepository.findUser', type: 'repository', file: 'userRepository.ts' },
      { name: 'PostgreSQL', type: 'database' }
    ]
  },
  {
    route: '/api/billing/subscribe',
    method: 'POST',
    chain: [
      { name: 'POST /api/billing/subscribe', type: 'route', file: 'billingRoutes.ts' },
      { name: 'billingController.createSubscription', type: 'controller', file: 'billingController.ts' },
      { name: 'authMiddleware.verifyToken', type: 'middleware', file: 'authMiddleware.ts' },
      { name: 'billingService.processPlan', type: 'service', file: 'billingService.ts' },
      { name: 'paymentService.charge', type: 'service', file: 'paymentService.ts' },
      { name: 'subscriptionRepository.save', type: 'repository', file: 'subscriptionRepository.ts' },
      { name: 'PostgreSQL', type: 'database' }
    ]
  },
  {
    route: '/api/admin/users',
    method: 'DELETE',
    chain: [
      { name: 'DELETE /api/admin/users', type: 'route', file: 'adminRoutes.ts' },
      { name: 'adminController.deleteUser', type: 'controller', file: 'adminController.ts' },
      { name: 'authMiddleware.verifyToken', type: 'middleware', file: 'authMiddleware.ts' },
      { name: 'adminMiddleware.requireAdmin', type: 'middleware', file: 'adminMiddleware.ts' },
      { name: 'userService.removeUser', type: 'service', file: 'userService.ts' },
      { name: 'userRepository.delete', type: 'repository', file: 'userRepository.ts' },
      { name: 'PostgreSQL', type: 'database' }
    ]
  }
];

export const mockFeatureImportance: FeatureImportanceItem[] = [
  { id: 'auth', name: 'Authentication', impact: 42, color: '#10B981', filesCount: 5 },
  { id: 'users', name: 'User Management', impact: 31, color: '#3B82F6', filesCount: 4 },
  { id: 'billing', name: 'Billing & Payments', impact: 18, color: '#F59E0B', filesCount: 5 },
  { id: 'admin', name: 'Admin Control', impact: 9, color: '#EF4444', filesCount: 3 }
];
