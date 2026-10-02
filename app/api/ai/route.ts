import { claudeClient, claudeModel } from "@/lib/claude";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Recebe o prompt montado pelo portal (regras + dados + pergunta) e devolve o texto em streaming.
export async function POST(req: Request) {
  const { prompt, web } = await req.json().catch(() => ({}));
  if (typeof prompt !== "string" || !prompt.trim() || prompt.length > 200_000) {
    return new Response("Pergunta inválida", { status: 400 });
  }
  const client = claudeClient();
  if (!client) {
    return new Response(
      "A chave ANTHROPIC_API_KEY ainda não está no servidor. O restante do portal funciona. Quando a chave estiver no .env.local, o assistente responde aqui.",
      { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } }
    );
  }
  const model = claudeModel();

  const stream = client.messages.stream({
    model,
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
    // A busca na internet só é ligada no botão "Notícias dos meus ativos".
    ...(web ? { tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 5 }] as any } : {}),
  });

  const encoder = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (e) {
        controller.enqueue(encoder.encode("\n\n[Erro ao gerar a resposta. Confira a ANTHROPIC_API_KEY e o ANTHROPIC_MODEL.]"));
      } finally {
        controller.close();
      }
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}
