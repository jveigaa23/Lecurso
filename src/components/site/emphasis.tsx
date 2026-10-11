/**
 * Permite destacar palavras em títulos editáveis usando *asteriscos*.
 * Ex.: "A técnica por trás de cada *corte*." → "corte" em itálico serifado.
 */
export function Emphasis({ text }: { text: string }) {
  const parts = text.split(/(\*[^*]+\*)/g).filter(Boolean);
  return (
    <>
      {parts.map((part, index) =>
        part.startsWith("*") && part.endsWith("*") ? (
          <em key={index} className="font-serif font-normal italic tracking-normal text-gold [font-stretch:100%]">
            {part.slice(1, -1)}
          </em>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}

export function stripEmphasis(text: string): string {
  return text.replace(/\*([^*]+)\*/g, "$1");
}
