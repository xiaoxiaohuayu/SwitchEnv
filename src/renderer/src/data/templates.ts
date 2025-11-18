import type { Template } from '../types'

export interface TemplateCategoryMeta {
  id: Exclude<Template['category'], 'custom'>
  label: string
  description: string
}

export const templateCategoryMeta: TemplateCategoryMeta[] = [
  {
    id: 'frontend',
    label: '前端与应用',
    description: 'React、Vue、Next.js 等前端项目场景'
  },
  {
    id: 'backend',
    label: '服务端与 API',
    description: 'Node.js、Spring Boot、REST API 等'
  },
  {
    id: 'database',
    label: '数据与缓存',
    description: '数据库、Redis、消息队列配置'
  },
  {
    id: 'infrastructure',
    label: '基础设施',
    description: 'Docker、Compose、Kubernetes 等部署环境'
  },
  {
    id: 'ai',
    label: 'AI / LLM 服务',
    description: 'OpenAI、内部大模型、推理 API'
  }
]

export const templates: Template[] = [
  {
    id: 'tpl-node-basic',
    name: 'Node.js 服务',
    description: 'Node.js 开发或中间层常用变量',
    category: 'backend',
    source: 'builtin',
    variables: [
      { key: 'NODE_ENV', value: 'development' },
      { key: 'PORT', value: '3000' },
      { key: 'DEBUG', value: '*' },
      { key: 'LOG_LEVEL', value: 'debug' },
      { key: 'SESSION_SECRET', value: '' }
    ]
  },
  {
    id: 'tpl-react-spa',
    name: 'React SPA',
    description: 'React 前端项目常用变量',
    category: 'frontend',
    source: 'builtin',
    variables: [
      { key: 'REACT_APP_API_URL', value: 'http://localhost:3000/api' },
      { key: 'REACT_APP_ENV', value: 'development' },
      { key: 'REACT_APP_VERSION', value: '1.0.0' },
      { key: 'REACT_APP_DEBUG', value: 'true' },
      { key: 'REACT_APP_SENTRY_DSN', value: '' }
    ]
  },
  {
    id: 'tpl-vue-spa',
    name: 'Vue SPA',
    description: 'Vue 前端项目常用变量',
    category: 'frontend',
    source: 'builtin',
    variables: [
      { key: 'VUE_APP_API_URL', value: 'http://localhost:3000/api' },
      { key: 'VUE_APP_ENV', value: 'development' },
      { key: 'VUE_APP_VERSION', value: '1.0.0' },
      { key: 'VUE_APP_DEBUG', value: 'true' }
    ]
  },
  {
    id: 'tpl-nextjs',
    name: 'Next.js SSR',
    description: 'Next.js/Hybrid 渲染场景带参数模板',
    category: 'frontend',
    source: 'builtin',
    placeholders: [
      { name: 'domain', label: '域名前缀', defaultValue: 'dev.example.com' },
      { name: 'port', label: '本地端口', defaultValue: '3000' }
    ],
    variables: [
      { key: 'NODE_ENV', value: 'development' },
      { key: 'PORT', value: '{{port}}' },
      { key: 'NEXT_PUBLIC_API_URL', value: 'https://{{domain}}/api' },
      { key: 'NEXT_PUBLIC_ASSET_PREFIX', value: 'https://cdn.{{domain}}' },
      { key: 'NEXTAUTH_URL', value: 'https://{{domain}}' },
      { key: 'NEXT_TELEMETRY_DISABLED', value: '1' }
    ]
  },
  {
    id: 'tpl-database',
    name: 'Database',
    description: '数据库连接配置',
    category: 'database',
    source: 'builtin',
    variables: [
      { key: 'DB_HOST', value: 'localhost' },
      { key: 'DB_PORT', value: '3306' },
      { key: 'DB_USERNAME', value: 'root' },
      { key: 'DB_PASSWORD', value: '' },
      { key: 'DB_DATABASE', value: 'myapp' }
    ]
  },
  {
    id: 'tpl-redis',
    name: 'Redis 缓存',
    description: 'Redis 连接配置',
    category: 'database',
    source: 'builtin',
    variables: [
      { key: 'REDIS_HOST', value: 'localhost' },
      { key: 'REDIS_PORT', value: '6379' },
      { key: 'REDIS_PASSWORD', value: '' },
      { key: 'REDIS_DB', value: '0' }
    ]
  },
  {
    id: 'tpl-api-gateway',
    name: 'API 服务',
    description: 'REST/GraphQL API 服务配置',
    category: 'backend',
    source: 'builtin',
    variables: [
      { key: 'API_BASE_URL', value: 'http://localhost:3000' },
      { key: 'API_TIMEOUT', value: '5000' },
      { key: 'API_KEY', value: '' },
      { key: 'API_SECRET', value: '' },
      { key: 'CORS_ORIGINS', value: '*' }
    ]
  },
  {
    id: 'tpl-spring-boot',
    name: 'Spring Boot',
    description: 'Spring Boot 服务端配置（可参数化）',
    category: 'backend',
    source: 'builtin',
    placeholders: [
      { name: 'profile', label: 'Profiles', defaultValue: 'dev' },
      { name: 'dbHost', label: '数据库地址', defaultValue: 'localhost' },
      { name: 'dbPort', label: '数据库端口', defaultValue: '5432' },
      { name: 'dbName', label: '数据库名', defaultValue: 'myapp' }
    ],
    variables: [
      { key: 'SPRING_PROFILES_ACTIVE', value: '{{profile}}' },
      { key: 'SERVER_PORT', value: '8080' },
      { key: 'SPRING_DATASOURCE_URL', value: 'jdbc:postgresql://{{dbHost}}:{{dbPort}}/{{dbName}}' },
      { key: 'SPRING_DATASOURCE_USERNAME', value: 'postgres' },
      { key: 'SPRING_DATASOURCE_PASSWORD', value: '' },
      { key: 'SPRING_REDIS_HOST', value: 'localhost' },
      { key: 'SPRING_REDIS_PORT', value: '6379' }
    ]
  },
  {
    id: 'tpl-docker-compose',
    name: 'Docker / Compose',
    description: 'Docker、Compose 部署配置',
    category: 'infrastructure',
    source: 'builtin',
    placeholders: [
      { name: 'registry', label: '镜像仓库', defaultValue: 'registry.example.com/project' },
      { name: 'service', label: '服务名/域前缀', defaultValue: 'dev-service' },
      { name: 'port', label: '服务端口', defaultValue: '8080' }
    ],
    variables: [
      { key: 'DOCKER_REGISTRY', value: '{{registry}}' },
      { key: 'COMPOSE_PROJECT_NAME', value: '{{service}}' },
      { key: 'COMPOSE_FILE', value: 'docker-compose.yml' },
      { key: 'SERVICE_PORT', value: '{{port}}' },
      { key: 'DOCKER_HOST', value: 'ssh://docker@server' },
      { key: 'IMAGE_TAG', value: 'v1.0.0' }
    ]
  },
  {
    id: 'tpl-kubernetes',
    name: 'Kubernetes',
    description: 'K8s 部署上下文 / 镜像配置',
    category: 'infrastructure',
    source: 'builtin',
    placeholders: [
      { name: 'cluster', label: '集群 API 地址', defaultValue: 'https://kubernetes.default.svc' },
      { name: 'namespace', label: '命名空间', defaultValue: 'default' },
      { name: 'context', label: 'Context 名称', defaultValue: 'dev-context' }
    ],
    variables: [
      { key: 'KUBE_CONTEXT', value: '{{context}}' },
      { key: 'KUBE_NAMESPACE', value: '{{namespace}}' },
      { key: 'KUBE_API_SERVER', value: '{{cluster}}' },
      { key: 'KUBE_IMAGE_PULL_SECRET', value: '' },
      { key: 'KUBE_DEFAULT_IMAGE_TAG', value: 'latest' }
    ]
  },
  {
    id: 'tpl-ai-api',
    name: 'AI / LLM API',
    description: 'AI 推理、OpenAI 兼容接口配置（可参数化）',
    category: 'ai',
    source: 'builtin',
    placeholders: [
      { name: 'provider', label: '服务商域名', defaultValue: 'api.openai.com' },
      { name: 'model', label: '默认模型', defaultValue: 'gpt-4o-mini' }
    ],
    variables: [
      { key: 'AI_PROVIDER', value: '{{provider}}' },
      { key: 'OPENAI_API_KEY', value: '' },
      { key: 'OPENAI_BASE_URL', value: 'https://{{provider}}/v1' },
      { key: 'OPENAI_MODEL', value: '{{model}}' },
      { key: 'OPENAI_TIMEOUT', value: '30000' },
      { key: 'OPENAI_RATE_LIMIT_PER_MIN', value: '20' }
    ]
  }
]
