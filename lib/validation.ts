// Validador de NIF português (Número de Identificação Fiscal)
// Algoritmo oficial de módulo 11 da Autoridade Tributária
export function isValidNif(nif: string): boolean {
  const cleanNif = nif.trim().replace(/\s+/g, "");

  // Tem de ter exatamente 9 dígitos numéricos
  if (!/^\d{9}$/.test(cleanNif)) {
    return false;
  }

  // Primeiro dígito tem de ser válido em Portugal:
  // 1, 2, 3: Pessoas singulares
  // 5: Pessoas coletivas (empresas)
  // 6: Organismos da administração pública
  // 8: Empresários em nome individual e outras entidades
  // 9: Pessoas coletivas irregulares ou número provisório
  const firstDigit = cleanNif.charAt(0);
  if (!["1", "2", "3", "5", "6", "8", "9"].includes(firstDigit)) {
    return false;
  }

  // Cálculo do dígito de controlo
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += Number.parseInt(cleanNif.charAt(i), 10) * (9 - i);
  }

  const remainder = sum % 11;
  const checkDigit = remainder === 0 || remainder === 1 ? 0 : 11 - remainder;

  return checkDigit === Number.parseInt(cleanNif.charAt(8), 10);
}
