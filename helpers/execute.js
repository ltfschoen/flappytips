const { execSync } = require('child_process');

/**
 * Duplicate of https://github.com/polkadot-js/dev/blob/master/packages/dev/scripts/execSync.js
 */
function execute(cmd, noLog) {
  !noLog && console.log(`$ ${cmd}`);

  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch (error) {
    process.exit(-1);
  }
};

module.exports = {
  execute
}
