// src/utils/logger.js
// Pipeline run sonuçlarını JSON olarak kaydeder

import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = './output';

export function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

export function saveRunLog(runId, data) {
  ensureOutputDir();
  const logPath = path.join(OUTPUT_DIR, `run-${runId}.json`);
  fs.writeFileSync(logPath, JSON.stringify(data, null, 2));
  console.log(`[Logger] Log kaydedildi: ${logPath}`);
  return logPath;
}

export function loadRunLog(runId) {
  const logPath = path.join(OUTPUT_DIR, `run-${runId}.json`);
  if (!fs.existsSync(logPath)) return null;
  return JSON.parse(fs.readFileSync(logPath, 'utf-8'));
}

export function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const prefix = { info: 'ℹ️', warn: '⚠️', error: '❌', success: '✅' }[level] || '•';
  console.log(`${prefix} [${timestamp}] ${message}`);
  if (data) console.log(JSON.stringify(data, null, 2));
}
