# Unidade 811 — landing page estática com GLB corrigido

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
   └─ planta-implantacao-unidade-811.png
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


## Patch Unidade 811

Este patch atualiza:

```txt
index.html
styles.css
script.js
three-background.js
assets/backrooms.glb
README.md
```

Ajustes feitos:

- nome visível do projeto alterado para Unidade 811
- GLB original substitui o fundo 3D atual
- movimento de câmera do GLB conectado ao scroll
- renderização mais cinematográfica com ACES, fog, luz fluorescente e contraste controlado
- fade da seção Possibilidades corrigido com script robusto após DOMContentLoaded
