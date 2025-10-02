/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Candidates | The Bell Registry",
  description: "Manage your candidate interactions",
};

export default function CandidatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 