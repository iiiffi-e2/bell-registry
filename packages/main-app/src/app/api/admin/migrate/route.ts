import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    // Security check - only allow in development or with specific token
    const { token } = await request.json();
    if (process.env.NODE_ENV === 'production' && token !== process.env.MIGRATION_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Running database migration...');
    
    // Run the migration command
    const { stdout, stderr } = await execAsync('cd ../shared && npx prisma migrate deploy', {
      env: { ...process.env }
    });

    console.log('Migration output:', stdout);
    if (stderr) {
      console.error('Migration stderr:', stderr);
    }

    return NextResponse.json({ 
      success: true, 
      output: stdout,
      stderr: stderr || null
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({ 
      error: 'Migration failed', 
      details: error.message 
    }, { status: 500 });
  }
} 