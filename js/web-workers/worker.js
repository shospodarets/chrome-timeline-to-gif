self.addEventListener('message', function (e) {
    console.log('Message received in worker', e);
    self.postMessage(e.data);
}, false);