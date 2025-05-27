import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register - Bell Registry",
  description: "Create your Bell Registry account",
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 