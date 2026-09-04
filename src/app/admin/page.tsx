import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AdminDashboard from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // Настоящая проверка подписи сессии (Node.js runtime) — middleware в Edge
  // делает только предварительный редирект по наличию cookie.
  if (!isAdminAuthenticated()) {
    redirect("/admin/login");
  }

  const [needsAttention, pendingRestaurants, pendingReviews] = await Promise.all([
    prisma.restaurant.findMany({
      where: { status: "NEEDS_ATTENTION" },
      orderBy: { createdAt: "asc" },
      include: { reviews: { orderBy: { createdAt: "asc" }, take: 1 } },
    }),
    prisma.restaurant.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      include: { reviews: { orderBy: { createdAt: "asc" }, take: 1 } },
    }),
    prisma.review.findMany({
      where: { status: "PENDING", restaurant: { status: "APPROVED" } },
      orderBy: { createdAt: "asc" },
      include: {
        restaurant: { select: { id: true, name: true, addressResolved: true, addressInput: true } },
      },
    }),
  ]);

  return (
    <AdminDashboard
      initialNeedsAttention={JSON.parse(JSON.stringify(needsAttention))}
      initialPendingRestaurants={JSON.parse(JSON.stringify(pendingRestaurants))}
      initialPendingReviews={JSON.parse(JSON.stringify(pendingReviews))}
    />
  );
}
