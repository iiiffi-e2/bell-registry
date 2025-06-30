import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    
    // Security check
    if (token !== process.env.MIGRATION_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Import the prisma migrate function
    const { execSync } = require('child_process');
    
    console.log('Running database migration...');
    
    // Run the migration command
    const output = execSync('cd ../../packages/shared && npx prisma migrate deploy', {
      encoding: 'utf8',
      env: { ...process.env }
    });

    console.log('Migration output:', output);

    return NextResponse.json({ 
      success: true, 
      output: output
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({ 
      error: 'Migration failed', 
      details: error.message,
      output: error.stdout || null,
      stderr: error.stderr || null
    }, { status: 500 });
  }
} 