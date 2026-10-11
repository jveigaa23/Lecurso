import { ArrowUpRight } from "lucide-react";
import { ExternalButton } from "@/components/ui/button";
import { WhatsappIcon } from "@/components/ui/icons";
import { whatsappLink } from "@/lib/format";
import { cn } from "@/lib/cn";

type Props = {
  courseTitle: string;
  purchaseUrl: string | null;
  whatsappNumber: string | null;
  className?: string;
  compact?: boolean;
};

/**
 * Ação de compra do curso:
 * 1. link de compra configurado (já validado: https + domínio autorizado);
 * 2. senão, WhatsApp com mensagem sobre o curso;
 * 3. senão, aviso de indisponibilidade (sem botão falso).
 * O clique não é registrado como venda — a confirmação é responsabilidade da plataforma de pagamento.
 */
export function PurchaseCta({ courseTitle, purchaseUrl, whatsappNumber, className, compact }: Props) {
  const size = compact ? "md" : "lg";
  if (purchaseUrl) {
    return (
      <ExternalButton href={purchaseUrl} size={size} className={cn("w-full", className)} data-testid="purchase-link">
        Garantir minha vaga
        <ArrowUpRight className="size-4" aria-hidden />
        <span className="sr-only">(abre a página de pagamento em nova aba)</span>
      </ExternalButton>
    );
  }
  const whatsapp = whatsappLink(whatsappNumber, `Olá! Tenho interesse no curso "${courseTitle}".`);
  if (whatsapp) {
    return (
      <ExternalButton href={whatsapp} size={size} className={cn("w-full", className)} data-testid="whatsapp-cta">
        <WhatsappIcon className="size-4" />
        Quero me inscrever
        <span className="sr-only">(abre o WhatsApp em nova aba)</span>
      </ExternalButton>
    );
  }
  return (
    <p
      className={cn("rounded-2xl border border-line px-4 py-3 text-center text-sm text-soft", className)}
      data-testid="purchase-unavailable"
    >
      Inscrições ainda não abertas para este curso.
    </p>
  );
}
