const replacements: Array<[RegExp, string]> = [
  [/â€¢/g, '•'],
  [/â€¦/g, '…'],
  [/â€“/g, '–'],
  [/â€”/g, '—'],
  [/Ä›/g, 'ě'],
  [/Ä/g, 'Ě'],
  [/ÄŤ/g, 'č'],
  [/ÄŒ/g, 'Č'],
  [/ÄŽ/g, 'Ď'],
  [/ÄŹ/g, 'ď'],
  [/Ĺ™/g, 'ř'],
  [/Ĺ/g, 'Ř'],
  [/Ĺˇ/g, 'š'],
  [/Ĺ /g, 'Š'],
  [/Ĺľ/g, 'ž'],
  [/Ĺ˝/g, 'Ž'],
  [/ĹŻ/g, 'ů'],
  [/Ĺ®/g, 'Ů'],
  [/Ăˇ/g, 'á'],
  [/Ă/g, 'Á'],
  [/Ă©/g, 'é'],
  [/Ă/g, 'É'],
  [/Ă­/g, 'í'],
  [/Ă/g, 'Í'],
  [/Ă˝/g, 'ý'],
  [/Ă/g, 'Ý'],
  [/ĂĽ/g, 'ü'],
];

export const sanitizeText = (value: string): string => {
  return replacements.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value);
};
