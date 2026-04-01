/**
 * file: supabase/functions/create-payos-order/index.ts
 */
import "@supabase/functions-js/edge-runtime.d.ts"
// ĐIỂM "ĂN TIỀN" Ở ĐÂY: Sử dụng esm.sh thay vì npm:
import PayOS from "https://esm.sh/@payos/node@1.0.7"

// Cấu hình CORS để cho phép Frontend gọi API từ trình duyệt
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // 1. Xử lý Preflight request cho CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Nhận dữ liệu số tiền từ Frontend
    const { amount } = await req.json();

    // 3. Khởi tạo PayOS (Lần này chắc chắn sẽ thành công)
    const payos = new PayOS(
      Deno.env.get("PAYOS_CLIENT_ID")!,
      Deno.env.get("PAYOS_API_KEY")!,
      Deno.env.get("PAYOS_CHECKSUM_KEY")!
    );

    // 4. Tạo mã đơn hàng duy nhất
    const orderCode = Number(Date.now().toString().slice(-9));

    // 5. Cấu hình chi tiết đơn hàng nạp tiền
    const paymentLinkRes = await payos.createPaymentLink({
      orderCode: orderCode,
      amount: amount,
      description: `Ducky Cheat: Nap tien`,
      returnUrl: `${req.headers.get("origin")}/wallet?status=success`,
      cancelUrl: `${req.headers.get("origin")}/wallet?status=cancel`,
    });

    // 6. Trả kết quả link thanh toán về Frontend
    return new Response(JSON.stringify(paymentLinkRes), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    // Xử lý và trả về lỗi nếu có
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
})