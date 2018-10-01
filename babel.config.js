module.exports = {
  presets: [
    '@babel/preset-react',
    [
      '@babel/preset-env',
      {
        targets: {
          browsers: 'last 1 Chrome versions',
        },
      },
    ],
  ],
  plugins: [
    [
      '@babel/plugin-proposal-decorators',
      { legacy: true },
    ],
    [
      '@babel/plugin-proposal-class-properties',
      { loose: true },
    ],
    '@babel/plugin-syntax-object-rest-spread',
    'emotion',
  ],
};
