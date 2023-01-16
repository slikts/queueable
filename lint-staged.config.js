module.exports = {
  '**/*': 'prettier --write --ignore-unknown',
  '**/*.ts': 'eslint --cache --fix',
};
