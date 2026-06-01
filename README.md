# Oregon 811 — landing page estática com GLB corrigido

Versão sem npm, com HTML, CSS e JavaScript puro.

## Como publicar no GitHub Pages

Suba o conteúdo desta pasta na raiz do repositório:

```txt
/
├─ index.html
├─ styles.css
├─ script.js
├─ three-background.js
├─ README.md
└─ assets/
   ├─ backrooms.glb
   └─ planta-implantacao-oregon-811.png
```

Depois ative:

```txt
Settings → Pages → Deploy from branch → main → /root
```

## Como testar localmente

O GLB e o Three.js usam módulo ES. Evite abrir direto com `file://`.

Use:

```bash
python -m http.server 8000
```

Depois acesse:

```txt
http://localhost:8000
```

## Correções desta versão

- GLB no fundo com z-index e renderização corrigidos.
- Fallback 3D automático caso o arquivo GLB falhe.
- Estética alinhada ao storytelling: imóvel corporativo real, raro e funcional, com estranhamento sutil.
- Textos revisados com foco em ocupação, continuidade, permanência, rota indicada e escala incomum.
- Responsivo para celular.

- nova seção "Possibilidades" com fade entre imagens reais de ocupação

- fundos e boxes transparentes para destacar o canvas 3D em movimento


## Patch aplicado para o GLB aparecer

Este patch corrige o carregamento do Three.js no navegador.

O problema mais provável era o `GLTFLoader.js` importar `three` como módulo interno sem um `importmap`, fazendo o navegador travar antes de renderizar o GLB.

Arquivos alterados:

```txt
index.html
three-background.js
README.md
```

Não inclui assets.

Mantenha o arquivo abaixo no repositório:

```txt
assets/backrooms.glb
```
