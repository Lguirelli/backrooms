# Oregon 811 — versão estática com fundo 3D por scroll

Esta versão roda sem npm.

## Como abrir

Por causa do carregamento do arquivo `.glb`, o ideal é usar um servidor local simples.

### Opção 1
Abra com a extensão **Live Server** no VS Code.

### Opção 2
Use Python:

```bash
python -m http.server 8000
```

Depois abra:

```text
http://localhost:8000
```

## Estrutura

- `index.html`
- `styles.css`
- `script.js`
- `three-background.js`
- `assets/backrooms.glb`
- `assets/planta-implantacao-oregon-811.png`

## Incluído nesta versão

- landing page responsiva para desktop e celular
- fundo 3D com movimento de câmera seguindo o scroll
- planta de implantação baseada na referência enviada
- sem npm e sem build
- Three.js carregado via CDN
