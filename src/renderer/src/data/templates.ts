import type { Template } from '../types'

export const templates: Template[] = [
  {
    name: 'Node.js',
    description: 'Node.js 开发环境常用变量',
    variables: [
      { key: 'NODE_ENV', value: 'development' },
      { key: 'PORT', value: '3000' },
      { key: 'DEBUG', value: '*' },
      { key: 'LOG_LEVEL', value: 'debug' }
    ]
  },
  {
    name: 'React',
    description: 'React 应用环境变量',
    variables: [
      { key: 'REACT_APP_API_URL', value: 'http://localhost:3000/api' },
      { key: 'REACT_APP_ENV', value: 'development' },
      { key: 'REACT_APP_VERSION', value: '1.0.0' },
      { key: 'REACT_APP_DEBUG', value: 'true' }
    ]
  },
  {
    name: 'Vue',
    description: 'Vue 应用环境变量',
    variables: [
      { key: 'VUE_APP_API_URL', value: 'http://localhost:3000/api' },
      { key: 'VUE_APP_ENV', value: 'development' },
      { key: 'VUE_APP_VERSION', value: '1.0.0' },
      { key: 'VUE_APP_DEBUG', value: 'true' }
    ]
  },
  {
    name: 'Database',
    description: '数据库连接配置',
    variables: [
      { key: 'DB_HOST', value: 'localhost' },
      { key: 'DB_PORT', value: '3306' },
      { key: 'DB_USERNAME', value: 'root' },
      { key: 'DB_PASSWORD', value: '' },
      { key: 'DB_DATABASE', value: 'myapp' }
    ]
  },
  {
    name: 'API',
    description: 'API 相关配置',
    variables: [
      { key: 'API_BASE_URL', value: 'http://localhost:3000' },
      { key: 'API_TIMEOUT', value: '5000' },
      { key: 'API_KEY', value: '' },
      { key: 'API_SECRET', value: '' }
    ]
  },
  {
    name: 'Redis',
    description: 'Redis 缓存配置',
    variables: [
      { key: 'REDIS_HOST', value: 'localhost' },
      { key: 'REDIS_PORT', value: '6379' },
      { key: 'REDIS_PASSWORD', value: '' },
      { key: 'REDIS_DB', value: '0' }
    ]
  }
]
