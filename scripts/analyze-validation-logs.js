#!/usr/bin/env node

/**
 * Validation Log Analysis Script
 * 
 * This script helps analyze validation errors from the profile form logs.
 * Run with: node scripts/analyze-validation-logs.js [options]
 */

const fs = require('fs');
const path = require('path');

// Command line options
const args = process.argv.slice(2);
const options = {
  logFile: args.find(arg => arg.startsWith('--file='))?.split('=')[1] || 'logs/app.log',
  format: args.find(arg => arg.startsWith('--format='))?.split('=')[1] || 'table',
  filter: args.find(arg => arg.startsWith('--filter='))?.split('=')[1],
  limit: parseInt(args.find(arg => arg.startsWith('--limit='))?.split('=')[1]) || 50,
  help: args.includes('--help') || args.includes('-h'),
};

if (options.help) {
  console.log(`
Validation Log Analysis Tool

Usage: node scripts/analyze-validation-logs.js [options]

Options:
  --file=path     Log file to analyze (default: logs/app.log)
  --format=type   Output format: table, json, summary (default: table)
  --filter=term   Filter results by term (e.g., "firstName", "REQUIRED_FIELD")
  --limit=number  Maximum number of results to show (default: 50)
  --help, -h      Show this help message

Examples:
  node scripts/analyze-validation-logs.js
  node scripts/analyze-validation-logs.js --format=summary
  node scripts/analyze-validation-logs.js --filter="REQUIRED_FIELD" --limit=20
  node scripts/analyze-validation-logs.js --format=json > validation-errors.json
`);
  process.exit(0);
}

function parseLogLine(line) {
  try {
    // Look for validation error log entries
    const match = line.match(/\[VALIDATION_ERROR\] (.+)/);
    if (!match) return null;
    
    return JSON.parse(match[1]);
  } catch (error) {
    return null;
  }
}

function analyzeLogs(logData) {
  const stats = {
    totalErrors: 0,
    errorTypes: {},
    commonIssues: {},
    userSegments: {},
    userRoles: {},
    fields: {},
    timeRange: { start: null, end: null },
  };
  
  logData.forEach(entry => {
    if (!entry) return;
    
    stats.totalErrors++;
    
    // Track error types
    entry.searchable?.errorTypes?.forEach(type => {
      stats.errorTypes[type] = (stats.errorTypes[type] || 0) + 1;
    });
    
    // Track common issues
    entry.searchable?.commonIssues?.forEach(issue => {
      stats.commonIssues[issue] = (stats.commonIssues[issue] || 0) + 1;
    });
    
    // Track user segments
    if (entry.searchable?.userSegment) {
      stats.userSegments[entry.searchable.userSegment] = (stats.userSegments[entry.searchable.userSegment] || 0) + 1;
    }
    
    // Track user roles
    if (entry.userRole) {
      stats.userRoles[entry.userRole] = (stats.userRoles[entry.userRole] || 0) + 1;
    }
    
    // Track field errors
    entry.validationErrors?.forEach(error => {
      stats.fields[error.field] = (stats.fields[error.field] || 0) + 1;
    });
    
    // Track time range
    if (!stats.timeRange.start || entry.timestamp < stats.timeRange.start) {
      stats.timeRange.start = entry.timestamp;
    }
    if (!stats.timeRange.end || entry.timestamp > stats.timeRange.end) {
      stats.timeRange.end = entry.timestamp;
    }
  });
  
  return stats;
}

function formatTable(data, title) {
  console.log(`\n${title}`);
  console.log('='.repeat(title.length));
  
  const entries = Object.entries(data)
    .sort(([,a], [,b]) => b - a)
    .slice(0, options.limit);
  
  if (entries.length === 0) {
    console.log('No data found');
    return;
  }
  
  const maxKeyLength = Math.max(...entries.map(([key]) => key.length));
  const maxValueLength = Math.max(...entries.map(([,value]) => value.toString().length));
  
  entries.forEach(([key, value]) => {
    const keyPadded = key.padEnd(maxKeyLength);
    const valuePadded = value.toString().padStart(maxValueLength);
    console.log(`${keyPadded} | ${valuePadded}`);
  });
}

