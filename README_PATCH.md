# Patch GitHub Pages

Este patch corrige o erro de deploy concorrente no GitHub Pages.

## Arquivos incluídos

```txt
.github/workflows/deploy.yml
.nojekyll
```

## Como aplicar

Copie os arquivos para a raiz do repositório e faça commit.

O workflow usa:

```yml
concurrency:
  group: pages
  cancel-in-progress: true
```

Isso cancela automaticamente um deploy anterior ainda em andamento antes de iniciar o novo.
