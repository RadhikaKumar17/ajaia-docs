import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import DocumentEditor from "@/components/DocumentEditor";

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  return <DocumentEditor id={id} />;
}
