type Level = 'info' | 'warn' | 'error'

function log(level: Level, ctx: string, msg: string, data?: unknown): void {
  const line = `[${new Date().toISOString()}] [${level.toUpperCase()}] [${ctx}] ${msg}`
  if (data !== undefined) {
    console[level](line, data)
  } else {
    console[level](line)
  }
}

export const logger = {
  info: (ctx: string, msg: string, data?: unknown) => log('info', ctx, msg, data),
  warn: (ctx: string, msg: string, data?: unknown) => log('warn', ctx, msg, data),
  error: (ctx: string, msg: string, data?: unknown) => log('error', ctx, msg, data),
}
