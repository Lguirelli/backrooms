# Patch Unidade 811 — câmera do GLB no scroll e fade automático

Arquivos incluídos neste patch:

```txt
index.html
styles.css
script.js
three-background.js
README.md
```

Não inclui assets.

Mantenha o modelo original neste caminho:

```txt
assets/backrooms.glb
```

Correções:

- o GLB não é mais centralizado, escalado ou rotacionado via código
- a câmera exportada do GLB é usada diretamente
- a animação de câmera do GLB é conectada ao scroll com `mixer.setTime(progress * duration)`
- o fundo recebeu tratamento cinematográfico sem esconder o modelo
- o fade das imagens da seção Possibilidades roda automaticamente após alguns segundos
- o nome visível permanece como Unidade 811


## Patch final de correção

Arquivos incluídos:

```txt
index.html
styles.css
script.js
three-background.js
README.md
assets/hero-right.png
```

Correções:

- cria o box real com a imagem da fachada à direita do hero
- preserva materiais originais do GLB
- não centraliza, não escala e não rotaciona o GLB
- usa a câmera exportada do GLB
- mapeia 0% do scroll para o início da animação e 100% do scroll para o final
- fade automático das imagens da seção Possibilidades sem depender de hover
- não inclui o GLB nem as imagens de Possibilidades
