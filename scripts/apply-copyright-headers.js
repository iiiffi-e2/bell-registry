#!/usr/bin/env node

/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const COMPANY_NAME = 'Bell Registry';
const COPYRIGHT_YEAR = new Date().getFullYear();
const COPYRIGHT_LINE = `Copyright © ${COPYRIGHT_YEAR} ${COMPANY_NAME}. All rights reserved.`;
const HEADER_NOTICE = `${COPYRIGHT_LINE}
Unauthorized copying, distribution, modification, or use is prohibited.
Proprietary and confidential.`;

// File patterns to skip
const SKIP_PATTERNS = [
  /node_modules/,
  /vendor/,
  /\.next/,
  /build/,
  /dist/,
  /coverage/,
  /\.turbo/,
  /\.vercel/,
  /\.cache/,
  /\.git/,
  /\.min\./,
  /\.map$/,
  /\.lock$/,
  /\.d\.ts$/,
  /pnpm-lock\.yaml$/,
  /package-lock\.json$/,
  /yarn\.lock$/,
  /\.(png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|mp3|mp4|avi|mov|pdf)$/i,
  /^LICENSE/i,
  /^COPYING/i,
  /^THIRD_PARTY/i,
  /desktop\.ini$/,
  /\.tsbuildinfo$/,
  /vercel\.json$/,
  /robots\.txt$/
];

// File extensions and their comment syntax
const COMMENT_SYNTAX = {
  '.js': { start: '/**', line: ' * ', end: ' */' },
  '.jsx': { start: '/**', line: ' * ', end: ' */' },
  '.ts': { start: '/**', line: ' * ', end: ' */' },
  '.tsx': { start: '/**', line: ' * ', end: ' */' },
  '.css': { start: '/*', line: ' * ', end: ' */' },
  '.scss': { start: '/*', line: ' * ', end: ' */' },
  '.html': { start: '<!--', line: ' ', end: ' -->' },
  '.php': { start: '/**', line: ' * ', end: ' */' },
  '.py': { start: '"""', line: '', end: '"""' },
  '.go': { start: '/*', line: ' * ', end: ' */' },
  '.c': { start: '/*', line: ' * ', end: ' */' },
  '.cpp': { start: '/*', line: ' * ', end: ' */' },
  '.java': { start: '/*', line: ' * ', end: ' */' },
  '.md': { start: '>', line: '> ', end: '' }
};

class CopyrightManager {
  constructor(dryRun = false) {
    this.dryRun = dryRun;
    this.stats = {
      scanned: 0,
      updated: 0,
      skipped: 0,
      errors: 0
    };
  }

  shouldSkipFile(filePath) {
    const relativePath = path.relative(process.cwd(), filePath);
    return SKIP_PATTERNS.some(pattern => pattern.test(relativePath));
  }

  getFileExtension(filePath) {
    return path.extname(filePath).toLowerCase();
  }

  hasExistingCopyright(content) {
    const lowerContent = content.toLowerCase();
    return lowerContent.includes(COMPANY_NAME.toLowerCase()) && 
           (lowerContent.includes('copyright') || lowerContent.includes('©'));
  }

  createCopyrightHeader(ext) {
    const syntax = COMMENT_SYNTAX[ext];
    if (!syntax) return null;

    const lines = HEADER_NOTICE.split('\n');
    
    if (ext === '.md') {
      return lines.map(line => `> ${line}`).join('\n') + '\n>\n\n';
    }
    
    if (ext === '.py') {
      return `${syntax.start}\n${lines.join('\n')}\n${syntax.end}\n\n`;
    }
    
    let header = syntax.start + '\n';
    lines.forEach(line => {
      header += syntax.line + line + '\n';
    });
    header += syntax.end + '\n\n';
    
    return header;
  }

  updateCopyrightYear(content) {
    // Update existing copyright year
    const yearRegex = /Copyright\s*©\s*(\d{4})\s*Bell Registry/gi;
    return content.replace(yearRegex, `Copyright © ${COPYRIGHT_YEAR} Bell Registry`);
  }

  processFile(filePath) {
    this.stats.scanned++;
    
    if (this.shouldSkipFile(filePath)) {
      this.stats.skipped++;
      return;
    }

    const ext = this.getFileExtension(filePath);
    if (!COMMENT_SYNTAX[ext]) {
      this.stats.skipped++;
      return;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      let newContent = content;
      let modified = false;

      if (this.hasExistingCopyright(content)) {
        // Update existing copyright year
        const updatedContent = this.updateCopyrightYear(content);
        if (updatedContent !== content) {
          newContent = updatedContent;
          modified = true;
        }
      } else {
        // Add new copyright header
        const header = this.createCopyrightHeader(ext);
        if (header) {
          // Handle shebang preservation
          const shebangMatch = content.match(/^#!.*\n/);
          if (shebangMatch) {
            newContent = shebangMatch[0] + '\n' + header + content.substring(shebangMatch[0].length);
          } else {
            newContent = header + content;
          }
          modified = true;
        }
      }

      if (modified) {
        if (this.dryRun) {
          console.log(`[DRY RUN] Would update: ${path.relative(process.cwd(), filePath)}`);
        } else {
          fs.writeFileSync(filePath, newContent, 'utf8');
          console.log(`Updated: ${path.relative(process.cwd(), filePath)}`);
        }
        this.stats.updated++;
      }
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error.message);
      this.stats.errors++;
    }
  }

  processDirectory(dirPath) {
    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          this.processDirectory(fullPath);
        } else if (stat.isFile()) {
          this.processFile(fullPath);
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${dirPath}:`, error.message);
      this.stats.errors++;
    }
  }

  run() {
    console.log(`${this.dryRun ? '[DRY RUN] ' : ''}Starting copyright header application...`);
    console.log(`Company: ${COMPANY_NAME}`);
    console.log(`Year: ${COPYRIGHT_YEAR}`);
    console.log('');

    this.processDirectory(process.cwd());

    console.log('\n=== Summary ===');
    console.log(`Files scanned: ${this.stats.scanned}`);
    console.log(`Files updated: ${this.stats.updated}`);
    console.log(`Files skipped: ${this.stats.skipped}`);
    console.log(`Errors: ${this.stats.errors}`);
  }
}

// CLI handling
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

const manager = new CopyrightManager(dryRun);
manager.run();
