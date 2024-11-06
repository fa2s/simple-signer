const signer = new SimpleSigner();
signer.mode = 'production'

signer.documents = [
    'http://example.com/contract.pdf'
];

signer.then((data) => {
    console.log('Signed!');
})

signer.catch((data) => {
    console.log('Failed');
})

signer.parent = 'element';
signer.mount('element');