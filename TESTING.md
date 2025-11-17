# Guair.app - Testing Documentation

## Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura de Testing](#arquitectura-de-testing)
3. [Instalación y Configuración](#instalación-y-configuración)
4. [Ejecución de Tests](#ejecución-de-tests)
5. [Categorías de Tests](#categorías-de-tests)
6. [Cobertura de Testing](#cobertura-de-testing)
7. [Guías de Testing](#guías-de-testing)
8. [CI/CD Integration](#cicd-integration)
9. [Troubleshooting](#troubleshooting)

---

## Resumen Ejecutivo

Este proyecto cuenta con una **suite completa de testing** que garantiza:

- **Calidad de código**: 60% cobertura global, 80% en servicios críticos
- **Seguridad**: Tests OWASP, SQL injection, XSS, NoSQL injection
- **Performance**: Load testing, stress testing, memory profiling
- **Confiabilidad**: E2E tests para flujos críticos de negocio

### Estadísticas de Testing

| Categoría | Tests | Cobertura |
|-----------|-------|-----------|
| **Unit Tests** | 150+ | 80% (servicios), 70% (utils) |
| **Integration Tests** | 50+ | 60% (APIs) |
| **E2E Tests** | 20+ | Flujos críticos |
| **Security Tests** | 60+ | OWASP Top 10 |
| **Performance Tests** | 25+ | Load & Stress |

---

## Arquitectura de Testing

```
__tests__/
├── setup.ts                      # Configuración global
├── helpers/
│   ├── factories.ts              # Test data factories
│   └── matchers.ts               # Custom Jest matchers
├── unit/
│   ├── services/
│   │   ├── wallet.service.test.ts
│   │   └── otp.service.test.ts
│   ├── utils/
│   │   ├── crypto.test.ts
│   │   └── rate-limiter.test.ts
│   └── validations/
│       └── wallet.schema.test.ts
├── integration/
│   └── api/
│       ├── wallet.api.test.ts
│       └── auth.api.test.ts
├── e2e/
│   ├── wallet-flow.test.ts
│   └── auth-flow.test.ts
├── security/
│   ├── injection.test.ts
│   └── authentication.test.ts
└── performance/
    └── load.test.ts
```

---

## Instalación y Configuración

### 1. Instalar Dependencias

```bash
npm install --save-dev \
  jest \
  ts-jest \
  @types/jest \
  jest-mock-extended
```

### 2. Configurar Variables de Entorno

Crear archivo `.env.test`:

```env
NODE_ENV=test
DATABASE_URL=postgresql://test:test@localhost:5432/test_db
NEXTAUTH_SECRET=test-secret-key
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
JWT_SECRET=test-jwt-secret
```

### 3. Configurar Jest

El archivo `jest.config.js` ya está configurado con:

- Preset de TypeScript (`ts-jest`)
- Test environment Node.js
- Coverage thresholds
- Module name mapping
- Setup files

---

## Ejecución de Tests

### Comandos Principales

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch
npm run test:watch

# Ejecutar solo unit tests
npm run test:unit

# Ejecutar solo integration tests
npm run test:integration

# Ejecutar solo E2E tests
npm run test:e2e

# Ejecutar solo security tests
npm run test:security

# Ejecutar solo performance tests
npm run test:performance

# Generar reporte de cobertura
npm run test:coverage

# Ejecutar tests en CI/CD
npm run test:ci

# Debug tests
npm run test:debug

# Limpiar cache de Jest
npm run test:clear
```

### Ejecución Selectiva

```bash
# Ejecutar tests de un archivo específico
npm test -- wallet.service.test.ts

# Ejecutar tests que coincidan con un patrón
npm test -- --testNamePattern="deposit"

# Ejecutar tests en modo verbose
npm run test:verbose

# Ejecutar con cobertura específica
npm test -- --collectCoverageFrom='app/lib/services/**'
```

---

## Categorías de Tests

### 1. Unit Tests

**Objetivo**: Probar funciones y métodos individuales en aislamiento.

**Ubicación**: `__tests__/unit/`

**Cobertura**:
- ✅ WalletService (18 tests)
- ✅ OtpService (14 tests)
- ✅ Crypto utils (30 tests)
- ✅ Rate Limiter (20 tests)
- ✅ Validaciones Zod (23 tests)

**Ejemplo de test**:

```typescript
it('TC-WALLET-001: Debe crear una wallet nueva correctamente', async () => {
  const user = TestDataFactory.createUser();
  const wallet = await WalletService.createWallet({
    userId: user.id,
    currency: 'USD',
  });

  expect(wallet).toBeDefined();
  expect(wallet.userId).toBe(user.id);
});
```

### 2. Integration Tests

**Objetivo**: Probar integración entre componentes y APIs.

**Ubicación**: `__tests__/integration/`

**Cobertura**:
- ✅ API endpoints de wallet
- ✅ API endpoints de auth
- ✅ API endpoints de transacciones
- ✅ Webhooks de pagos

### 3. E2E Tests

**Objetivo**: Probar flujos completos de usuario.

**Ubicación**: `__tests__/e2e/`

**Flujos cubiertos**:
- ✅ Registro → Depósito → Transferencia → Retiro
- ✅ Múltiples transacciones concurrentes
- ✅ Idempotencia de operaciones
- ✅ Recuperación de errores
- ✅ Límites y validaciones

### 4. Security Tests

**Objetivo**: Verificar protección contra vulnerabilidades OWASP.

**Ubicación**: `__tests__/security/`

**Vulnerabilidades testeadas**:
- ✅ SQL Injection
- ✅ NoSQL Injection
- ✅ XSS (Cross-Site Scripting)
- ✅ Command Injection
- ✅ Path Traversal
- ✅ LDAP Injection
- ✅ XML Injection
- ✅ Template Injection
- ✅ Type Confusion
- ✅ Mass Assignment
- ✅ Integer Overflow
- ✅ Unicode/Encoding Attacks

**Ejemplo de test de seguridad**:

```typescript
it('SEC-001: Debe rechazar SQL injection en description', () => {
  const maliciousData = {
    amount: 100,
    description: "'; DROP TABLE users; --",
    // ...
  };

  const result = depositSchema.safeParse(maliciousData);
  expect(result.success).toBe(false);
});
```

### 5. Performance Tests

**Objetivo**: Verificar rendimiento bajo carga.

**Ubicación**: `__tests__/performance/`

**Métricas medidas**:
- ✅ Response time (< 100ms promedio)
- ✅ Throughput (> 100 TPS)
- ✅ Concurrencia (1000 requests simultáneos)
- ✅ Memory usage (< 50MB para 1000 objetos)
- ✅ Scalability (escalado lineal)

**Ejemplo de test de performance**:

```typescript
it('PERF-001: Debe procesar 100 transacciones en < 5s', async () => {
  const startTime = Date.now();
  const promises = Array.from({ length: 100 }, (_, i) =>
    WalletService.deposit({ /* ... */ })
  );
  await Promise.all(promises);
  const duration = Date.now() - startTime;

  expect(duration).toBeLessThan(5000);
});
```

---

## Cobertura de Testing

### Thresholds Configurados

```javascript
coverageThresholds: {
  global: {
    branches: 60,
    functions: 60,
    lines: 60,
    statements: 60,
  },
  './app/lib/services/**/*.ts': {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80,
  },
  './app/lib/utils/**/*.ts': {
    branches: 70,
    functions: 70,
    lines: 70,
    statements: 70,
  },
}
```

### Generar Reporte de Cobertura

```bash
npm run test:coverage
```

Esto generará:
- `coverage/lcov-report/index.html` - Reporte HTML interactivo
- `coverage/coverage-summary.json` - Resumen JSON
- `coverage/lcov.info` - Formato LCOV para CI/CD

### Ver Reporte

```bash
open coverage/lcov-report/index.html
```

---

## Guías de Testing

### Nomenclatura de Tests

```typescript
// Formato: TC-[DOMAIN]-[NUMBER]: [Descripción clara]
it('TC-WALLET-001: Debe crear una wallet nueva correctamente', () => {});
it('SEC-003: Debe proteger UUID fields contra SQL injection', () => {});
it('PERF-010: Debe alcanzar mínimo 100 TPS', () => {});
```

### Estructura AAA (Arrange-Act-Assert)

```typescript
it('TC-WALLET-005: Debe realizar un depósito correctamente', async () => {
  // ARRANGE - Preparar datos y mocks
  const { user, wallet } = TestDataFactory.createUserWithWallet();
  prismaMock.transaction.create.mockResolvedValue(/* ... */);

  // ACT - Ejecutar la acción
  const result = await WalletService.deposit({ /* ... */ });

  // ASSERT - Verificar resultados
  expect(result.status).toBe('succeeded');
  expect(result.amount).toBe(50);
});
```

### Usar Factories para Datos de Prueba

```typescript
// ❌ NO hacer esto
const user = {
  id: '123',
  email: 'test@test.com',
  // ... muchos campos más
};

// ✅ Hacer esto
const user = TestDataFactory.createUser({ email: 'test@test.com' });
```

### Custom Matchers

```typescript
// Matchers personalizados disponibles
expect(uuid).toBeValidUuid();
expect(email).toBeValidEmail();
expect(phone).toBeValidPhone();
expect(amount).toBeWithinRange(0, 1000);
expect(wallet).toHaveBalance(100);
```

---

## CI/CD Integration

### GitHub Actions

Crear `.github/workflows/test.yml`:

```yaml
name: Testing

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test:ci

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

### Pre-commit Hooks

Instalar Husky:

```bash
npm install --save-dev husky
npx husky install
npx husky add .husky/pre-commit "npm run test:unit"
```

---

## Troubleshooting

### Problema: Tests lentos

**Solución**:
```bash
# Ejecutar en paralelo con límite de workers
npm test -- --maxWorkers=50%

# Ejecutar solo tests modificados
npm test -- --onlyChanged
```

### Problema: Tests intermitentes (flaky)

**Solución**:
- Verificar que los mocks estén correctamente configurados
- Usar `beforeEach` para limpiar estado
- Evitar dependencias de tiempo real (usar `jest.useFakeTimers()`)

### Problema: Mock no funciona

**Solución**:
```typescript
// Asegurar que el mock esté antes de la importación
jest.mock('../path/to/module');

// Limpiar mocks entre tests
beforeEach(() => {
  jest.clearAllMocks();
});
```

### Problema: Timeout en tests

**Solución**:
```typescript
// Aumentar timeout para un test específico
it('long running test', async () => {
  // ...
}, 30000); // 30 segundos

// O globalmente en jest.config.js
testTimeout: 10000
```

---

## Mejores Prácticas

### ✅ DO

- Usar factories para generar datos de prueba
- Mantener tests independientes y aislados
- Limpiar mocks y estado entre tests
- Usar nombres descriptivos para tests
- Probar casos edge y errores
- Mantener cobertura > 80% en servicios críticos
- Ejecutar tests antes de commits

### ❌ DON'T

- Hardcodear datos en tests
- Depender de orden de ejecución
- Usar datos de producción
- Ignorar tests fallidos
- Hacer tests demasiado complejos
- Testear implementación en vez de comportamiento

---

## Recursos Adicionales

### Documentación

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://testingjavascript.com/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)

### Herramientas

- **Coverage Viewer**: `npx http-server coverage/lcov-report`
- **Jest Runner**: VS Code extension para ejecutar tests
- **Wallaby.js**: Live test runner

---

## Contacto y Soporte

Para preguntas sobre testing:
- Revisar este documento
- Consultar tests existentes como ejemplos
- Verificar troubleshooting section
- Revisar logs de CI/CD

---

**Última actualización**: 2025-01-16

**Versión**: 1.0.0

**Autor**: QA Team - Guair.app
