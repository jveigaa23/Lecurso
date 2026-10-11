"use client";

/** <select> que envia o formulário ao mudar (o botão "Aplicar" continua disponível sem JS). */
export function AutoSubmitSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} onChange={(event) => event.currentTarget.form?.requestSubmit()} />;
}
