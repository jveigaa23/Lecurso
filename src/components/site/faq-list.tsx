import { Plus } from "lucide-react";
import type { FaqItem } from "@/db/schema";

/** FAQ acessível com <details>: funciona sem JavaScript e por teclado. */
export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((item) => (
        <details key={item.question} className="group py-1">
          <summary className="flex items-center justify-between gap-6 py-5 text-left text-base font-medium text-paper sm:text-lg">
            {item.question}
            <Plus
              aria-hidden
              className="size-5 shrink-0 text-gold transition-transform duration-300 group-open:rotate-45"
            />
          </summary>
          <div className="prose-site pb-6 pr-10 text-[0.95rem]">
            {item.answer.split(/\n{2,}/).map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}
