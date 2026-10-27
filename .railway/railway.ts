import { defineRailway, github, preserve, project, service } from 'railway/iac'

// Mark 0 also runs Athlo, Slip, Picko and tURL from their own repositories, so this file is a
// named partial: it owns the two Portfolio services it declares and nothing else. The shared
// Postgres and Redis and the Portfolio-Media bucket are left alone.
export const partial = 'portfolio'

/**
 * Variables whose values stay on Railway. A variable the file leaves out is deleted on apply,
 * so every name a service holds is listed here; set a new one in Railway and add its name.
 */
function onRailway(...names: string[]) {
  return Object.fromEntries(names.map((name) => [name, preserve()]))
}

const REGION = { 'europe-west4-drams3a': 1 }

// `dockerfilePath` resolves against the service's root directory. There is no shell around a
// start command, so each is wrapped in `sh -c` for `$PORT` to expand.
const dockerfile = { buildEnvironment: 'V3', builder: 'DOCKERFILE', dockerfilePath: './Dockerfile' } as const

export default defineRailway(() => {
  const portfolio = (rootDirectory: string) =>
    github('SatoriAI/Portfolio', { branch: 'main', rootDirectory, checkSuites: false })

  const api = service('Portfolio', {
    source: portfolio('backend'),
    build: dockerfile,
    // Collectstatic runs here rather than in the pre-deploy step, whose container's disk is
    // gone before a request arrives. One worker: the second held another ~150 MB for traffic
    // eight threads already absorb.
    start: [
      "sh -c 'cd portfolio",
      '&& uv run --no-sync --no-dev python manage.py compilemessages',
      '&& uv run --no-sync --no-dev python manage.py collectstatic --no-input',
      '&& gunicorn portfolio.wsgi:application --bind 0.0.0.0:$PORT',
      "--workers 1 --worker-class gthread --threads 8 --timeout 120 --preload'",
    ].join(' '),
    preDeploy: 'uv run --no-sync --no-dev python portfolio/manage.py migrate',
    healthcheck: '/healthcheck/',
    replicas: REGION,
    networking: {
      serviceDomains: { 'portfolio-production-2d2f.up.railway.app': { port: 8000 } },
      privateNetworkEndpoint: 'portfolio',
    },
    env: onRailway(
      'ALLOWED_HOSTS',
      'ANTHROPIC_API_KEY',
      'BUCKET_ACCESS_KEY_ID',
      'BUCKET_ENDPOINT',
      'BUCKET_NAME',
      'BUCKET_REGION',
      'BUCKET_SECRET_ACCESS_KEY',
      'CORS_ALLOWED_ORIGINS',
      'CSRF_TRUSTED_ORIGINS',
      'DATABASE_URL',
      'DEBUG',
      'PORT',
      'REDIS_URL',
      'SECRET_KEY',
      'VEX_SITE_CONTENT_URL',
    ),
  })

  // No `-s`: it would answer every address with the app and a 200. The build's
  // dist/serve.json routes the known pages to the app and the rest to 404.html.
  const ui = service('Portfolio-UI', {
    source: portfolio('frontend'),
    build: dockerfile,
    start: "sh -c 'serve dist -p $PORT'",
    replicas: REGION,
    domains: [
      { domain: 'dawidhanrahan.com', port: 3000 },
      { domain: 'www.dawidhanrahan.com', port: 3000 },
    ],
    networking: { privateNetworkEndpoint: 'portfolio-ui' },
    env: onRailway('PORT', 'VITE_API_BASE_URL'),
  })

  return project('Mark 0', { resources: [api, ui] })
})
