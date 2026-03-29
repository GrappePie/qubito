import {NextRequest, NextResponse} from "next/server";
import {connectToDatabase} from "@/lib/mongodb";
import {getTenantIdFromRequest} from "@/lib/tenant";
import {requireAuth} from "@/lib/apiAuth";
import OrderModel from "@/models/Order";

export async function GET(req: NextRequest) {
    try{
        await connectToDatabase();

        const auth = await requireAuth(req);
        if (!auth.ok) return auth.res;
        const tenant = auth.ctx.account.tenantId || getTenantIdFromRequest(req);
        const orders = await OrderModel.find({ tenantId: tenant, status: "pending" }).lean();
        return NextResponse.json(orders);
    }
    catch (error) {
        console.error("GET /api/orders error", error);
        return NextResponse.json({error: "Error al acceder a la API de órdenes"+error}, {status: 500});
    }
}