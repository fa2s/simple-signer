# Proposta de funcionamento

1. A aplicação cliente monta o componente na sua página:

```html
<html>
    <head>
    <script type='text/javascript' src='signer.min.js'></script>
    </head>

    <body>
        <div id='signer'>
        </div>

        <script type='text/javascript'>
            // Create signer component
            const signer = new Signer();

            // Options: [ development, staging ]
            signer.mode = 'staging'

            // Documents to be signed
            signer.contents  = [
              {
                name: 'Termo de Uso',
                url: 'http://example.com/tou.pdf',
              },
              {
                name: 'Contrato de Prestação de Serviço',
                url: 'http://example.com/contract.pdf',
              },
            ];


            // Callback when everything is ok. Lookd at Open API spec to see data object
            signer.then((data) => {
                console.log('Signed!');
            })

            // Callback when something failed. Lookd at Open API spec to see data object
            signer.catch((data) => {
                console.log('Failed');
            })

            // Callback for both sucess and failed. No object provided
            signer.finally(() => {
              console.log('Always');
            });

            // Mount sign component at page. Pass element query selector
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
