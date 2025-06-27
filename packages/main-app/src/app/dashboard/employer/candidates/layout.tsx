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