import WarRoomShell from "@/components/WarRoomShell";
export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <WarRoomShell>{children}</WarRoomShell>;
}
