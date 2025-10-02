/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma, adminAuthOptions, logAdminAction } from "@bell-registry/shared";
import { UserRole } from "@bell-registry/shared";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(adminAuthOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Log this admin action
    await logAdminAction(
      session.user.id,
      "VIEW_BILLING",
      { endpoint: "/api/billing" },
      request.ip,
      request.headers.get("user-agent") || undefined
    );

    // Get query parameters for filtering and pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status'); // Filter by billing status
    const subscriptionType = searchParams.get('subscriptionType'); // Filter by subscription type
    const search = searchParams.get('search'); // Search in company name or user email

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      employerProfile: {
        user: { isDeleted: false }
      }
    };

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (subscriptionType && subscriptionType !== 'ALL') {
      where.subscriptionType = subscriptionType;
    }

    if (search) {
      where.OR = [
        { employerProfile: { companyName: { contains: search, mode: 'insensitive' } } },
        { employerProfile: { user: { email: { contains: search, mode: 'insensitive' } } } },
        { employerProfile: { user: { firstName: { contains: search, mode: 'insensitive' } } } },
        { employerProfile: { user: { lastName: { contains: search, mode: 'insensitive' } } } }
      ];
    }

    // Fetch billing records with employer and user information
    const [billingRecords, totalCount] = await Promise.all([
      prisma.billingHistory.findMany({
        where,
        include: {
          employerProfile: {
            select: {
              id: true,
              companyName: true,
              industry: true,
              subscriptionType: true,
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  role: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.billingHistory.count({ where })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    // Get summary statistics
    const [totalRevenue, monthlyRevenue, completedTransactions, pendingTransactions] = await Promise.all([
      prisma.billingHistory.aggregate({
        where: { 
          status: 'COMPLETED',
          employerProfile: { user: { isDeleted: false } }
        },
        _sum: { amount: true }
      }),
      prisma.billingHistory.aggregate({
        where: { 
          status: 'COMPLETED',
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          },
          employerProfile: { user: { isDeleted: false } }
        },
        _sum: { amount: true }
      }),
      prisma.billingHistory.count({
        where: { 
          status: 'COMPLETED',
          employerProfile: { user: { isDeleted: false } }
        }
      }),
      prisma.billingHistory.count({
        where: { 
          status: 'PENDING',
          employerProfile: { user: { isDeleted: false } }
        }
      })
    ]);

    return NextResponse.json({
      billingRecords,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      summary: {
        totalRevenue: totalRevenue._sum.amount || 0,
        monthlyRevenue: monthlyRevenue._sum.amount || 0,
        completedTransactions,
        pendingTransactions
      }
    });
  } catch (error) {
    console.error("Error fetching billing records:", error);
    return NextResponse.json(
      { error: "Failed to fetch billing records" },
      { status: 500 }
    );
  }
}
