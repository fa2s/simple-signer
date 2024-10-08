# Proposta de funcionamento

1. A aplicação cliente monta o componente na sua página:

```html
<html>
    <head>
    <script type='text/javascript' src='simple-signer.js'></script>
    </head>

    <body>
        <div id='signer'>
        </div>

        <script type='text/javascript'>
            // Create signer component
            const signer = new SimpleSigner();

            // Options: [ sandbox, production ]
            signer.mode = 'production'

            // Documents to be signed
            signer.contents = [
                'http://example.com/terms-of-use.pdf',
                'http://example.com/contract.pdf'
            ];

            // Callback when everything is ok. Lookd at Open API spec to see data object
            signer.then((data) => {
                console.log('Signed!');
            })

            // Callback when something failed. Lookd at Open API spec to see data object
            signer.catch((data) => {
                console.log('Failed');
            })

            // Mount sign component at page. Pass element dom ID where the component is going to be mounted
            signer.mount('#signer');
        </script>
    </body>
</html>
```

2. O componente captura os dados NOME e CPF e envia para o servidor junto com a URL do termo a ser aceito
3. O servidor baixa o termo, caso já não o tenha feito, e cálcula o _hash_ do arquivo
4. O servidor registra a assinatura do cliente
5. O servidor retorna com código de sucesso para o componente
6. O cliente reage à assinatura indo para a próxima etapa do seu processo de onboarding
7. [Opcional] O cliente envia para o servidor um comprovante para ser anexado à assinatura, por exemplo, comprovante de endereço. Consultar API
