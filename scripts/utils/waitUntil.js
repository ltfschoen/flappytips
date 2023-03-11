const waitUntil = (condition, checkInterval=5000) => {
    return new Promise(resolve => {
        let interval = setInterval(() => {
            console.log('Waiting...');
            if (!condition()) return;
            clearInterval(interval);
            resolve();
        }, checkInterval);
    });
}

module.exports = {
    waitUntil
}