function formatSummary(stats) {
  console.log('\n📊 VALIDATION ERROR ANALYSIS SUMMARY');
  console.log('='.repeat(50));
  
  console.log(`\n📈 Total Validation Errors: ${stats.totalErrors}`);
  console.log(`📅 Time Range: ${stats.timeRange.start} to ${stats.timeRange.end}`);
  
  formatTable(stats.errorTypes, '🔥 Most Common Error Types');
  formatTable(stats.commonIssues, '⚠️  Most Common Issues');
  formatTable(stats.fields, '📝 Fields with Most Errors');
  formatTable(stats.userRoles, '👥 Errors by User Role');
  formatTable(stats.userSegments, '🎯 Errors by User Segment');
  
  console.log('\n💡 Recommendations:');
  
  // Generate recommendations based on data
  const topErrorType = Object.entries(stats.errorTypes)[0];
  if (topErrorType && topErrorType[1] > stats.totalErrors * 0.3) {
    console.log(`   • Focus on fixing "${topErrorType[0]}" errors (${Math.round(topErrorType[1]/stats.totalErrors*100)}% of all errors)`);
  }
  
  const topField = Object.entries(stats.fields)[0];
  if (topField && topField[1] > stats.totalErrors * 0.2) {
    console.log(`   • "${topField[0]}" field needs attention (${Math.round(topField[1]/stats.totalErrors*100)}% of all errors)`);
  }
  
  if (stats.commonIssues['INCOMPLETE_PROFILE']) {
    console.log('   • Consider improving the profile completion flow');
  }
  
  if (stats.commonIssues['SHORT_BIO']) {
    console.log('   • Bio length requirements may be too strict');
  }
}

function formatJson(logData) {
  console.log(JSON.stringify(logData.slice(0, options.limit), null, 2));
}

function main() {
  try {
    // Check if log file exists
    if (!fs.existsSync(options.logFile)) {
      console.error(`❌ Log file not found: ${options.logFile}`);
      console.log('\nMake sure you have logs being written to the correct location.');
      console.log('You may need to redirect console output to a log file in production.');
      process.exit(1);
    }
    
    // Read and parse log file
    console.log(`📖 Reading log file: ${options.logFile}`);
    const logContent = fs.readFileSync(options.logFile, 'utf8');
    const lines = logContent.split('\n');
    
    let logData = lines.map(parseLogLine).filter(Boolean);
    
    // Apply filter if specified
    if (options.filter) {
      const filter = options.filter.toLowerCase();
      logData = logData.filter(entry => {
        return JSON.stringify(entry).toLowerCase().includes(filter);
      });
    }
    
    if (logData.length === 0) {
      console.log('❌ No validation errors found in the log file');
      if (options.filter) {
        console.log(`   (with filter: "${options.filter}")`);
      }
      process.exit(0);
    }
    
    console.log(`✅ Found ${logData.length} validation error entries`);
    
    // Generate output based on format
    switch (options.format) {
      case 'summary':
        const stats = analyzeLogs(logData);
        formatSummary(stats);
        break;
      case 'json':
        formatJson(logData);
        break;
      case 'table':
      default:
        // Show recent errors in table format
        console.log('\n📋 Recent Validation Errors:');
        console.log('='.repeat(80));
        
        logData.slice(-options.limit).forEach((entry, index) => {
          console.log(`\n${index + 1}. ${entry.timestamp}`);
          console.log(`   User: ${entry.userEmail} (${entry.userRole})`);
          console.log(`   Errors: ${entry.validationErrors?.length || 0}`);
          console.log(`   Types: ${entry.searchable?.errorTypes?.join(', ') || 'N/A'}`);
          console.log(`   Issues: ${entry.searchable?.commonIssues?.join(', ') || 'N/A'}`);
        });
        break;
    }
    
  } catch (error) {
    console.error('❌ Error analyzing logs:', error.message);
    process.exit(1);
  }
}

main();
