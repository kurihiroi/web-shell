module.exports = {
  // Biomeによるフォーマットとリント
  '**/*.{js,jsx,ts,tsx}': ['biome check --apply', 'biome format --write'],

  // CSSファイルはformatのみ
  '**/*.css': ['biome format --write'],

  // JSONファイルのフォーマット
  '**/*.json': ['biome format --write'],

  // MarkdownファイルはBiomeでの対応なし
  '**/*.md': [],
};
