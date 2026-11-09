const backend = require('./backend');

module.exports = async () => {
    await backend.stop();
};
