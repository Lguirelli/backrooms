# Patch — material do teto

Inclui apenas:

```txt
three-background.js
assets/ceiling-texture.png
README_PATCH.md
```

Alterações:
- usa a textura enviada como material do teto
- aplica a textura apenas nas partes do teto que **não são luz**
- mantém as áreas de luz com material emissivo
- mantém o restante da lógica atual do GLTF e da câmera
