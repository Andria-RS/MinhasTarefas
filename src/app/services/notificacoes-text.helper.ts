export function construirMensagemNotificacao(
  titulo: string,
  dueDate: string,
  dueTime?: string
): string {
  const agora = new Date();
  const alvo = new Date(dueDate + 'T' + (dueTime ?? '00:00:00'));

  const hoje = new Date(agora);
  hoje.setHours(0, 0, 0, 0);

  const diaAlvo = new Date(alvo);
  diaAlvo.setHours(0, 0, 0, 0);

  const diffMs = diaAlvo.getTime() - hoje.getTime();
  const diffDias = Math.round(diffMs / (1000 * 60 * 60 * 24));

  let parteDia: string;

  if (diffDias === 0) {
    parteDia = 'hoje';
  } else if (diffDias === 1) {
    parteDia = 'amanhã';
  } else if (diffDias > 1) {
    parteDia = `em ${diffDias} dias`;
  } else {
    parteDia = 'já terminou';
  }

  const horaFormatada = alvo.toLocaleTimeString('pt-PT', {
    hour: '2-digit',
    minute: '2-digit'
  });

  if (parteDia === 'já terminou') {
    return `A tarefa "${titulo}" já terminou às ${horaFormatada}`;
  }

  return `A tarefa "${titulo}" termina ${parteDia} às ${horaFormatada}`;
}
