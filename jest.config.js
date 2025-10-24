/**
 * Configuración de Jest para pruebas unitarias del ERP Municipal
 */

module.exports = {
  // Directorio raíz donde Jest buscará archivos
  rootDir: '.',
  
  // Patrón para encontrar archivos de prueba
  testMatch: ['**/tests/**/*.test.js'],
  
  // Ignorar ciertos directorios
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/build/'],
  
  // Entorno de prueba
  testEnvironment: 'node',
  
  // Cobertura de código
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!**/node_modules/**',
    '!**/tests/**'
  ],
  
  // Umbral de cobertura
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Mostrar un resumen de la cobertura después de las pruebas
  verbose: true,
  
  // Tiempo máximo de ejecución para cada prueba (en milisegundos)
  testTimeout: 10000,
  
  // Configuración para transformar archivos
  transform: {},
  
  // Configuración para módulos
  moduleFileExtensions: ['js', 'json', 'node']
};